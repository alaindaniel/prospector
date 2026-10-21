import {
  IntegrationConnectionManifest,
  LeadPriority,
  MessageChannel,
  SeparatedAnalysisBlocks,
} from '../../types/models';

export interface CompanyAnalysisInput {
  id: string;
  name: string;
  cnpj: string | null;
  category: string;
  region: string;
  city: string;
  state: string | null;
  address: string | null;
  rating: number | null;
  review_count: number | null;
  website: string | null;
  phone: string | null;
  instagram: string | null;
  whatsapp: string | null;
  email: string | null;
}

export interface CompanyAnalysisOutput extends SeparatedAnalysisBlocks {
  summary: string;
  digitalMaturityLevel: 'INICIAL' | 'INTERMEDIARIO' | 'AVANCADO';
  inputSnapshot: CompanyAnalysisInput;
}

export interface AuditGenerationOutput extends SeparatedAnalysisBlocks {
  positivePoints: string[];
  problemsFound: string[];
  opportunities: string[];
  inputSnapshot: CompanyAnalysisInput;
}

export interface LeadScoreGenerationInput {
  company: CompanyAnalysisInput;
  audit?: {
    positivePoints: string[];
    problemsFound: string[];
    opportunities: string[];
    recommendations: string[];
  } | null;
}

export interface LeadScoreGenerationOutput extends SeparatedAnalysisBlocks {
  score: number;
  priority: LeadPriority;
  classification: 'QUENTE' | 'MORNO' | 'FRIO';
  rationale: string;
  inputSnapshot: LeadScoreGenerationInput;
}

export interface MessageGenerationInput {
  company: CompanyAnalysisInput;
  channel: MessageChannel;
  recipient: string | null;
  audit?: {
    positivePoints: string[];
    problemsFound: string[];
    opportunities: string[];
    recommendations: string[];
  } | null;
  leadScore?: {
    score: number;
    priority: LeadPriority;
    classification: string;
  } | null;
}

export interface MessageGenerationOutput {
  channel: MessageChannel;
  recipient: string | null;
  subject: string | null;
  body: string;
  collectedFactsUsed: string[];
  aiInferencesUsed: string[];
  recommendationsUsed: string[];
  inputSnapshot: MessageGenerationInput;
}

export interface FollowupGenerationInput {
  company: CompanyAnalysisInput;
  channel: MessageChannel;
  stepNumber: number;
  previousMessageBody?: string | null;
  opportunities?: string[];
}

export interface FollowupGenerationOutput {
  channel: MessageChannel;
  stepNumber: number;
  subject: string | null;
  body: string;
  inputSnapshot: FollowupGenerationInput;
}

export interface AIProvider {
  readonly providerId: string;
  readonly providerName: string;
  getConnectionManifest(): IntegrationConnectionManifest;
  analyzeCompany(input: CompanyAnalysisInput): Promise<CompanyAnalysisOutput>;
  generateAudit(input: CompanyAnalysisInput): Promise<AuditGenerationOutput>;
  generateLeadScore(input: LeadScoreGenerationInput): Promise<LeadScoreGenerationOutput>;
  generateMessage(input: MessageGenerationInput): Promise<MessageGenerationOutput>;
  generateFollowup(input: FollowupGenerationInput): Promise<FollowupGenerationOutput>;
}
