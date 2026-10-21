# Modelagem do Banco de Dados — Prospector IA

## 1. Tecnologia e Integridade

O banco utiliza **SQLite Relacional** (`node:sqlite`) com `PRAGMA foreign_keys = ON` e `PRAGMA journal_mode = WAL`, garantindo ACID, integridade referencial, alta performance local e facilidade de migração futura para PostgreSQL.

## 2. Tabelas Obrigatórias

### 2.1 `companies`
Armazena os dados coletados das empresas prospectadas e seu estado atual no CRM.
- `id` (TEXT PK, UUID)
- `name` (TEXT NOT NULL)
- `normalized_name` (TEXT NOT NULL)
- `cnpj` (TEXT NULL)
- `category` (TEXT NOT NULL) — Segmento/Categoria
- `region` (TEXT NOT NULL) — Região prospectada
- `city` (TEXT NOT NULL)
- `state` (TEXT NULL)
- `address` (TEXT NULL)
- `rating` (REAL NULL) — Avaliação média (NULL quando indisponível)
- `review_count` (INTEGER NULL) — Quantidade de avaliações (NULL quando indisponível)
- `website` (TEXT NULL) — Site oficial (NULL quando indisponível)
- `normalized_domain` (TEXT NULL)
- `phone` (TEXT NULL) — Telefone (NULL quando indisponível)
- `normalized_phone` (TEXT NULL)
- `instagram` (TEXT NULL)
- `whatsapp` (TEXT NULL)
- `email` (TEXT NULL)
- `crm_stage` (TEXT NOT NULL DEFAULT 'NOVO')
- `priority` (TEXT NOT NULL DEFAULT 'NAO_CLASSIFICADO')
- `last_analysis_at` (TEXT NULL)
- `collected_data_json` (TEXT NOT NULL) — Dados brutos coletados sem invenção
- `ai_analysis_json` (TEXT NULL) — Última síntese de `analyzeCompany()`
- `created_at` (TEXT NOT NULL)
- `updated_at` (TEXT NOT NULL)

### 2.2 `contacts`
Contatos vinculados a uma empresa (`company_id` FK -> `companies.id`).
- `id` (TEXT PK)
- `company_id` (TEXT NOT NULL FK)
- `name` (TEXT NULL)
- `role` (TEXT NULL)
- `email` (TEXT NULL)
- `phone` (TEXT NULL)
- `whatsapp` (TEXT NULL)
- `is_primary` (INTEGER NOT NULL DEFAULT 1)
- `source` (TEXT NOT NULL)
- `created_at` (TEXT NOT NULL)

### 2.3 `audits`
Auditorias digitais realizadas sobre uma empresa.
- `id` (TEXT PK)
- `company_id` (TEXT NOT NULL FK)
- `positive_points_json` (TEXT NOT NULL) — Pontos positivos
- `problems_found_json` (TEXT NOT NULL) — Problemas encontrados
- `opportunities_json` (TEXT NOT NULL) — Oportunidades identificadas
- `recommendations_json` (TEXT NOT NULL) — Recomendações práticas
- `collected_facts_json` (TEXT NOT NULL) — `DADO COLETADO`
- `ai_inferences_json` (TEXT NOT NULL) — `INFERÊNCIA DA IA`
- `input_data_json` (TEXT NOT NULL) — Snapshot completo dos dados utilizados na análise
- `provider_name` (TEXT NOT NULL)
- `created_at` (TEXT NOT NULL)

### 2.4 `lead_scores`
Histórico e classificação de potencial comercial do lead.
- `id` (TEXT PK)
- `company_id` (TEXT NOT NULL FK)
- `audit_id` (TEXT NULL FK -> `audits.id`)
- `score` (INTEGER NOT NULL) — 0 a 100
- `priority` (TEXT NOT NULL) — `ALTA`, `MEDIA`, `BAIXA`
- `classification` (TEXT NOT NULL) — Ex: `QUENTE`, `MORNO`, `FRIO`
- `rationale` (TEXT NOT NULL) — Explicação transparente
- `collected_facts_json` (TEXT NOT NULL)
- `ai_inferences_json` (TEXT NOT NULL)
- `recommendations_json` (TEXT NOT NULL)
- `input_data_json` (TEXT NOT NULL)
- `created_at` (TEXT NOT NULL)

### 2.5 `messages`
Mensagens personalizadas geradas pela IA e submetidas à aprovação humana.
- `id` (TEXT PK)
- `company_id` (TEXT NOT NULL FK)
- `audit_id` (TEXT NULL FK)
- `channel` (TEXT NOT NULL) — `EMAIL`, `WHATSAPP`, `INSTAGRAM`
- `recipient` (TEXT NULL)
- `subject` (TEXT NULL)
- `body` (TEXT NOT NULL)
- `status` (TEXT NOT NULL) — `WAITING_APPROVAL`, `APPROVED`, `REJECTED`, `EDITED_AND_APPROVED`
- `user_decision` (TEXT NULL) — `APPROVED`, `REJECTED`, `EDITED`
- `decision_notes` (TEXT NULL)
- `decided_by` (TEXT NULL)
- `decided_at` (TEXT NULL)
- `input_data_json` (TEXT NOT NULL) — Dados utilizados na geração
- `created_at` (TEXT NOT NULL)
- `updated_at` (TEXT NOT NULL)

### 2.6 `communications`
Histórico consolidado de interações, eventos de CRM, decisões de mensagens e registros de contato.
- `id` (TEXT PK)
- `company_id` (TEXT NOT NULL FK)
- `message_id` (TEXT NULL FK -> `messages.id`)
- `channel` (TEXT NOT NULL)
- `direction` (TEXT NOT NULL) — `INTERNAL`, `OUTBOUND`, `INBOUND`
- `event_type` (TEXT NOT NULL)
- `summary` (TEXT NOT NULL)
- `details_json` (TEXT NULL)
- `created_at` (TEXT NOT NULL)

### 2.7 `followups`
Cadência de acompanhamento programada ou gerada por IA (`generateFollowup()`).
- `id` (TEXT PK)
- `company_id` (TEXT NOT NULL FK)
- `base_message_id` (TEXT NULL FK -> `messages.id`)
- `step_number` (INTEGER NOT NULL)
- `channel` (TEXT NOT NULL)
- `subject` (TEXT NULL)
- `body` (TEXT NOT NULL)
- `scheduled_for` (TEXT NULL)
- `status` (TEXT NOT NULL) — `DRAFT`, `WAITING_APPROVAL`, `APPROVED`, `CANCELLED`
- `input_data_json` (TEXT NOT NULL)
- `created_at` (TEXT NOT NULL)

### 2.8 `proposals`
Propostas comerciais associadas aos leads no CRM.
- `id` (TEXT PK)
- `company_id` (TEXT NOT NULL FK)
- `title` (TEXT NOT NULL)
- `service_scope` (TEXT NOT NULL)
- `estimated_value` (REAL NULL)
- `status` (TEXT NOT NULL) — `DRAFT`, `PRESENTED`, `ACCEPTED`, `REJECTED`
- `notes` (TEXT NULL)
- `created_at` (TEXT NOT NULL)
- `updated_at` (TEXT NOT NULL)

### 2.9 `automation_jobs`
Fila e máquina de estados do motor de automação.
- `id` (TEXT PK)
- `type` (TEXT NOT NULL)
- `company_id` (TEXT NULL FK -> `companies.id`)
- `idempotency_key` (TEXT NULL)
- `status` (TEXT NOT NULL) — `PENDING`, `RUNNING`, `WAITING_APPROVAL`, `COMPLETED`, `FAILED`, `CANCELLED`
- `payload_json` (TEXT NULL)
- `attempts` (INTEGER NOT NULL DEFAULT 0)
- `max_attempts` (INTEGER NOT NULL DEFAULT 3)
- `timeout_ms` (INTEGER NOT NULL DEFAULT 15000)
- `last_error` (TEXT NULL)
- `created_at` (TEXT NOT NULL)
- `executed_at` (TEXT NULL)
- `next_run_at` (TEXT NULL)
- `result_json` (TEXT NULL)
- `updated_at` (TEXT NOT NULL)

### 2.10 `system_logs`
Trilha de auditoria e logs operacionais de todas as ações do sistema.
- `id` (TEXT PK)
- `level` (TEXT NOT NULL) — `INFO`, `WARN`, `ERROR`
- `category` (TEXT NOT NULL)
- `action` (TEXT NOT NULL)
- `company_id` (TEXT NULL)
- `job_id` (TEXT NULL)
- `message` (TEXT NOT NULL)
- `metadata_json` (TEXT NULL)
- `created_at` (TEXT NOT NULL)

### 2.11 `settings`
Configurações globais, regiões/segmentos cadastrados e preferências de provedores (com valores sensíveis mascarados/criptografados).
- `id` (TEXT PK)
- `key` (TEXT NOT NULL UNIQUE)
- `value_json` (TEXT NOT NULL)
- `is_secret` (INTEGER NOT NULL DEFAULT 0)
- `updated_at` (TEXT NOT NULL)
