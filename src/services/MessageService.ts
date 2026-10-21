import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { DatabaseManager } from '../database/connection';
import { AIService } from '../ai/AIService';
import { CompanyService } from './CompanyService';
import { AuditService } from './AuditService';
import { LeadScoringService } from './LeadScoringService';
import { LogService } from './LogService';
import { MessageChannel, MessageRecord, MessageStatus } from '../types/models';

export class MessageService {
  private db: DatabaseSync;
  private aiService: AIService;
  private companyService: CompanyService;
  private auditService: AuditService;
  private leadScoringService: LeadScoringService;
  private logService: LogService;

  constructor(db?: DatabaseSync) {
    this.db = db || DatabaseManager.getConnection();
    this.aiService = new AIService(this.db);
    this.companyService = new CompanyService(this.db);
    this.auditService = new AuditService(this.db);
    this.leadScoringService = new LeadScoringService(this.db);
    this.logService = new LogService(this.db);
  }

  async generatePersonalizedMessage(
    companyId: string,
    channel: MessageChannel = 'EMAIL',
    recipient?: string | null
  ): Promise<MessageRecord> {
    const company = this.companyService.getCompanyById(companyId);
    if (!company) {
      throw new Error(`Empresa com ID ${companyId} não encontrada.`);
    }

    const audit = this.auditService.getLatestAuditForCompany(companyId);
    const leadScore = this.leadScoringService.getLatestScoreForCompany(companyId);

    const message = await this.aiService.generateMessage(
      company,
      channel,
      recipient,
      audit,
      leadScore
    );

    // Registra evento de histórico em communications
    const commId = crypto.randomUUID();
    const now = new Date().toISOString();
    const commStmt = this.db.prepare(`
      INSERT INTO communications (id, company_id, message_id, channel, direction, event_type, summary, details_json, created_at)
      VALUES (?, ?, ?, ?, 'INTERNAL', 'MESSAGE_GENERATED', ?, ?, ?)
    `);
    commStmt.run(
      commId,
      company.id,
      message.id,
      channel,
      `Nova mensagem gerada para o canal ${channel} aguardando aprovação humana.`,
      JSON.stringify({ subject: message.subject, recipient: message.recipient }),
      now
    );

    return message;
  }

  getMessageById(messageId: string): MessageRecord | null {
    const stmt = this.db.prepare(`SELECT * FROM messages WHERE id = ?`);
    const row = stmt.get(messageId) as unknown as MessageRecord | undefined;
    return row || null;
  }

  getMessagesForCompany(companyId: string): MessageRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM messages WHERE company_id = ? ORDER BY created_at DESC
    `);
    return stmt.all(companyId) as unknown as MessageRecord[];
  }

  /**
   * Registra a aprovação da mensagem.
   * REGRA FUNDAMENTAL DA FASE 1:
   * "O botão APROVAR nesta fase deve apenas registrar a aprovação. Não enviar mensagens externas ainda."
   */
  approveMessage(messageId: string, decidedBy = 'Operador Comercial', notes?: string): MessageRecord {
    const message = this.getMessageById(messageId);
    if (!message) {
      throw new Error(`Mensagem ${messageId} não encontrada.`);
    }

    const now = new Date().toISOString();
    const updateStmt = this.db.prepare(`
      UPDATE messages 
      SET status = 'APPROVED', user_decision = 'APPROVED', decided_by = ?, decided_at = ?, decision_notes = ?, updated_at = ?
      WHERE id = ?
    `);
    updateStmt.run(decidedBy, now, notes || 'Aprovada sem ressalvas pelo operador.', now, message.id);

    // Atualiza estágio do lead no CRM para 'CONTATO APROVADO'
    const updateCompanyStmt = this.db.prepare(`
      UPDATE companies 
      SET crm_stage = 'CONTATO APROVADO', updated_at = ?
      WHERE id = ?
    `);
    updateCompanyStmt.run(now, message.company_id);

    // Registra evento no histórico consolidado de comunicações
    const commId = crypto.randomUUID();
    const commStmt = this.db.prepare(`
      INSERT INTO communications (id, company_id, message_id, channel, direction, event_type, summary, details_json, created_at)
      VALUES (?, ?, ?, ?, 'INTERNAL', 'MESSAGE_APPROVED', ?, ?, ?)
    `);
    commStmt.run(
      commId,
      message.company_id,
      message.id,
      message.channel,
      `Mensagem para ${message.recipient || 'contato'} aprovada. Estágio do CRM avançado para 'CONTATO APROVADO'. (Fase 1: sem disparo externo)`,
      JSON.stringify({ notes, decidedBy, phase: 'PHASE_1_INTERNAL_APPROVAL' }),
      now
    );

    this.logService.info(
      'MESSAGES',
      'MESSAGE_APPROVED',
      `Mensagem ${message.id} aprovada por ${decidedBy}. Lead movido para CONTATO APROVADO.`,
      { messageId: message.id, companyId: message.company_id },
      message.company_id
    );

    return this.getMessageById(messageId)!;
  }

  /**
   * Registra a rejeição da mensagem com justificativa.
   */
  rejectMessage(messageId: string, reason: string, decidedBy = 'Operador Comercial'): MessageRecord {
    const message = this.getMessageById(messageId);
    if (!message) {
      throw new Error(`Mensagem ${messageId} não encontrada.`);
    }

    const now = new Date().toISOString();
    const updateStmt = this.db.prepare(`
      UPDATE messages 
      SET status = 'REJECTED', user_decision = 'REJECTED', decided_by = ?, decided_at = ?, decision_notes = ?, updated_at = ?
      WHERE id = ?
    `);
    updateStmt.run(decidedBy, now, reason, now, message.id);

    // Registra comunicação de rejeição
    const commId = crypto.randomUUID();
    const commStmt = this.db.prepare(`
      INSERT INTO communications (id, company_id, message_id, channel, direction, event_type, summary, details_json, created_at)
      VALUES (?, ?, ?, ?, 'INTERNAL', 'MESSAGE_REJECTED', ?, ?, ?)
    `);
    commStmt.run(
      commId,
      message.company_id,
      message.id,
      message.channel,
      `Mensagem rejeitada pelo operador. Motivo: ${reason}`,
      JSON.stringify({ reason, decidedBy }),
      now
    );

    this.logService.warn(
      'MESSAGES',
      'MESSAGE_REJECTED',
      `Mensagem ${message.id} rejeitada por ${decidedBy}. Motivo: ${reason}`,
      { messageId: message.id, reason },
      message.company_id
    );

    return this.getMessageById(messageId)!;
  }

  /**
   * Permite editar o assunto e o corpo da mensagem antes ou durante a aprovação.
   */
  editAndApproveMessage(
    messageId: string,
    data: { subject?: string | null; body: string; notes?: string; approveNow?: boolean },
    decidedBy = 'Operador Comercial'
  ): MessageRecord {
    const message = this.getMessageById(messageId);
    if (!message) {
      throw new Error(`Mensagem ${messageId} não encontrada.`);
    }

    const now = new Date().toISOString();
    const newStatus: MessageStatus = data.approveNow ? 'APPROVED' : 'WAITING_APPROVAL';
    const decision = data.approveNow ? 'APPROVED' : 'EDITED';

    const updateStmt = this.db.prepare(`
      UPDATE messages 
      SET subject = ?, body = ?, status = ?, user_decision = ?, decided_by = ?, decided_at = ?, decision_notes = ?, updated_at = ?
      WHERE id = ?
    `);
    updateStmt.run(
      data.subject !== undefined ? data.subject : message.subject,
      data.body,
      newStatus,
      decision,
      decidedBy,
      data.approveNow ? now : message.decided_at,
      data.notes || 'Mensagem editada pelo operador comercial.',
      now,
      message.id
    );

    if (data.approveNow) {
      const updateComp = this.db.prepare(`
        UPDATE companies SET crm_stage = 'CONTATO APROVADO', updated_at = ? WHERE id = ?
      `);
      updateComp.run(now, message.company_id);
    }

    const commId = crypto.randomUUID();
    const commStmt = this.db.prepare(`
      INSERT INTO communications (id, company_id, message_id, channel, direction, event_type, summary, details_json, created_at)
      VALUES (?, ?, ?, ?, 'INTERNAL', 'MESSAGE_EDITED', ?, ?, ?)
    `);
    commStmt.run(
      commId,
      message.company_id,
      message.id,
      message.channel,
      `Mensagem editada${data.approveNow ? ' e aprovada' : ''} pelo operador.`,
      JSON.stringify({ notes: data.notes, approved: data.approveNow }),
      now
    );

    return this.getMessageById(messageId)!;
  }
}
