import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DATABASE_SCHEMA_SQL } from './schema';
import { SecurityService } from '../security/security';

export class DatabaseManager {
  private static instance: DatabaseSync | null = null;
  private static currentPath: string | null = null;

  /**
   * Obtém ou inicializa a conexão SQLite e aplica o schema automaticamente.
   * Suporta ':memory:' para testes isolados.
   */
  static getConnection(customPath?: string): DatabaseSync {
    const targetPath = customPath || SecurityService.getEnvConfig().dbPath;

    if (this.instance && this.currentPath === targetPath) {
      return this.instance;
    }

    if (this.instance && this.currentPath !== targetPath) {
      try {
        this.instance.close();
      } catch {
        // Ignora erro ao fechar conexão anterior
      }
      this.instance = null;
    }

    if (targetPath !== ':memory:') {
      const resolvedDir = path.dirname(path.resolve(targetPath));
      if (!fs.existsSync(resolvedDir)) {
        fs.mkdirSync(resolvedDir, { recursive: true });
      }
    }

    const db = new DatabaseSync(targetPath);
    db.exec('PRAGMA foreign_keys = ON;');
    if (targetPath !== ':memory:') {
      db.exec('PRAGMA journal_mode = WAL;');
    }
    db.exec(DATABASE_SCHEMA_SQL);

    this.instance = db;
    this.currentPath = targetPath;
    return db;
  }

  /**
   * Cria uma instância de banco isolada (ex: para testes unitários/integração).
   */
  static createIsolatedDatabase(dbPath = ':memory:'): DatabaseSync {
    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec(DATABASE_SCHEMA_SQL);
    return db;
  }

  static closeConnection(): void {
    if (this.instance) {
      try {
        this.instance.close();
      } catch {
        // Ignora erro
      }
      this.instance = null;
      this.currentPath = null;
    }
  }
}
