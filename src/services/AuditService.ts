import { DatabaseSync } from 'node:sqlite';
import { DatabaseManager } from '../database/connection';
import { AIService } from '../ai/AIService';
import { CompanyService } from './CompanyService';
import { LogService } from './LogService';
import { AuditRecord } from '../types/models';

export class AuditService {
  private db: DatabaseSync;
  private aiService: AIService;
  private companyService: CompanyService;
  private logService: LogService;

  constructor(db?: DatabaseSync) {
    this.db = db || DatabaseManager.getConnection();
    this.aiService = new AIService(this.db);
    this.companyService = new CompanyService(this.db);
    this.logService = new LogService(this.db);
  }

  async runAuditForCompany(companyId: string): Promise<AuditRecord> {
    const company = this.companyService.getCompanyById(companyId);
    if (!company) {
      throw new Error(`Empresa com ID ${companyId} não encontrada.`);
    }

    // Executa análise e síntese
    await this.aiService.analyzeCompany(company);

    // Gera e persiste auditoria detalhada com separação de fatos coletados, inferências e recomendações
    const audit = await this.aiService.generateAudit(company);

    this.logService.info(
      'AUDIT',
      'AUDIT_COMPLETED',
      `Auditoria completa realizada para a empresa ${company.name}.`,
      { auditId: audit.id },
      company.id
    );

    return audit;
  }

  getAuditsForCompany(companyId: string): AuditRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM audits WHERE company_id = ? ORDER BY created_at DESC
    `);
    return stmt.all(companyId) as unknown as AuditRecord[];
  }

  getLatestAuditForCompany(companyId: string): AuditRecord | null {
    const stmt = this.db.prepare(`
      SELECT * FROM audits WHERE company_id = ? ORDER BY created_at DESC LIMIT 1
    `);
    const row = stmt.get(companyId) as unknown as AuditRecord | undefined;
    return row || null;
  }
}
