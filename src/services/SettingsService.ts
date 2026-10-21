import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { DatabaseManager } from '../database/connection';
import { RegionSegmentConfig, SettingRecord } from '../types/models';
import { SecurityService } from '../security/security';

export class SettingsService {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db || DatabaseManager.getConnection();
  }

  setSetting(key: string, value: unknown, isSecret = false): SettingRecord {
    const existing = this.getSettingRecord(key);
    const now = new Date().toISOString();
    const valueJson = JSON.stringify(value);

    if (existing) {
      const stmt = this.db.prepare(`
        UPDATE settings 
        SET value_json = ?, is_secret = ?, updated_at = ?
        WHERE key = ?
      `);
      stmt.run(valueJson, isSecret ? 1 : 0, now, key);
    } else {
      const id = crypto.randomUUID();
      const stmt = this.db.prepare(`
        INSERT INTO settings (id, key, value_json, is_secret, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(id, key, valueJson, isSecret ? 1 : 0, now);
    }

    return this.getSettingRecord(key)!;
  }

  getSetting<T>(key: string, defaultValue: T): T {
    const record = this.getSettingRecord(key);
    if (!record) return defaultValue;
    try {
      return JSON.parse(record.value_json) as T;
    } catch {
      return defaultValue;
    }
  }

  getSettingRecord(key: string): SettingRecord | null {
    const stmt = this.db.prepare(`SELECT * FROM settings WHERE key = ?`);
    const row = stmt.get(key) as unknown as SettingRecord | undefined;
    return row || null;
  }

  getAllSettingsSafe(): Record<string, unknown> {
    const stmt = this.db.prepare(`SELECT * FROM settings`);
    const rows = stmt.all() as unknown as SettingRecord[];
    const result: Record<string, unknown> = {};

    for (const row of rows) {
      try {
        const val = JSON.parse(row.value_json);
        if (row.is_secret) {
          result[row.key] = typeof val === 'string' ? SecurityService.maskSecret(val) : '******';
        } else {
          result[row.key] = val;
        }
      } catch {
        result[row.key] = null;
      }
    }

    return result;
  }

  // Gestão de Regiões e Segmentos de Prospecção
  listRegionsAndSegments(): RegionSegmentConfig[] {
    return this.getSetting<RegionSegmentConfig[]>('registered_regions_segments', [
      {
        id: 'reg_sp_leste_oficinas',
        region: 'Zona Leste',
        city: 'São Paulo',
        state: 'SP',
        segment: 'Oficina Mecânica',
        description: 'Polo automotivo e oficinas multimarcas na Zona Leste de SP',
        createdAt: '2026-01-10T10:00:00.000Z',
      },
      {
        id: 'reg_sp_sul_odonto',
        region: 'Zona Sul',
        city: 'São Paulo',
        state: 'SP',
        segment: 'Clínica Odontológica',
        description: 'Clínicas e consultórios odontológicos e estéticos',
        createdAt: '2026-01-10T10:00:00.000Z',
      },
      {
        id: 'reg_cwb_restaurantes',
        region: 'Centro',
        city: 'Curitiba',
        state: 'PR',
        segment: 'Restaurante',
        description: 'Gastronomia e restaurantes locais no centro da capital',
        createdAt: '2026-01-15T10:00:00.000Z',
      },
    ]);
  }

  addRegionAndSegment(data: {
    region: string;
    city: string;
    state?: string | null;
    segment: string;
    description?: string | null;
  }): RegionSegmentConfig {
    const list = this.listRegionsAndSegments();
    const newConfig: RegionSegmentConfig = {
      id: crypto.randomUUID(),
      region: data.region.trim(),
      city: data.city.trim(),
      state: data.state?.trim().toUpperCase() || null,
      segment: data.segment.trim(),
      description: data.description?.trim() || null,
      createdAt: new Date().toISOString(),
    };

    list.push(newConfig);
    this.setSetting('registered_regions_segments', list, false);
    return newConfig;
  }
}
