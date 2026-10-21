import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { DatabaseManager } from '../database/connection';
import { CompanyService } from './CompanyService';
import { LogService } from './LogService';
import {
  ALL_CRM_STAGES,
  CRMStage,
  CommunicationRecord,
  CompanyRecord,
  ProposalRecord,
} from '../types/models';

export interface CompanyAggregatedDetail {
  company: CompanyRecord;
  contacts: unknown[];
  latestAudit: unknown | null;
  allAudits: unknown[];
  latestScore: unknown | null;
  allScores: unknown[];
  latestMessage: unknown | null;
  allMessages: unknown[];
  proposals: ProposalRecord[];
  communications: CommunicationRecord[];
  logs: unknown[];
}

export class CRMService {
  private db: DatabaseSync;
  private companyService: CompanyService;
  private logService: LogService;

  constructor(db?: DatabaseSync) {
    this.db = db || DatabaseManager.getConnection();
    this.companyService = new CompanyService(this.db);
    this.logService = new LogService(this.db);
  }

  /**
   * Atualiza o estágio do CRM do lead e registra o histórico completo em communications e system_logs.
   */
  updateStage(companyId: string, newStage: CRMStage, notes?: string): CompanyRecord {
    if (!ALL_CRM_STAGES.includes(newStage)) {
      throw new Error(`Estágio inválido: ${newStage}`);
    }

    const company = this.companyService.getCompanyById(companyId);
    if (!company) {
      throw new Error(`Empresa ${companyId} não encontrada.`);
    }

    const previousStage = company.crm_stage;
    if (previousStage === newStage) {
      return company;
    }

    const now = new Date().toISOString();
    const updateStmt = this.db.prepare(`
      UPDATE companies 
      SET crm_stage = ?, updated_at = ?
      WHERE id = ?
    `);
    updateStmt.run(newStage, now, company.id);

    // Registra comunicação de transição de estágio
    const commId = crypto.randomUUID();
    const commStmt = this.db.prepare(`
      INSERT INTO communications (id, company_id, message_id, channel, direction, event_type, summary, details_json, created_at)
      VALUES (?, ?, NULL, 'CRM', 'INTERNAL', 'STAGE_CHANGED', ?, ?, ?)
    `);
    commStmt.run(
      commId,
      company.id,
      `Estágio alterado de "${previousStage}" para "${newStage}".`,
      JSON.stringify({ previousStage, newStage, notes: notes || null }),
      now
    );

    this.logService.info(
      'CRM',
      'STAGE_CHANGED',
      `Lead ${company.name} movido de ${previousStage} para ${newStage}.`,
      { previousStage, newStage, notes },
      company.id
    );

    return this.companyService.getCompanyById(companyId)!;
  }

  /**
   * Agrupa as empresas por estágio do CRM para alimentar o pipeline visual (Kanban).
   */
  getPipelineOverview(): Record<CRMStage, CompanyRecord[]> {
    const companies = this.companyService.listCompanies();
    const overview: Partial<Record<CRMStage, CompanyRecord[]>> = {};

    for (const stage of ALL_CRM_STAGES) {
      overview[stage] = [];
    }

    for (const comp of companies) {
      const stage = comp.crm_stage;
      if (overview[stage]) {
        overview[stage]!.push(comp);
      } else {
        overview['NOVO']!.push(comp);
      }
    }

    return overview as Record<CRMStage, CompanyRecord[]>;
  }

  /**
   * Criação e atualização de propostas comerciais.
   */
  createProposal(data: {
    companyId: string;
    title: string;
    serviceScope: string;
    estimatedValue?: number | null;
    notes?: string | null;
  }): ProposalRecord {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO proposals (id, company_id, title, service_scope, estimated_value, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?)
    `);

    stmt.run(
      id,
      data.companyId,
      data.title,
      data.serviceScope,
      data.estimatedValue ?? null,
      data.notes ?? null,
      now,
      now
    );

    const commId = crypto.randomUUID();
    const commStmt = this.db.prepare(`
      INSERT INTO communications (id, company_id, message_id, channel, direction, event_type, summary, details_json, created_at)
      VALUES (?, ?, NULL, 'CRM', 'INTERNAL', 'PROPOSAL_CREATED', ?, ?, ?)
    `);
    commStmt.run(
      commId,
      data.companyId,
      `Proposta comercial "${data.title}" elaborada no valor de ${data.estimatedValue ? 'R$ ' + data.estimatedValue.toFixed(2) : 'A definir'}.`,
      JSON.stringify({ title: data.title, estimatedValue: data.estimatedValue }),
      now
    );

    this.logService.info(
      'CRM',
      'PROPOSAL_CREATED',
      `Proposta criada para empresa ${data.companyId}: ${data.title}`,
      { proposalId: id, value: data.estimatedValue },
      data.companyId
    );

    const selectStmt = this.db.prepare(`SELECT * FROM proposals WHERE id = ?`);
    return selectStmt.get(id) as unknown as ProposalRecord;
  }

  getProposalsForCompany(companyId: string): ProposalRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM proposals WHERE company_id = ? ORDER BY created_at DESC
    `);
    return stmt.all(companyId) as unknown as ProposalRecord[];
  }

  getCommunicationsHistory(companyId: string): CommunicationRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM communications WHERE company_id = ? ORDER BY created_at DESC
    `);
    return stmt.all(companyId) as unknown as CommunicationRecord[];
  }

  /**
   * Retorna os dados completos agregados da empresa para alimentar as 6 abas da tela de detalhe:
   * Resumo, Auditoria, Oportunidades, Mensagem, Histórico, CRM
   */
  getAggregatedCompanyDetail(companyId: string): CompanyAggregatedDetail {
    const company = this.companyService.getCompanyById(companyId);
    if (!company) {
      throw new Error(`Empresa ${companyId} não encontrada.`);
    }

    const contacts = this.companyService.getContacts(companyId);

    const auditsStmt = this.db.prepare(`SELECT * FROM audits WHERE company_id = ? ORDER BY created_at DESC`);
    const allAudits = auditsStmt.all(companyId);
    const latestAudit = allAudits.length > 0 ? allAudits[0] : null;

    const scoresStmt = this.db.prepare(`SELECT * FROM lead_scores WHERE company_id = ? ORDER BY created_at DESC`);
    const allScores = scoresStmt.all(companyId);
    const latestScore = allScores.length > 0 ? allScores[0] : null;

    const messagesStmt = this.db.prepare(`SELECT * FROM messages WHERE company_id = ? ORDER BY created_at DESC`);
    const allMessages = messagesStmt.all(companyId);
    const latestMessage = allMessages.length > 0 ? allMessages[0] : null;

    const proposals = this.getProposalsForCompany(companyId);
    const communications = this.getCommunicationsHistory(companyId);
    const logs = this.logService.getRecentLogs(50, companyId);

    return {
      company,
      contacts,
      latestAudit,
      allAudits,
      latestScore,
      allScores,
      latestMessage,
      allMessages,
      proposals,
      communications,
      logs,
    };
  }
}
