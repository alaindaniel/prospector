export const DATABASE_SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  cnpj TEXT NULL,
  category TEXT NOT NULL,
  region TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NULL,
  address TEXT NULL,
  rating REAL NULL,
  review_count INTEGER NULL,
  website TEXT NULL,
  normalized_domain TEXT NULL,
  phone TEXT NULL,
  normalized_phone TEXT NULL,
  instagram TEXT NULL,
  whatsapp TEXT NULL,
  email TEXT NULL,
  crm_stage TEXT NOT NULL DEFAULT 'NOVO',
  priority TEXT NOT NULL DEFAULT 'NAO_CLASSIFICADO',
  last_analysis_at TEXT NULL,
  collected_data_json TEXT NOT NULL,
  ai_analysis_json TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_companies_normalized_name_city ON companies(normalized_name, city);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(normalized_domain);
CREATE INDEX IF NOT EXISTS idx_companies_phone ON companies(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_companies_crm_stage ON companies(crm_stage);
CREATE INDEX IF NOT EXISTS idx_companies_priority ON companies(priority);
CREATE INDEX IF NOT EXISTS idx_companies_region_category ON companies(region, category);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NULL,
  role TEXT NULL,
  email TEXT NULL,
  phone TEXT NULL,
  whatsapp TEXT NULL,
  is_primary INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'IMPORT',
  created_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);

CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  positive_points_json TEXT NOT NULL,
  problems_found_json TEXT NOT NULL,
  opportunities_json TEXT NOT NULL,
  recommendations_json TEXT NOT NULL,
  collected_facts_json TEXT NOT NULL,
  ai_inferences_json TEXT NOT NULL,
  input_data_json TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audits_company_id ON audits(company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS lead_scores (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  audit_id TEXT NULL,
  score INTEGER NOT NULL,
  priority TEXT NOT NULL,
  classification TEXT NOT NULL,
  rationale TEXT NOT NULL,
  collected_facts_json TEXT NOT NULL,
  ai_inferences_json TEXT NOT NULL,
  recommendations_json TEXT NOT NULL,
  input_data_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_lead_scores_company_id ON lead_scores(company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  audit_id TEXT NULL,
  channel TEXT NOT NULL,
  recipient TEXT NULL,
  subject TEXT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'WAITING_APPROVAL',
  user_decision TEXT NULL,
  decision_notes TEXT NULL,
  decided_by TEXT NULL,
  decided_at TEXT NULL,
  input_data_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_company_id ON messages(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

CREATE TABLE IF NOT EXISTS communications (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  message_id TEXT NULL,
  channel TEXT NOT NULL,
  direction TEXT NOT NULL,
  event_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  details_json TEXT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_communications_company_id ON communications(company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS followups (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  base_message_id TEXT NULL,
  step_number INTEGER NOT NULL DEFAULT 1,
  channel TEXT NOT NULL,
  subject TEXT NULL,
  body TEXT NOT NULL,
  scheduled_for TEXT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  input_data_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (base_message_id) REFERENCES messages(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_followups_company_id ON followups(company_id);

CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  title TEXT NOT NULL,
  service_scope TEXT NOT NULL,
  estimated_value REAL NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  notes TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_proposals_company_id ON proposals(company_id);

CREATE TABLE IF NOT EXISTS automation_jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  company_id TEXT NULL,
  idempotency_key TEXT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  payload_json TEXT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  timeout_ms INTEGER NOT NULL DEFAULT 15000,
  last_error TEXT NULL,
  created_at TEXT NOT NULL,
  executed_at TEXT NULL,
  next_run_at TEXT NULL,
  result_json TEXT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_automation_jobs_status ON automation_jobs(status, next_run_at);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_idempotency ON automation_jobs(idempotency_key, status);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_company_id ON automation_jobs(company_id);

CREATE TABLE IF NOT EXISTS system_logs (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  company_id TEXT NULL,
  job_id TEXT NULL,
  message TEXT NOT NULL,
  metadata_json TEXT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_company_id ON system_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_job_id ON system_logs(job_id);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value_json TEXT NOT NULL,
  is_secret INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
`;
