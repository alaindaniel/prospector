import {
  WhatsAppProvider,
  WhatsAppSendPayload,
  WhatsAppSendResult,
} from '../interfaces/WhatsAppProvider';
import { IntegrationConnectionManifest } from '../../types/models';

export class SandboxWhatsAppProvider implements WhatsAppProvider {
  readonly providerId = 'sandbox_whatsapp';
  readonly providerName = 'Interface de WhatsApp Business API (Modo Seguro - Fase 1)';

  getConnectionManifest(): IntegrationConnectionManifest {
    return {
      providerType: 'WhatsAppProvider',
      providerId: this.providerId,
      serviceName: 'Meta WhatsApp Business Cloud API Oficial',
      connectedInPhase1: false,
      statusLabel: 'Desconectado por Política da Fase 1 (Revisão Humana Ativa)',
      requiredPermissions: [
        'whatsapp_business_messaging',
        'whatsapp_business_management',
      ],
      dataUsed: [
        'Telefone e WhatsApp normalizados do lead (companies.whatsapp / contacts.whatsapp)',
        'Texto da abordagem personalizada aprovada (messages.body)',
      ],
      actionToExecute:
        'Disparo pontual de mensagem direta via template/sessão oficial da Meta.',
      securityNotes:
        'Na Fase 1 o disparo externo automático é desativado para garantir conformidade e supervisão humana total.',
    };
  }

  async sendMessage(payload: WhatsAppSendPayload): Promise<WhatsAppSendResult> {
    return {
      sentExternally: false,
      providerId: this.providerId,
      status: 'SANDBOX_BLOCKED_PHASE_1',
      externalMessageId: null,
      explanation:
        'Mensagem aprovada e gravada com sucesso. Disparos externos diretos pelo WhatsApp Cloud API estão em modo sandbox controlado.',
    };
  }
}
