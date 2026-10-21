import { DatabaseSync } from 'node:sqlite';
import { DatabaseManager } from '../database/connection';
import { AIService } from '../ai/AIService';
import { CompanyService } from './CompanyService';
import { AuditService } from './AuditService';
import { LogService } from './LogService';
import { LeadScoreRecord } from '../types/models';

export class LeadScoringService {
  private db: DatabaseSync;
  private aiService: AIService;
  private companyService: CompanyService;
  private auditService: AuditService;
  private logService: LogService;

  constructor(db?: DatabaseSync) {
    this.db = db || DatabaseManager.getConnection();
    this.aiService = new AIService(this.db);
    this.companyService = new CompanyService(this.db);
    this.auditService = new AuditService(this.db);
    this.logService = new LogService(this.db);
  }

  async scoreCompany(companyId: string): Promise<LeadScoreRecord> {
    const company = this.companyService.getCompanyById(companyId);
    if (!company) {
      throw new Error(`Empresa com ID ${companyId} não encontrada.`);
    }

    let latestAudit = this.auditService.getLatestAuditForCompany(companyId);
    if (!latestAudit) {
      // Se ainda não tiver auditoria, gera uma automaticamente
      latestAudit = await this.auditService.runAuditForCompany(companyId);
    }

    const scoreRecord = await this.aiService.generateLeadScore(company, latestAudit);

    this.logService.info(
      'LEAD_SCORING',
      'LEAD_CLASSIFIED',
      `Lead ${company.name} pontuado com ${scoreRecord.score} (${scoreRecord.classification} - Prioridade ${scoreRecord.priority}).`,
      { score: scoreRecord.score, priority: scoreRecord.priority },
      company.id
    );

    return scoreRecord;
  }

  getLeadScoresForCompany(companyId: string): LeadScoreRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM lead_scores WHERE company_id = ? ORDER BY created_at DESC
    `);
    return stmt.all(companyId) as unknown as LeadScoreRecord[];
  }

  getLatestScoreForCompany(companyId: string): LeadScoreRecord | null {
    const stmt = this.db.prepare(`
      SELECT * FROM lead_scores WHERE company_id = ? ORDER BY created_at DESC LIMIT 1
    `);
    const row = stmt.get(companyId) as unknown as LeadScoreRecord | undefined;
    return row || null;
  }
}
