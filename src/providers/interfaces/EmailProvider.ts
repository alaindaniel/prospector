import { IntegrationConnectionManifest } from '../../types/models';

export interface EmailSendPayload {
  to: string;
  subject: string;
  body: string;
  companyId: string;
  messageId: string;
}

export interface EmailSendResult {
  sentExternally: boolean;
  providerId: string;
  status: 'SANDBOX_BLOCKED_PHASE_1' | 'SENT' | 'FAILED';
  externalMessageId: string | null;
  explanation: string;
}

export interface EmailProvider {
  readonly providerId: string;
  readonly providerName: string;
  getConnectionManifest(): IntegrationConnectionManifest;
  sendEmail(payload: EmailSendPayload): Promise<EmailSendResult>;
}
