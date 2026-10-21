import { IntegrationConnectionManifest } from '../../types/models';

export interface WhatsAppSendPayload {
  toPhone: string;
  body: string;
  companyId: string;
  messageId: string;
}

export interface WhatsAppSendResult {
  sentExternally: boolean;
  providerId: string;
  status: 'SANDBOX_BLOCKED_PHASE_1' | 'SENT' | 'FAILED';
  externalMessageId: string | null;
  explanation: string;
}

export interface WhatsAppProvider {
  readonly providerId: string;
  readonly providerName: string;
  getConnectionManifest(): IntegrationConnectionManifest;
  sendMessage(payload: WhatsAppSendPayload): Promise<WhatsAppSendResult>;
}
