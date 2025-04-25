import { IChatIntegrationProvider } from './IChatIntegrationProvider';
import { N8nIntegrationProvider } from './N8nIntegrationProvider';
// Importe outros provedores aqui conforme necessário

export class ChatIntegrationFactory {
  static createProvider(provider: string, settings: Record<string, any>): IChatIntegrationProvider {
    switch (provider.toLowerCase()) {
      case 'n8n':
        return new N8nIntegrationProvider(settings);
      // Adicione outros provedores conforme necessário
      default:
        throw new Error(`Provedor de integração não suportado: ${provider}`);
    }
  }
}
