import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { DatabaseManager } from '../database/connection';
import { SystemLogRecord } from '../types/models';

export class LogService {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db || DatabaseManager.getConnection();
  }

  log(
    level: 'INFO' | 'WARN' | 'ERROR',
    category: string,
    action: string,
    message: string,
    metadata?: Record<string, unknown> | null,
    companyId?: string | null,
    jobId?: string | null
  ): SystemLogRecord {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const metadataJson = metadata ? JSON.stringify(metadata) : null;

    const stmt = this.db.prepare(`
      INSERT INTO system_logs (id, level, category, action, company_id, job_id, message, metadata_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      level,
      category,
      action,
      companyId ?? null,
      jobId ?? null,
      message,
      metadataJson,
      createdAt
    );

    return {
      id,
      level,
      category,
      action,
      company_id: companyId ?? null,
      job_id: jobId ?? null,
      message,
      metadata_json: metadataJson,
      created_at: createdAt,
    };
  }

  info(
    category: string,
    action: string,
    message: string,
    metadata?: Record<string, unknown> | null,
    companyId?: string | null,
    jobId?: string | null
  ): SystemLogRecord {
    return this.log('INFO', category, action, message, metadata, companyId, jobId);
  }

  warn(
    category: string,
    action: string,
    message: string,
    metadata?: Record<string, unknown> | null,
    companyId?: string | null,
    jobId?: string | null
  ): SystemLogRecord {
    return this.log('WARN', category, action, message, metadata, companyId, jobId);
  }

  error(
    category: string,
    action: string,
    message: string,
    metadata?: Record<string, unknown> | null,
    companyId?: string | null,
    jobId?: string | null
  ): SystemLogRecord {
    return this.log('ERROR', category, action, message, metadata, companyId, jobId);
  }

  getRecentLogs(limit = 100, companyId?: string): SystemLogRecord[] {
    if (companyId) {
      const stmt = this.db.prepare(`
        SELECT * FROM system_logs
        WHERE company_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `);
      return stmt.all(companyId, limit) as unknown as SystemLogRecord[];
    }

    const stmt = this.db.prepare(`
      SELECT * FROM system_logs
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit) as unknown as SystemLogRecord[];
  }
}
