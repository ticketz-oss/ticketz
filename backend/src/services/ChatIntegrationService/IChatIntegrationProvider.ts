export interface ChatMessage {
  content: string;
  senderId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  conversationId: string;
  ticketId: number;
  queueId: number;
  status: 'active' | 'transferring' | 'closed';
}

export interface IChatIntegrationProvider {
  // Inicializa uma sessão de chat para um ticket
  initializeChat(session: ChatSession, settings: Record<string, any>): Promise<void>;
  
  // Processa uma mensagem recebida do cliente
  processIncomingMessage(session: ChatSession, message: ChatMessage): Promise<void>;
  
  // Envia mensagem para o cliente através do serviço externo
  sendMessage(session: ChatSession, message: ChatMessage): Promise<void>;
  
  // Transfere para atendente humano
  transferToHuman(session: ChatSession, agentId?: string): Promise<void>;
  
  // Encerra sessão
  closeChat(session: ChatSession): Promise<void>;
}
