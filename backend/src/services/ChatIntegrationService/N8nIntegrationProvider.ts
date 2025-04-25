import axios from 'axios';
import { IChatIntegrationProvider, ChatMessage, ChatSession } from './IChatIntegrationProvider';
import { logger } from '../../utils/logger';

export class N8nIntegrationProvider implements IChatIntegrationProvider {
  private baseUrl: string;
  private apiKey: string;
  private webhookId: string;
  private fullWebhookUrl: string;

  constructor(settings: Record<string, any>) {
    this.baseUrl = settings.baseUrl || '';
    this.apiKey = settings.apiKey || '';
    this.webhookId = settings.webhookId || '';
    this.fullWebhookUrl = settings.fullWebhookUrl || '';
    
    // Log configuration for debugging
    logger.info(`N8nIntegrationProvider initialized with: baseUrl=${this.baseUrl}, webhookId=${this.webhookId}, fullWebhookUrl=${this.fullWebhookUrl}`);
  }

  async initializeChat(session: ChatSession, settings: Record<string, any>): Promise<void> {
    try {
      // Use fullWebhookUrl directly if available, otherwise construct from baseUrl and webhookId
      const webhookUrl = this.fullWebhookUrl || `${this.baseUrl}/webhook/${this.webhookId}`;
      logger.info(`Sending initialize chat request to: ${webhookUrl}`);
      
      await axios.post(webhookUrl, {
        action: 'start',
        sessionId: session.id,
        conversationId: session.conversationId,
        ticketId: session.ticketId,
        queueId: session.queueId
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      logger.info(`Initialized N8n chat session for ticket ${session.ticketId}`);
    } catch (error) {
      logger.error(`Error initializing N8n chat: ${error}`);
      throw new Error('Failed to initialize chat with N8n');
    }
  }
  async processIncomingMessage(session: ChatSession, message: ChatMessage): Promise<void> {
    try {
      // Use fullWebhookUrl directly if available, otherwise construct from baseUrl and webhookId
      const webhookUrl = this.fullWebhookUrl || `${this.baseUrl}/webhook/${this.webhookId}`;
      logger.info(`Sending processIncomingMessage request to: ${webhookUrl}`);
      
      await axios.post(webhookUrl, {
        action: 'message',
        sessionId: session.id,
        message: {
          content: message.content,
          senderId: message.senderId,
          timestamp: message.timestamp,
          metadata: message.metadata
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      logger.info(`Processed incoming message for session ${session.id}`);
    } catch (error) {
      logger.error(`Error processing message with N8n: ${error}`);
      throw new Error('Failed to process message with N8n');
    }
  }
  async sendMessage(session: ChatSession, message: ChatMessage): Promise<void> {
    try {
      // Use fullWebhookUrl directly if available, otherwise construct from baseUrl and webhookId
      const webhookUrl = this.fullWebhookUrl || `${this.baseUrl}/webhook/${this.webhookId}`;
      logger.info(`Sending sendMessage request to: ${webhookUrl}`);
      
      await axios.post(webhookUrl, {
        action: 'send',
        sessionId: session.id,
        message: {
          content: message.content,
          senderId: message.senderId,
          timestamp: message.timestamp,
          metadata: message.metadata
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      logger.info(`Sent message for session ${session.id}`);
    } catch (error) {
      logger.error(`Error sending message with N8n: ${error}`);
      throw new Error('Failed to send message with N8n');
    }
  }
  async transferToHuman(session: ChatSession, agentId?: string): Promise<void> {
    try {
      // Use fullWebhookUrl directly if available, otherwise construct from baseUrl and webhookId
      const webhookUrl = this.fullWebhookUrl || `${this.baseUrl}/webhook/${this.webhookId}`;
      logger.info(`Sending transferToHuman request to: ${webhookUrl}`);
      
      await axios.post(webhookUrl, {
        action: 'transfer',
        sessionId: session.id,
        agentId: agentId
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      logger.info(`Transferred session ${session.id} to human agent ${agentId || 'any'}`);
    } catch (error) {
      logger.error(`Error transferring chat to human: ${error}`);
      throw new Error('Failed to transfer chat to human agent');
    }
  }
  async closeChat(session: ChatSession): Promise<void> {
    try {
      // Use fullWebhookUrl directly if available, otherwise construct from baseUrl and webhookId
      const webhookUrl = this.fullWebhookUrl || `${this.baseUrl}/webhook/${this.webhookId}`;
      logger.info(`Sending closeChat request to: ${webhookUrl}`);
      
      await axios.post(webhookUrl, {
        action: 'close',
        sessionId: session.id
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      logger.info(`Closed session ${session.id}`);
    } catch (error) {
      logger.error(`Error closing N8n chat: ${error}`);
      throw new Error('Failed to close chat with N8n');
    }
  }
}
