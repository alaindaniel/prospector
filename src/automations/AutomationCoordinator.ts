import { DatabaseSync } from 'node:sqlite';
import { DatabaseManager } from '../database/connection';
import { AutomationEngine } from './AutomationEngine';
import { CompanyService } from '../services/CompanyService';
import { AuditService } from '../services/AuditService';
import { LeadScoringService } from '../services/LeadScoringService';
import { MessageService } from '../services/MessageService';
import { AIService } from '../ai/AIService';
import { MessageChannel } from '../types/models';

export class AutomationCoordinator {
  private engine: AutomationEngine;
  private companyService: CompanyService;
  private auditService: AuditService;
  private leadScoringService: LeadScoringService;
  private messageService: MessageService;
  private aiService: AIService;

  constructor(db?: DatabaseSync) {
    const conn = db || DatabaseManager.getConnection();
    this.engine = new AutomationEngine(conn);
    this.companyService = new CompanyService(conn);
    this.auditService = new AuditService(conn);
    this.leadScoringService = new LeadScoringService(conn);
    this.messageService = new MessageService(conn);
    this.aiService = new AIService(conn);

    this.registerAllHandlers();
  }

  getEngine(): AutomationEngine {
    return this.engine;
  }

  private registerAllHandlers(): void {
    // 1. IMPORT_COMPANIES
    this.engine.registerHandler('IMPORT_COMPANIES', async (job) => {
      const payload = job.payload_json ? JSON.parse(job.payload_json) : {};
      const { region = 'Zona Sul', city = 'São Paulo', state = 'SP', segment = 'Oficina Mecânica', limit = 10 } = payload;
      const result = await this.companyService.discoverAndImportFromProvider({
        region,
        city,
        state,
        segment,
        limit,
      });
      return { imported: result.imported, updated: result.updated, total: result.companies.length };
    });

    // 2. ANALYZE_COMPANY
    this.engine.registerHandler('ANALYZE_COMPANY', async (job) => {
      if (!job.company_id) throw new Error('ID da empresa é obrigatório.');
      const company = this.companyService.getCompanyById(job.company_id);
      if (!company) throw new Error(`Empresa ${job.company_id} não encontrada.`);
      const result = await this.aiService.analyzeCompany(company);
      return { summary: result.summary, maturity: result.digitalMaturityLevel };
    });

    // 3. RUN_AUDIT
    this.engine.registerHandler('RUN_AUDIT', async (job) => {
      if (!job.company_id) throw new Error('ID da empresa é obrigatório.');
      const audit = await this.auditService.runAuditForCompany(job.company_id);
      return { auditId: audit.id };
    });

    // 4. SCORE_LEAD
    this.engine.registerHandler('SCORE_LEAD', async (job) => {
      if (!job.company_id) throw new Error('ID da empresa é obrigatório.');
      const score = await this.leadScoringService.scoreCompany(job.company_id);
      return { score: score.score, priority: score.priority, classification: score.classification };
    });

    // 5. GENERATE_MESSAGE
    this.engine.registerHandler('GENERATE_MESSAGE', async (job) => {
      if (!job.company_id) throw new Error('ID da empresa é obrigatório.');
      const payload = job.payload_json ? JSON.parse(job.payload_json) : {};
      const channel: MessageChannel = payload.channel || 'EMAIL';
      const msg = await this.messageService.generatePersonalizedMessage(job.company_id, channel, payload.recipient);
      return { messageId: msg.id, status: msg.status };
    });

    // 6. FULL_PROSPECTING_FLOW: Executa o ciclo completo do MVP para a empresa
    // Auditoria -> Diagnóstico IA -> Score -> Mensagem Personalizada (aguardando aprovação)
    this.engine.registerHandler('FULL_PROSPECTING_FLOW', async (job) => {
      if (!job.company_id) throw new Error('ID da empresa é obrigatório.');
      const payload = job.payload_json ? JSON.parse(job.payload_json) : {};
      const channel: MessageChannel = payload.channel || 'EMAIL';

      // 1. Auditoria
      const audit = await this.auditService.runAuditForCompany(job.company_id);
      // 2. Score
      const score = await this.leadScoringService.scoreCompany(job.company_id);
      // 3. Mensagem Personalizada
      const msg = await this.messageService.generatePersonalizedMessage(job.company_id, channel, payload.recipient);

      return {
        auditId: audit.id,
        score: score.score,
        priority: score.priority,
        messageId: msg.id,
        messageStatus: msg.status,
      };
    });
  }
}
