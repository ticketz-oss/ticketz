import QueueIntegration from "../../models/QueueIntegration";
import { ChatIntegrationFactory } from "../ChatIntegrationService/ChatIntegrationFactory";
import { ChatMessage, ChatSession, IChatIntegrationProvider } from "../ChatIntegrationService/IChatIntegrationProvider";
import { logger } from "../../utils/logger";

interface ProcessMessageParams {
  ticketId: number;
  queueId: number;
  contactId: string | number;
  body: string;
  timestamp: Date;
  messageId: string | number;
}

class ChatIntegrationService {
  private activeIntegrations: Map<number, IChatIntegrationProvider> = new Map();
  private activeSessions: Map<number, ChatSession> = new Map();
  public async init(): Promise<void> {
    // Carrega integrações ativas do banco de dados
    try {
      const integrations = await QueueIntegration.findAll({
        where: { active: true }
      });

      logger.info(`Carregando ${integrations.length} integrações de chat ativas`);
      
      // Inicializa provedores para integrações ativas
      for (const integration of integrations) {
        try {
          logger.info(`Inicializando integração ${integration.provider} para fila ${integration.queueId}`);
          logger.info(`Webhook URL: ${integration.webhookUrl}, settings: ${JSON.stringify(integration.settings)}`);
            // If using N8n provider, ensure webhookUrl is correctly passed in settings
          const settings = {...integration.settings};
          if (integration.provider === 'n8n' && integration.webhookUrl) {
            // Extract webhookId from full URL if it contains /webhook/
            let webhookId = integration.webhookUrl;
            if (integration.webhookUrl.includes('/webhook/')) {
              webhookId = integration.webhookUrl.split('/webhook/')[1];
            }
            settings.webhookId = webhookId;
            
            // Set baseUrl if not provided in settings
            if (!settings.baseUrl) {
              if (integration.webhookUrl.includes('/webhook/')) {
                settings.baseUrl = integration.webhookUrl.split('/webhook/')[0];
              } else {
                // Default fallback
                settings.baseUrl = 'https://n8n.plusia.com.br';
              }
            }
            
            // Pass the full webhook URL directly
            settings.fullWebhookUrl = integration.webhookUrl;
            
            logger.info(`N8n integration settings: baseUrl=${settings.baseUrl}, webhookId=${settings.webhookId}, fullWebhookUrl=${settings.fullWebhookUrl}`);
          }
          
          const provider = ChatIntegrationFactory.createProvider(
            integration.provider,
            settings
          );
          
          this.activeIntegrations.set(integration.queueId, provider);
          logger.info(`Integração ${integration.provider} para fila ${integration.queueId} carregada com sucesso`);
        } catch (error) {
          logger.error(
            `Erro ao inicializar provedor ${integration.provider} para fila ${integration.queueId}: ${error}`
          );
        }
      }
    } catch (error) {
      logger.error(`Erro ao carregar integrações: ${error}`);
    }
  }

  public async hasActiveIntegration(queueId: number): Promise<boolean> {
    return this.activeIntegrations.has(queueId);
  }
  public async initializeChat(
    ticketId: number,
    queueId: number,
    conversationId: string
  ): Promise<boolean> {
    try {
      const provider = this.activeIntegrations.get(queueId);
      
      if (!provider) {
        logger.info(`Sem integração ativa para fila ${queueId}`);
        return false;
      }

      logger.info(`Initializing chat for ticket ${ticketId} in queue ${queueId} with conversationId ${conversationId}`);

      const session: ChatSession = {
        id: `${ticketId}`,
        conversationId,
        ticketId,
        queueId,
        status: 'active'
      };

      // Obter a integração do banco de dados para obter as configurações
      const integration = await QueueIntegration.findOne({
        where: { queueId, active: true }
      });

      if (!integration) {
        logger.warn(`Integração para fila ${queueId} não encontrada ou inativa`);
        return false;
      }

      logger.info(`Found integration for queue ${queueId}: ${integration.name} (${integration.provider})`);
      logger.info(`Integration webhook URL: ${integration.webhookUrl}`);

      await provider.initializeChat(session, integration.settings);
      
      // Armazenar sessão ativa
      this.activeSessions.set(ticketId, session);
      
      logger.info(`Chat inicializado para ticket ${ticketId} na fila ${queueId}`);
      return true;
    } catch (error) {
      logger.error(`Erro ao inicializar chat para ticket ${ticketId}: ${error}`);
      return false;
    }
  }  public async processIncomingMessage({
    ticketId,
    queueId,
    contactId,
    body,
    timestamp,
    messageId
  }: ProcessMessageParams): Promise<boolean> {
    try {
      logger.info(`Processing incoming message for ticket ${ticketId}, queue ${queueId}, messageId ${messageId}`);
      
      let session = this.activeSessions.get(ticketId);
      const provider = this.activeIntegrations.get(queueId);
      
      // Log active integrations for debugging
      logger.info(`Active integrations: ${Array.from(this.activeIntegrations.keys()).join(', ')}`);
      logger.info(`Active sessions: ${Array.from(this.activeSessions.keys()).join(', ')}`);
      
      // Se não tiver provedor para esta fila, não processar externamente
      if (!provider) {
        logger.warn(`No integration provider found for queue ${queueId}`);
        // Se havia uma sessão ativa para este ticket mas agora está em uma fila sem integração,
        // precisamos encerrar a sessão anterior
        if (session && session.queueId !== queueId) {
          logger.info(`Ticket ${ticketId} movido para fila ${queueId} sem integração. Encerrando sessão externa.`);
          await this.closeChat(ticketId);
        }
        return false;
      }

      // Se existe sessão mas mudou de fila (para outra fila com integração)
      if (session && session.queueId !== queueId) {
        logger.info(`Ticket ${ticketId} movido da fila ${session.queueId} para ${queueId}. Atualizando sessão.`);
        // Fecha a sessão antiga
        await this.closeChat(ticketId);
        // Cria nova sessão
        session = null;
      }

      if (!session) {
        // Se a sessão não existir, tentar inicializá-la
        const initialized = await this.initializeChat(
          ticketId,
          queueId,
          contactId.toString()
        );
        
        if (!initialized) {
          return false;
        }
        
        session = this.activeSessions.get(ticketId);
      }

      if (session) {
        const message: ChatMessage = {
          content: body,
          senderId: contactId.toString(),
          timestamp,
          metadata: { messageId }
        };

        await provider.processIncomingMessage(session, message);
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Erro ao processar mensagem para ticket ${ticketId}: ${error}`);
      return false;
    }
  }

  public async sendMessage(
    ticketId: number,
    content: string,
    senderId: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const session = this.activeSessions.get(ticketId);
      
      if (!session) {
        logger.warn(`Tentativa de enviar mensagem para sessão inexistente. Ticket: ${ticketId}`);
        return false;
      }

      const provider = this.activeIntegrations.get(session.queueId);
      
      if (!provider) {
        return false;
      }

      const message: ChatMessage = {
        content,
        senderId,
        timestamp: new Date(),
        metadata
      };

      await provider.sendMessage(session, message);
      return true;
    } catch (error) {
      logger.error(`Erro ao enviar mensagem para ticket ${ticketId}: ${error}`);
      return false;
    }
  }

  public async transferToHuman(
    ticketId: number,
    agentId?: string
  ): Promise<boolean> {
    try {
      const session = this.activeSessions.get(ticketId);
      
      if (!session) {
        logger.warn(`Tentativa de transferir sessão inexistente. Ticket: ${ticketId}`);
        return false;
      }

      const provider = this.activeIntegrations.get(session.queueId);
      
      if (!provider) {
        return false;
      }

      await provider.transferToHuman(session, agentId);
      
      // Limpar sessão após transferência
      this.activeSessions.delete(ticketId);
      
      logger.info(`Ticket ${ticketId} transferido para atendente ${agentId || 'não especificado'}`);
      return true;
    } catch (error) {
      logger.error(`Erro ao transferir para humano o ticket ${ticketId}: ${error}`);
      return false;
    }
  }

  public async closeChat(ticketId: number): Promise<boolean> {
    try {
      const session = this.activeSessions.get(ticketId);
      
      if (!session) {
        logger.warn(`Tentativa de fechar sessão inexistente. Ticket: ${ticketId}`);
        return false;
      }

      const provider = this.activeIntegrations.get(session.queueId);
      
      if (!provider) {
        return false;
      }

      await provider.closeChat(session);
      
      // Limpar sessão após fechamento
      this.activeSessions.delete(ticketId);
      
      logger.info(`Chat fechado para ticket ${ticketId}`);
      return true;
    } catch (error) {
      logger.error(`Erro ao fechar chat para ticket ${ticketId}: ${error}`);
      return false;
    }
  }
  public async refreshIntegrations(): Promise<void> {
    // Limpar integrações atuais
    this.activeIntegrations.clear();
    
    // Recarregar integrações
    await this.init();
  }

  /**
   * Gerencia a mudança de fila de um ticket
   * Se o ticket for movido para uma fila sem integração, encerra a sessão externa
   * Se for movido para outra fila com integração, reinicia a sessão
   */
  public async handleQueueChange(
    ticketId: number, 
    oldQueueId: number | null, 
    newQueueId: number | null
  ): Promise<void> {
    logger.info(`Ticket ${ticketId} mudou de fila ${oldQueueId} para ${newQueueId}`);
    
    // Se estava em uma fila e tinha sessão ativa
    const session = this.activeSessions.get(ticketId);
    
    // Caso 1: Ticket tinha sessão e foi movido para uma fila sem integração
    if (session && (!newQueueId || !this.activeIntegrations.has(newQueueId))) {
      logger.info(`Ticket ${ticketId} movido para fila sem integração. Encerrando sessão externa.`);
      await this.closeChat(ticketId);
      return;
    }
    
    // Caso 2: Ticket estava em fila sem integração e foi movido para fila com integração
    if (!session && newQueueId && this.activeIntegrations.has(newQueueId)) {
      // Será inicializado quando chegar a próxima mensagem
      logger.info(`Ticket ${ticketId} movido para fila com integração. Sessão será inicializada na próxima mensagem.`);
      return;
    }
    
    // Caso 3: Ticket mudou de uma fila com integração para outra fila com integração
    if (session && newQueueId && this.activeIntegrations.has(newQueueId) && oldQueueId !== newQueueId) {
      logger.info(`Ticket ${ticketId} movido entre filas com integração. Reiniciando sessão.`);
      // Encerra a sessão anterior
      await this.closeChat(ticketId);
      // A nova sessão será inicializada quando chegar a próxima mensagem
    }
  }
}

// Criar instância singleton do serviço
const chatIntegrationService = new ChatIntegrationService();

export default chatIntegrationService;
