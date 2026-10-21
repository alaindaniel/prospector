import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { DatabaseManager } from '../database/connection';
import { LogService } from '../services/LogService';
import {
  AutomationJobRecord,
  AutomationJobStatus,
  AutomationJobType,
} from '../types/models';

export interface CreateJobOptions {
  type: AutomationJobType;
  companyId?: string | null;
  payload?: Record<string, unknown> | null;
  idempotencyKey?: string | null;
  maxAttempts?: number;
  timeoutMs?: number;
}

export type JobHandler = (
  job: AutomationJobRecord,
  signal: AbortSignal
) => Promise<Record<string, unknown> | void>;

export class AutomationEngine {
  private db: DatabaseSync;
  private logService: LogService;
  private handlers = new Map<AutomationJobType, JobHandler>();

  constructor(db?: DatabaseSync) {
    this.db = db || DatabaseManager.getConnection();
    this.logService = new LogService(this.db);
  }

  registerHandler(type: AutomationJobType, handler: JobHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * Enfileira ou recupera um job com controle estrito de idempotência
   * para prevenir execuções duplicadas ativas.
   */
  enqueueJob(options: CreateJobOptions): AutomationJobRecord {
    const {
      type,
      companyId = null,
      payload = null,
      idempotencyKey = null,
      maxAttempts = 3,
      timeoutMs = 15000,
    } = options;

    if (idempotencyKey) {
      // Verifica se já existe um job com essa idempotencyKey ativo ou finalizado
      const checkStmt = this.db.prepare(`
        SELECT * FROM automation_jobs 
        WHERE idempotency_key = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      const existing = checkStmt.get(idempotencyKey) as unknown as AutomationJobRecord | undefined;
      if (existing) {
        // Se estiver pendente, rodando ou já concluído, não duplica
        if (['PENDING', 'RUNNING', 'COMPLETED', 'WAITING_APPROVAL'].includes(existing.status)) {
          this.logService.info(
            'AUTOMATION',
            'DUPLICATE_DETECTED',
            `Execução duplicada prevenida para a chave: ${idempotencyKey} (Job ${existing.id} em estado ${existing.status}).`,
            { jobId: existing.id, status: existing.status },
            companyId,
            existing.id
          );
          return existing;
        }
      }
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const payloadJson = payload ? JSON.stringify(payload) : null;

    const insertStmt = this.db.prepare(`
      INSERT INTO automation_jobs (
        id, type, company_id, idempotency_key, status, payload_json,
        attempts, max_attempts, timeout_ms, last_error, created_at,
        executed_at, next_run_at, result_json, updated_at
      )
      VALUES (?, ?, ?, ?, 'PENDING', ?, 0, ?, ?, NULL, ?, NULL, ?, NULL, ?)
    `);

    insertStmt.run(
      id,
      type,
      companyId,
      idempotencyKey,
      payloadJson,
      maxAttempts,
      timeoutMs,
      now,
      now, // pronto para execução imediata
      now
    );

    this.logService.info(
      'AUTOMATION',
      'JOB_ENQUEUED',
      `Job ${id} (${type}) enfileirado com sucesso.`,
      { type, maxAttempts, timeoutMs, idempotencyKey },
      companyId,
      id
    );

    return this.getJobById(id)!;
  }

  getJobById(id: string): AutomationJobRecord | null {
    const stmt = this.db.prepare(`SELECT * FROM automation_jobs WHERE id = ?`);
    const record = stmt.get(id) as unknown as AutomationJobRecord | undefined;
    return record || null;
  }

  /**
   * Recuperação de estado: tarefas que ficaram em 'RUNNING' por queda abrupta do servidor
   * são marcadas para nova tentativa com backoff ou falha controlada se excederam o limite.
   */
  recoverStuckJobs(): number {
    const stmt = this.db.prepare(`
      SELECT * FROM automation_jobs 
      WHERE status = 'RUNNING'
    `);
    const stuckJobs = stmt.all() as unknown as AutomationJobRecord[];
    let recoveredCount = 0;

    for (const job of stuckJobs) {
      const now = new Date().toISOString();
      if (job.attempts >= job.max_attempts) {
        const failStmt = this.db.prepare(`
          UPDATE automation_jobs 
          SET status = 'FAILED', last_error = ?, updated_at = ?
          WHERE id = ?
        `);
        failStmt.run('Recuperação pós-interrupção: número máximo de tentativas atingido.', now, job.id);
        this.logService.error(
          'AUTOMATION',
          'RECOVERY_FAILED',
          `Job ${job.id} finalizado como FAILED após interrupção (atingiu limite de ${job.max_attempts} tentativas).`,
          { jobId: job.id },
          job.company_id,
          job.id
        );
      } else {
        const backoffMs = Math.pow(2, job.attempts) * 1000;
        const nextRun = new Date(Date.now() + backoffMs).toISOString();
        const retryStmt = this.db.prepare(`
          UPDATE automation_jobs 
          SET status = 'PENDING', next_run_at = ?, last_error = ?, updated_at = ?
          WHERE id = ?
        `);
        retryStmt.run(nextRun, 'Interrupção de execução detectada na reinicialização do sistema.', now, job.id);
        recoveredCount++;
        this.logService.warn(
          'AUTOMATION',
          'RECOVERY_RETRY',
          `Job ${job.id} recuperado e reagendado com backoff para ${nextRun}.`,
          { nextRun, attempts: job.attempts },
          job.company_id,
          job.id
        );
      }
    }

    return recoveredCount;
  }

  /**
   * Executa um job específico respeitando timeouts, retries limitados e backoff.
   */
  async processJob(jobId: string): Promise<AutomationJobRecord> {
    const job = this.getJobById(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} não encontrado.`);
    }

    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(job.status)) {
      return job;
    }

    const handler = this.handlers.get(job.type);
    if (!handler) {
      const err = `Nenhum processador registrado para o tipo ${job.type}.`;
      this.failJob(job, err);
      throw new Error(err);
    }

    // Marca como RUNNING e incrementa tentativas
    const newAttempts = job.attempts + 1;
    const executedAt = new Date().toISOString();
    const markRunningStmt = this.db.prepare(`
      UPDATE automation_jobs 
      SET status = 'RUNNING', attempts = ?, executed_at = ?, updated_at = ?
      WHERE id = ?
    `);
    markRunningStmt.run(newAttempts, executedAt, executedAt, job.id);

    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => {
      abortController.abort();
    }, job.timeout_ms);

    try {
      const freshJob = this.getJobById(job.id)!;
      const handlerPromise = handler(freshJob, abortController.signal);

      // Timeout manual de segurança
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Timeout de execução após ${job.timeout_ms}ms.`));
        }, job.timeout_ms);
        abortController.signal.addEventListener('abort', () => clearTimeout(timer));
      });

      const result = await Promise.race([handlerPromise, timeoutPromise]);
      clearTimeout(timeoutHandle);

      // Sucesso
      const now = new Date().toISOString();
      const resultJson = result ? JSON.stringify(result) : null;
      const completeStmt = this.db.prepare(`
        UPDATE automation_jobs 
        SET status = 'COMPLETED', result_json = ?, updated_at = ?
        WHERE id = ?
      `);
      completeStmt.run(resultJson, now, job.id);

      this.logService.info(
        'AUTOMATION',
        'JOB_COMPLETED',
        `Job ${job.id} (${job.type}) concluído com sucesso.`,
        { attempts: newAttempts },
        job.company_id,
        job.id
      );

      return this.getJobById(job.id)!;
    } catch (err: unknown) {
      clearTimeout(timeoutHandle);
      const errorMessage = err instanceof Error ? err.message : String(err);
      return this.handleJobFailure(job, newAttempts, errorMessage);
    }
  }

  private handleJobFailure(
    job: AutomationJobRecord,
    attemptsMade: number,
    errorMessage: string
  ): AutomationJobRecord {
    const now = new Date().toISOString();

    if (attemptsMade >= job.max_attempts) {
      // Falha definitiva: não repete indefinidamente
      const failStmt = this.db.prepare(`
        UPDATE automation_jobs 
        SET status = 'FAILED', last_error = ?, updated_at = ?
        WHERE id = ?
      `);
      failStmt.run(errorMessage, now, job.id);

      this.logService.error(
        'AUTOMATION',
        'JOB_MAX_ATTEMPTS_EXCEEDED',
        `Job ${job.id} (${job.type}) falhou definitivamente após ${attemptsMade}/${job.max_attempts} tentativas: ${errorMessage}`,
        { error: errorMessage },
        job.company_id,
        job.id
      );
    } else {
      // Reagenda com backoff exponencial: 2^tentativa * 1000 ms
      const backoffMs = Math.pow(2, attemptsMade) * 1000;
      const nextRunAt = new Date(Date.now() + backoffMs).toISOString();

      const retryStmt = this.db.prepare(`
        UPDATE automation_jobs 
        SET status = 'PENDING', next_run_at = ?, last_error = ?, updated_at = ?
        WHERE id = ?
      `);
      retryStmt.run(nextRunAt, errorMessage, now, job.id);

      this.logService.warn(
        'AUTOMATION',
        'JOB_RETRY_SCHEDULED',
        `Job ${job.id} falhou (tentativa ${attemptsMade}/${job.max_attempts}). Reagendado com backoff para ${nextRunAt}. Erro: ${errorMessage}`,
        { nextRunAt, attempts: attemptsMade, backoffMs },
        job.company_id,
        job.id
      );
    }

    return this.getJobById(job.id)!;
  }

  private failJob(job: AutomationJobRecord, error: string): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE automation_jobs 
      SET status = 'FAILED', last_error = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(error, now, job.id);
  }

  cancelJob(jobId: string, reason = 'Cancelado pelo usuário'): AutomationJobRecord {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE automation_jobs 
      SET status = 'CANCELLED', last_error = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(reason, now, jobId);
    this.logService.info('AUTOMATION', 'JOB_CANCELLED', `Job ${jobId} cancelado. Motivo: ${reason}`, null, null, jobId);
    return this.getJobById(jobId)!;
  }

  getPendingJobs(limit = 10): AutomationJobRecord[] {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      SELECT * FROM automation_jobs 
      WHERE status = 'PENDING' AND (next_run_at IS NULL OR next_run_at <= ?)
      ORDER BY created_at ASC
      LIMIT ?
    `);
    return stmt.all(now, limit) as unknown as AutomationJobRecord[];
  }

  getAllJobs(limit = 50): AutomationJobRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM automation_jobs 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(limit) as unknown as AutomationJobRecord[];
  }
}
