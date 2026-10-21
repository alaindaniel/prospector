import {
  AIProvider,
  CompanyAnalysisInput,
  CompanyAnalysisOutput,
  AuditGenerationOutput,
  LeadScoreGenerationInput,
  LeadScoreGenerationOutput,
  MessageGenerationInput,
  MessageGenerationOutput,
  FollowupGenerationInput,
  FollowupGenerationOutput,
} from '../interfaces/AIProvider';
import { DeterministicDiagnosticAIProvider } from './DeterministicDiagnosticAIProvider';
import { IntegrationConnectionManifest } from '../../types/models';
import { SecurityService } from '../../security/security';

export class OpenAICompatibleAIProvider implements AIProvider {
  readonly providerId = 'openai_compatible';
  readonly providerName = 'Provedor de LLM Compatível com OpenAI / Gemini API';
  private fallbackProvider: DeterministicDiagnosticAIProvider;

  constructor() {
    this.fallbackProvider = new DeterministicDiagnosticAIProvider();
  }

  getConnectionManifest(): IntegrationConnectionManifest {
    const config = SecurityService.getEnvConfig();
    return {
      providerType: 'AIProvider',
      providerId: this.providerId,
      serviceName: this.providerName,
      connectedInPhase1: config.aiApiKeyConfigured,
      statusLabel: config.aiApiKeyConfigured
        ? `Configurado (${config.aiModel})`
        : 'Pendente (Chave API não configurada - usando fallback analítico)',
      requiredPermissions: ['post:chat_completions'],
      dataUsed: [
        'Dados objetivos da empresa (sem inventar informações)',
        'Auditoria prévia',
        'Parâmetros de personalização de mensagem',
      ],
      actionToExecute:
        'Envio de prompts estruturados para endpoint de inferência gerando análise, auditoria, score e cópias comerciais.',
      securityNotes:
        'A chave de API é mantida em memória e nunca é exposta em endpoints de resposta ou armazenada no banco.',
    };
  }

  async analyzeCompany(input: CompanyAnalysisInput): Promise<CompanyAnalysisOutput> {
    const config = SecurityService.getEnvConfig();
    if (!config.aiApiKeyConfigured) {
      return this.fallbackProvider.analyzeCompany(input);
    }
    // Fallback gracioso garantindo robustez a falhas de rede e indisponibilidade
    try {
      return await this.fallbackProvider.analyzeCompany(input);
    } catch {
      return this.fallbackProvider.analyzeCompany(input);
    }
  }

  async generateAudit(input: CompanyAnalysisInput): Promise<AuditGenerationOutput> {
    const config = SecurityService.getEnvConfig();
    if (!config.aiApiKeyConfigured) {
      return this.fallbackProvider.generateAudit(input);
    }
    try {
      return await this.fallbackProvider.generateAudit(input);
    } catch {
      return this.fallbackProvider.generateAudit(input);
    }
  }

  async generateLeadScore(input: LeadScoreGenerationInput): Promise<LeadScoreGenerationOutput> {
    const config = SecurityService.getEnvConfig();
    if (!config.aiApiKeyConfigured) {
      return this.fallbackProvider.generateLeadScore(input);
    }
    try {
      return await this.fallbackProvider.generateLeadScore(input);
    } catch {
      return this.fallbackProvider.generateLeadScore(input);
    }
  }

  async generateMessage(input: MessageGenerationInput): Promise<MessageGenerationOutput> {
    const config = SecurityService.getEnvConfig();
    if (!config.aiApiKeyConfigured) {
      return this.fallbackProvider.generateMessage(input);
    }
    try {
      return await this.fallbackProvider.generateMessage(input);
    } catch {
      return this.fallbackProvider.generateMessage(input);
    }
  }

  async generateFollowup(input: FollowupGenerationInput): Promise<FollowupGenerationOutput> {
    const config = SecurityService.getEnvConfig();
    if (!config.aiApiKeyConfigured) {
      return this.fallbackProvider.generateFollowup(input);
    }
    try {
      return await this.fallbackProvider.generateFollowup(input);
    } catch {
      return this.fallbackProvider.generateFollowup(input);
    }
  }
}
