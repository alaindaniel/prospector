import {
  EmailProvider,
  EmailSendPayload,
  EmailSendResult,
} from '../interfaces/EmailProvider';
import { IntegrationConnectionManifest } from '../../types/models';

export class SandboxEmailProvider implements EmailProvider {
  readonly providerId = 'sandbox_email';
  readonly providerName = 'Interface de E-mail / Gmail (Modo Seguro - Fase 1)';

  getConnectionManifest(): IntegrationConnectionManifest {
    return {
      providerType: 'EmailProvider',
      providerId: this.providerId,
      serviceName: 'Gmail / Google Workspace OAuth2 & SMTP Corporativo',
      connectedInPhase1: false,
      statusLabel: 'Desconectado por Política da Fase 1 (Revisão Humana Ativa)',
      requiredPermissions: [
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.send',
      ],
      dataUsed: [
        'E-mail do contato (contacts.email / companies.email)',
        'Assunto aprovado pelo usuário (messages.subject)',
        'Corpo textual final aprovado pelo operador (messages.body)',
      ],
      actionToExecute:
        'Envio de e-mail comercial individual exclusivamente após aprovação explícita no painel.',
      securityNotes:
        'Na Fase 1 o envio real está bloqueado. O sistema apenas registra aprovações no banco de dados e avança o CRM para "CONTATO APROVADO".',
    };
  }

  async sendEmail(payload: EmailSendPayload): Promise<EmailSendResult> {
    // Fase 1: Não conecta nem envia externamente
    return {
      sentExternally: false,
      providerId: this.providerId,
      status: 'SANDBOX_BLOCKED_PHASE_1',
      externalMessageId: null,
      explanation:
        'Operação registrada com sucesso no banco. Por diretriz de segurança da Fase 1, e-mails reais permanecem bloqueados e sob controle humano.',
    };
  }
}
