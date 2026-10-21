import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { DatabaseManager } from '../database/connection';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { LogService } from '../services/LogService';
import {
  AuditRecord,
  CompanyRecord,
  FollowupRecord,
  LeadScoreRecord,
  MessageChannel,
  MessageRecord,
} from '../types/models';
import {
  CompanyAnalysisInput,
  CompanyAnalysisOutput,
  AuditGenerationOutput,
  LeadScoreGenerationOutput,
  MessageGenerationOutput,
  FollowupGenerationOutput,
} from '../providers/interfaces/AIProvider';

export class AIService {
  private db: DatabaseSync;
  private logService: LogService;

  constructor(db?: DatabaseSync) {
    this.db = db || DatabaseManager.getConnection();
    this.logService = new LogService(this.db);
  }

  private mapCompanyToAnalysisInput(company: CompanyRecord): CompanyAnalysisInput {
    return {
      id: company.id,
      name: company.name,
      cnpj: company.cnpj ?? null,
      category: company.category,
      region: company.region,
      city: company.city,
      state: company.state ?? null,
      address: company.address ?? null,
      rating: company.rating ?? null,
      review_count: company.review_count ?? null,
      website: company.website ?? null,
      phone: company.phone ?? null,
      instagram: company.instagram ?? null,
      whatsapp: company.whatsapp ?? null,
      email: company.email ?? null,
    };
  }

  /**
   * 1. analyzeCompany(): sintetiza o perfil e maturidade da empresa sem inventar fatos,
   * atualizando `companies.ai_analysis_json` e `companies.last_analysis_at`.
   */
  async analyzeCompany(company: CompanyRecord): Promise<CompanyAnalysisOutput> {
    const aiProvider = ProviderRegistry.getAIProvider();
    const input = this.mapCompanyToAnalysisInput(company);
    const analysis = await aiProvider.analyzeCompany(input);

    const now = new Date().toISOString();
    const updateStmt = this.db.prepare(`
      UPDATE companies 
      SET ai_analysis_json = ?, last_analysis_at = ?, updated_at = ?
      WHERE id = ?
    `);
    updateStmt.run(JSON.stringify(analysis), now, now, company.id);

    this.logService.info(
      'AI',
      'ANALYZE_COMPANY',
      `Diagnóstico sintetizado para ${company.name} (${analysis.digitalMaturityLevel}).`,
      { maturity: analysis.digitalMaturityLevel },
      company.id
    );

    return analysis;
  }

  /**
   * 2. generateAudit(): gera auditoria completa com pontos positivos, problemas,
   * oportunidades, recomendações e armazena em `audits` junto com o snapshot exato dos dados utilizados.
   */
  async generateAudit(company: CompanyRecord): Promise<AuditRecord> {
    const aiProvider = ProviderRegistry.getAIProvider();
    const input = this.mapCompanyToAnalysisInput(company);
    const auditOutput: AuditGenerationOutput = await aiProvider.generateAudit(input);

    const auditId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertStmt = this.db.prepare(`
      INSERT INTO audits (
        id, company_id, positive_points_json, problems_found_json, opportunities_json,
        recommendations_json, collected_facts_json, ai_inferences_json, input_data_json,
        provider_name, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      auditId,
      company.id,
      JSON.stringify(auditOutput.positivePoints),
      JSON.stringify(auditOutput.problemsFound),
      JSON.stringify(auditOutput.opportunities),
      JSON.stringify(auditOutput.recommendations),
      JSON.stringify(auditOutput.collectedFacts),
      JSON.stringify(auditOutput.aiInferences),
      JSON.stringify(auditOutput.inputSnapshot),
      aiProvider.providerName,
      now
    );

    // Registra comunicação interna e atualiza estágio para ANALISADO se ainda for NOVO
    if (company.crm_stage === 'NOVO') {
      const updateStageStmt = this.db.prepare(`
        UPDATE companies SET crm_stage = 'ANALISADO', last_analysis_at = ?, updated_at = ? WHERE id = ?
      `);
      updateStageStmt.run(now, now, company.id);
    }

    this.logService.info(
      'AUDIT',
      'GENERATE_AUDIT',
      `Auditoria gerada com sucesso para ${company.name}.`,
      { auditId, opportunitiesCount: auditOutput.opportunities.length },
      company.id
    );

    return {
      id: auditId,
      company_id: company.id,
      positive_points_json: JSON.stringify(auditOutput.positivePoints),
      problems_found_json: JSON.stringify(auditOutput.problemsFound),
      opportunities_json: JSON.stringify(auditOutput.opportunities),
      recommendations_json: JSON.stringify(auditOutput.recommendations),
      collected_facts_json: JSON.stringify(auditOutput.collectedFacts),
      ai_inferences_json: JSON.stringify(auditOutput.aiInferences),
      input_data_json: JSON.stringify(auditOutput.inputSnapshot),
      provider_name: aiProvider.providerName,
      created_at: now,
    };
  }

  /**
   * 3. generateLeadScore(): calcula a pontuação (0-100), prioridade e classificação,
   * persistindo em `lead_scores` e atualizando `companies.priority`.
   */
  async generateLeadScore(company: CompanyRecord, auditRecord?: AuditRecord | null): Promise<LeadScoreRecord> {
    const aiProvider = ProviderRegistry.getAIProvider();
    const companyInput = this.mapCompanyToAnalysisInput(company);

    let auditInput = null;
    if (auditRecord) {
      auditInput = {
        positivePoints: JSON.parse(auditRecord.positive_points_json),
        problemsFound: JSON.parse(auditRecord.problems_found_json),
        opportunities: JSON.parse(auditRecord.opportunities_json),
        recommendations: JSON.parse(auditRecord.recommendations_json),
      };
    }

    const scoreOutput: LeadScoreGenerationOutput = await aiProvider.generateLeadScore({
      company: companyInput,
      audit: auditInput,
    });

    const scoreId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertStmt = this.db.prepare(`
      INSERT INTO lead_scores (
        id, company_id, audit_id, score, priority, classification, rationale,
        collected_facts_json, ai_inferences_json, recommendations_json, input_data_json, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      scoreId,
      company.id,
      auditRecord?.id ?? null,
      scoreOutput.score,
      scoreOutput.priority,
      scoreOutput.classification,
      scoreOutput.rationale,
      JSON.stringify(scoreOutput.collectedFacts),
      JSON.stringify(scoreOutput.aiInferences),
      JSON.stringify(scoreOutput.recommendations),
      JSON.stringify(scoreOutput.inputSnapshot),
      now
    );

    // Atualiza a prioridade da empresa
    const updateCompStmt = this.db.prepare(`
      UPDATE companies SET priority = ?, updated_at = ? WHERE id = ?
    `);
    updateCompStmt.run(scoreOutput.priority, now, company.id);

    this.logService.info(
      'LEAD_SCORING',
      'GENERATE_LEAD_SCORE',
      `Lead ${company.name} classificado com score ${scoreOutput.score} (${scoreOutput.classification} / Prioridade ${scoreOutput.priority}).`,
      { score: scoreOutput.score, priority: scoreOutput.priority },
      company.id
    );

    return {
      id: scoreId,
      company_id: company.id,
      audit_id: auditRecord?.id ?? null,
      score: scoreOutput.score,
      priority: scoreOutput.priority,
      classification: scoreOutput.classification,
      rationale: scoreOutput.rationale,
      collected_facts_json: JSON.stringify(scoreOutput.collectedFacts),
      ai_inferences_json: JSON.stringify(scoreOutput.aiInferences),
      recommendations_json: JSON.stringify(scoreOutput.recommendations),
      input_data_json: JSON.stringify(scoreOutput.inputSnapshot),
      created_at: now,
    };
  }

  /**
   * 4. generateMessage(): elabora minuta personalizada para abordagem comercial
   * e salva em `messages` com status 'WAITING_APPROVAL'.
   */
  async generateMessage(
    company: CompanyRecord,
    channel: MessageChannel = 'EMAIL',
    recipient?: string | null,
    auditRecord?: AuditRecord | null,
    leadScoreRecord?: LeadScoreRecord | null
  ): Promise<MessageRecord> {
    const aiProvider = ProviderRegistry.getAIProvider();
    const companyInput = this.mapCompanyToAnalysisInput(company);

    let auditInput = null;
    if (auditRecord) {
      auditInput = {
        positivePoints: JSON.parse(auditRecord.positive_points_json),
        problemsFound: JSON.parse(auditRecord.problems_found_json),
        opportunities: JSON.parse(auditRecord.opportunities_json),
        recommendations: JSON.parse(auditRecord.recommendations_json),
      };
    }

    let scoreInput = null;
    if (leadScoreRecord) {
      scoreInput = {
        score: leadScoreRecord.score,
        priority: leadScoreRecord.priority,
        classification: leadScoreRecord.classification,
      };
    }

    const messageOutput: MessageGenerationOutput = await aiProvider.generateMessage({
      company: companyInput,
      channel,
      recipient: recipient ?? company.email ?? company.phone ?? null,
      audit: auditInput,
      leadScore: scoreInput,
    });

    const messageId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertStmt = this.db.prepare(`
      INSERT INTO messages (
        id, company_id, audit_id, channel, recipient, subject, body, status,
        user_decision, decision_notes, decided_by, decided_at, input_data_json, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'WAITING_APPROVAL', NULL, NULL, NULL, NULL, ?, ?, ?)
    `);

    insertStmt.run(
      messageId,
      company.id,
      auditRecord?.id ?? null,
      messageOutput.channel,
      messageOutput.recipient,
      messageOutput.subject,
      messageOutput.body,
      JSON.stringify(messageOutput.inputSnapshot),
      now,
      now
    );

    this.logService.info(
      'MESSAGES',
      'GENERATE_MESSAGE',
      `Mensagem criada para ${company.name} via ${channel} aguardando aprovação humana.`,
      { messageId, channel },
      company.id
    );

    return {
      id: messageId,
      company_id: company.id,
      audit_id: auditRecord?.id ?? null,
      channel: messageOutput.channel,
      recipient: messageOutput.recipient,
      subject: messageOutput.subject,
      body: messageOutput.body,
      status: 'WAITING_APPROVAL',
      user_decision: null,
      decision_notes: null,
      decided_by: null,
      decided_at: null,
      input_data_json: JSON.stringify(messageOutput.inputSnapshot),
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * 5. generateFollowup(): redige proposta de follow-up para cadência de contato.
   */
  async generateFollowup(
    company: CompanyRecord,
    baseMessage?: MessageRecord | null,
    stepNumber = 2
  ): Promise<FollowupRecord> {
    const aiProvider = ProviderRegistry.getAIProvider();
    const companyInput = this.mapCompanyToAnalysisInput(company);

    const followupOutput: FollowupGenerationOutput = await aiProvider.generateFollowup({
      company: companyInput,
      channel: baseMessage?.channel ?? 'EMAIL',
      stepNumber,
      previousMessageBody: baseMessage?.body ?? null,
    });

    const followupId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertStmt = this.db.prepare(`
      INSERT INTO followups (
        id, company_id, base_message_id, step_number, channel, subject, body,
        scheduled_for, status, input_data_json, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'DRAFT', ?, ?)
    `);

    insertStmt.run(
      followupId,
      company.id,
      baseMessage?.id ?? null,
      followupOutput.stepNumber,
      followupOutput.channel,
      followupOutput.subject,
      followupOutput.body,
      JSON.stringify(followupOutput.inputSnapshot),
      now
    );

    this.logService.info(
      'FOLLOWUP',
      'GENERATE_FOLLOWUP',
      `Follow-up passo ${stepNumber} gerado para ${company.name}.`,
      { followupId },
      company.id
    );

    return {
      id: followupId,
      company_id: company.id,
      base_message_id: baseMessage?.id ?? null,
      step_number: followupOutput.stepNumber,
      channel: followupOutput.channel,
      subject: followupOutput.subject,
      body: followupOutput.body,
      scheduled_for: null,
      status: 'DRAFT',
      input_data_json: JSON.stringify(followupOutput.inputSnapshot),
      created_at: now,
    };
  }
}
