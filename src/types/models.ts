export type CRMStage =
  | 'NOVO'
  | 'ANALISADO'
  | 'CONTATO APROVADO'
  | 'CONTATADO'
  | 'RESPONDEU'
  | 'INTERESSADO'
  | 'REUNIÃO'
  | 'PROPOSTA'
  | 'CLIENTE'
  | 'SEM INTERESSE'
  | 'NÃO RESPONDEU';

export const CRM_MAIN_PIPELINE_STAGES: CRMStage[] = [
  'NOVO',
  'ANALISADO',
  'CONTATO APROVADO',
  'CONTATADO',
  'RESPONDEU',
  'INTERESSADO',
  'REUNIÃO',
  'PROPOSTA',
  'CLIENTE',
];

export const CRM_ARCHIVE_STAGES: CRMStage[] = [
  'SEM INTERESSE',
  'NÃO RESPONDEU',
];

export const ALL_CRM_STAGES: CRMStage[] = [
  ...CRM_MAIN_PIPELINE_STAGES,
  ...CRM_ARCHIVE_STAGES,
];

export type LeadPriority = 'ALTA' | 'MEDIA' | 'BAIXA' | 'NAO_CLASSIFICADO';

export type AutomationJobStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'WAITING_APPROVAL'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type AutomationJobType =
  | 'IMPORT_COMPANIES'
  | 'ANALYZE_COMPANY'
  | 'RUN_AUDIT'
  | 'SCORE_LEAD'
  | 'GENERATE_MESSAGE'
  | 'GENERATE_FOLLOWUP'
  | 'FULL_PROSPECTING_FLOW';

export type MessageChannel = 'EMAIL' | 'WHATSAPP' | 'INSTAGRAM' | 'TELEFONE';

export type MessageStatus =
  | 'WAITING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EDITED_AND_APPROVED';

export interface RegionSegmentConfig {
  id: string;
  region: string;
  city: string;
  state: string | null;
  segment: string;
  description: string | null;
  createdAt: string;
}

export interface CompanyRecord {
  id: string;
  name: string;
  normalized_name: string;
  cnpj: string | null;
  category: string;
  region: string;
  city: string;
  state: string | null;
  address: string | null;
  rating: number | null;
  review_count: number | null;
  website: string | null;
  normalized_domain: string | null;
  phone: string | null;
  normalized_phone: string | null;
  instagram: string | null;
  whatsapp: string | null;
  email: string | null;
  crm_stage: CRMStage;
  priority: LeadPriority;
  last_analysis_at: string | null;
  collected_data_json: string;
  ai_analysis_json: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactRecord {
  id: string;
  company_id: string;
  name: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  is_primary: number;
  source: string;
  created_at: string;
}

export interface SeparatedAnalysisBlocks {
  /** Dados brutos efetivamente coletados (sem invenção; campos ausentes = Indisponível/NULL) */
  collectedFacts: Array<{ field: string; label: string; value: string | number | null; available: boolean }>;
  /** Inferências analíticas deduzidas pela IA a partir dos dados coletados */
  aiInferences: string[];
  /** Recomendações estratégicas ou comerciais */
  recommendations: string[];
}

export interface AuditRecord {
  id: string;
  company_id: string;
  positive_points_json: string;
  problems_found_json: string;
  opportunities_json: string;
  recommendations_json: string;
  collected_facts_json: string;
  ai_inferences_json: string;
  input_data_json: string;
  provider_name: string;
  created_at: string;
}

export interface LeadScoreRecord {
  id: string;
  company_id: string;
  audit_id: string | null;
  score: number;
  priority: LeadPriority;
  classification: string;
  rationale: string;
  collected_facts_json: string;
  ai_inferences_json: string;
  recommendations_json: string;
  input_data_json: string;
  created_at: string;
}

export interface MessageRecord {
  id: string;
  company_id: string;
  audit_id: string | null;
  channel: MessageChannel;
  recipient: string | null;
  subject: string | null;
  body: string;
  status: MessageStatus;
  user_decision: 'APPROVED' | 'REJECTED' | 'EDITED' | null;
  decision_notes: string | null;
  decided_by: string | null;
  decided_at: string | null;
  input_data_json: string;
  created_at: string;
  updated_at: string;
}

export interface CommunicationRecord {
  id: string;
  company_id: string;
  message_id: string | null;
  channel: string;
  direction: 'INTERNAL' | 'OUTBOUND' | 'INBOUND';
  event_type: string;
  summary: string;
  details_json: string | null;
  created_at: string;
}

export interface FollowupRecord {
  id: string;
  company_id: string;
  base_message_id: string | null;
  step_number: number;
  channel: MessageChannel;
  subject: string | null;
  body: string;
  scheduled_for: string | null;
  status: 'DRAFT' | 'WAITING_APPROVAL' | 'APPROVED' | 'CANCELLED';
  input_data_json: string;
  created_at: string;
}

export interface ProposalRecord {
  id: string;
  company_id: string;
  title: string;
  service_scope: string;
  estimated_value: number | null;
  status: 'DRAFT' | 'PRESENTED' | 'ACCEPTED' | 'REJECTED';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationJobRecord {
  id: string;
  type: AutomationJobType;
  company_id: string | null;
  idempotency_key: string | null;
  status: AutomationJobStatus;
  payload_json: string | null;
  attempts: number;
  max_attempts: number;
  timeout_ms: number;
  last_error: string | null;
  created_at: string;
  executed_at: string | null;
  next_run_at: string | null;
  result_json: string | null;
  updated_at: string;
}

export interface SystemLogRecord {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  category: string;
  action: string;
  company_id: string | null;
  job_id: string | null;
  message: string;
  metadata_json: string | null;
  created_at: string;
}

export interface SettingRecord {
  id: string;
  key: string;
  value_json: string;
  is_secret: number;
  updated_at: string;
}

export interface IntegrationConnectionManifest {
  providerType: 'CompanyDataProvider' | 'AIProvider' | 'EmailProvider' | 'WhatsAppProvider';
  providerId: string;
  serviceName: string;
  connectedInPhase1: boolean;
  statusLabel: string;
  requiredPermissions: string[];
  dataUsed: string[];
  actionToExecute: string;
  securityNotes: string;
}
