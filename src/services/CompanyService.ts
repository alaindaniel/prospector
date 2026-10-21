import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { DatabaseManager } from '../database/connection';
import { LogService } from './LogService';
import { SettingsService } from './SettingsService';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import {
  CompanyRecord,
  ContactRecord,
  CRMStage,
  LeadPriority,
  RegionSegmentConfig,
} from '../types/models';
import { DiscoveredCompanyCandidate } from '../providers/interfaces/CompanyDataProvider';

export interface RegisterCompanyInput {
  name: string;
  cnpj?: string | null;
  category: string;
  region: string;
  city: string;
  state?: string | null;
  address?: string | null;
  rating?: number | null;
  review_count?: number | null;
  website?: string | null;
  phone?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  contacts?: Array<{
    name?: string | null;
    role?: string | null;
    email?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    is_primary?: boolean;
    source?: string;
  }>;
  collected_data_json?: Record<string, unknown> | null;
}

export class CompanyService {
  private db: DatabaseSync;
  private logService: LogService;
  private settingsService: SettingsService;

  constructor(db?: DatabaseSync) {
    this.db = db || DatabaseManager.getConnection();
    this.logService = new LogService(this.db);
    this.settingsService = new SettingsService(this.db);
  }

  // Normalização para deduplicação robusta
  static normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  static normalizeDigits(str: string | null | undefined): string | null {
    if (!str) return null;
    const digits = str.replace(/\D/g, '');
    return digits.length > 0 ? digits : null;
  }

  static normalizeDomain(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
      const formatted = url.startsWith('http') ? url : `https://${url}`;
      const parsed = new URL(formatted);
      return parsed.hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || null;
    }
  }

  /**
   * Deduplicação: verifica se já existe empresa cadastrada por:
   * 1. CNPJ idêntico
   * 2. Domínio do site idêntico
   * 3. Telefone normalizado idêntico
   * 4. Nome normalizado + Cidade idênticos
   */
  findDuplicateCompany(data: {
    name: string;
    city: string;
    cnpj?: string | null;
    website?: string | null;
    phone?: string | null;
  }): CompanyRecord | null {
    const normalizedName = CompanyService.normalizeString(data.name);
    const normalizedCity = CompanyService.normalizeString(data.city);
    const normalizedCnpj = CompanyService.normalizeDigits(data.cnpj);
    const normalizedDomain = CompanyService.normalizeDomain(data.website);
    const normalizedPhone = CompanyService.normalizeDigits(data.phone);

    // 1. Por CNPJ
    if (normalizedCnpj) {
      const stmt = this.db.prepare(`
        SELECT * FROM companies 
        WHERE cnpj IS NOT NULL AND REPLACE(REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '-', ''), '/', ''), ' ', '') = ?
        LIMIT 1
      `);
      const row = stmt.get(normalizedCnpj) as unknown as CompanyRecord | undefined;
      if (row) return row;
    }

    // 2. Por Domínio
    if (normalizedDomain) {
      const stmt = this.db.prepare(`
        SELECT * FROM companies 
        WHERE normalized_domain = ?
        LIMIT 1
      `);
      const row = stmt.get(normalizedDomain) as unknown as CompanyRecord | undefined;
      if (row) return row;
    }

    // 3. Por Telefone (com pelo menos 8 dígitos)
    if (normalizedPhone && normalizedPhone.length >= 8) {
      const stmt = this.db.prepare(`
        SELECT * FROM companies 
        WHERE normalized_phone = ?
        LIMIT 1
      `);
      const row = stmt.get(normalizedPhone) as unknown as CompanyRecord | undefined;
      if (row) return row;
    }

    // 4. Por Nome Normalizado + Cidade
    const stmt = this.db.prepare(`
      SELECT * FROM companies 
      WHERE normalized_name = ? AND LOWER(city) = LOWER(?)
      LIMIT 1
    `);
    const row = stmt.get(normalizedName, data.city.trim()) as unknown as CompanyRecord | undefined;
    return row || null;
  }

  /**
   * Cadastra ou atualiza uma empresa, garantindo que campos ausentes fiquem NULL
   * e que nenhuma informação seja alucinada.
   */
  registerCompany(input: RegisterCompanyInput): { company: CompanyRecord; isNew: boolean } {
    const existing = this.findDuplicateCompany({
      name: input.name,
      city: input.city,
      cnpj: input.cnpj,
      website: input.website,
      phone: input.phone,
    });

    const now = new Date().toISOString();
    const normalizedName = CompanyService.normalizeString(input.name);
    const normalizedDomain = CompanyService.normalizeDomain(input.website);
    const normalizedPhone = CompanyService.normalizeDigits(input.phone);

    // Preserva o dado bruto coletado explicitamente
    const rawCollectedData = input.collected_data_json || {
      name: input.name,
      cnpj: input.cnpj ?? null,
      category: input.category,
      region: input.region,
      city: input.city,
      state: input.state ?? null,
      address: input.address ?? null,
      rating: input.rating ?? null,
      review_count: input.review_count ?? null,
      website: input.website ?? null,
      phone: input.phone ?? null,
      instagram: input.instagram ?? null,
      whatsapp: input.whatsapp ?? null,
      email: input.email ?? null,
      importedAt: now,
    };

    if (existing) {
      // Atualiza enriquecendo campos ausentes sem sobrescrever dados consolidados
      const updatedRating = existing.rating !== null ? existing.rating : input.rating ?? null;
      const updatedReviews = existing.review_count !== null ? existing.review_count : input.review_count ?? null;
      const updatedWebsite = existing.website || input.website || null;
      const updatedPhone = existing.phone || input.phone || null;
      const updatedWhatsapp = existing.whatsapp || input.whatsapp || null;
      const updatedEmail = existing.email || input.email || null;
      const updatedInstagram = existing.instagram || input.instagram || null;
      const updatedAddress = existing.address || input.address || null;

      const updateStmt = this.db.prepare(`
        UPDATE companies 
        SET rating = ?, review_count = ?, website = ?, normalized_domain = ?,
            phone = ?, normalized_phone = ?, whatsapp = ?, email = ?,
            instagram = ?, address = ?, updated_at = ?
        WHERE id = ?
      `);

      updateStmt.run(
        updatedRating,
        updatedReviews,
        updatedWebsite,
        CompanyService.normalizeDomain(updatedWebsite),
        updatedPhone,
        CompanyService.normalizeDigits(updatedPhone),
        updatedWhatsapp,
        updatedEmail,
        updatedInstagram,
        updatedAddress,
        now,
        existing.id
      );

      this.logService.info(
        'COMPANIES',
        'COMPANY_UPDATED',
        `Empresa ${existing.name} atualizada por deduplicação.`,
        { companyId: existing.id },
        existing.id
      );

      return { company: this.getCompanyById(existing.id)!, isNew: false };
    }

    // Nova empresa
    const companyId = crypto.randomUUID();
    const insertStmt = this.db.prepare(`
      INSERT INTO companies (
        id, name, normalized_name, cnpj, category, region, city, state,
        address, rating, review_count, website, normalized_domain,
        phone, normalized_phone, instagram, whatsapp, email,
        crm_stage, priority, last_analysis_at, collected_data_json,
        ai_analysis_json, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NOVO', 'NAO_CLASSIFICADO', NULL, ?, NULL, ?, ?)
    `);

    insertStmt.run(
      companyId,
      input.name.trim(),
      normalizedName,
      input.cnpj?.trim() || null,
      input.category.trim(),
      input.region.trim(),
      input.city.trim(),
      input.state?.trim().toUpperCase() || null,
      input.address?.trim() || null,
      input.rating !== undefined ? input.rating : null,
      input.review_count !== undefined ? input.review_count : null,
      input.website?.trim() || null,
      normalizedDomain,
      input.phone?.trim() || null,
      normalizedPhone,
      input.instagram?.trim() || null,
      input.whatsapp?.trim() || null,
      input.email?.trim() || null,
      JSON.stringify(rawCollectedData),
      now,
      now
    );

    // Contatos vinculados
    if (input.contacts && input.contacts.length > 0) {
      for (const contact of input.contacts) {
        this.addContact(companyId, contact);
      }
    } else if (input.phone || input.email || input.whatsapp) {
      this.addContact(companyId, {
        name: 'Contato Comercial Principal',
        role: 'Atendimento Geral',
        email: input.email || null,
        phone: input.phone || null,
        whatsapp: input.whatsapp || null,
        is_primary: true,
        source: 'AUTO_EXTRACTION',
      });
    }

    this.logService.info(
      'COMPANIES',
      'COMPANY_REGISTERED',
      `Empresa cadastrada: ${input.name} (${input.city} - ${input.category}).`,
      { companyId, category: input.category, city: input.city },
      companyId
    );

    return { company: this.getCompanyById(companyId)!, isNew: true };
  }

  addContact(
    companyId: string,
    contactData: {
      name?: string | null;
      role?: string | null;
      email?: string | null;
      phone?: string | null;
      whatsapp?: string | null;
      is_primary?: boolean;
      source?: string;
    }
  ): ContactRecord {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO contacts (id, company_id, name, role, email, phone, whatsapp, is_primary, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      companyId,
      contactData.name || null,
      contactData.role || null,
      contactData.email || null,
      contactData.phone || null,
      contactData.whatsapp || null,
      contactData.is_primary ? 1 : 0,
      contactData.source || 'MANUAL',
      now
    );

    return {
      id,
      company_id: companyId,
      name: contactData.name || null,
      role: contactData.role || null,
      email: contactData.email || null,
      phone: contactData.phone || null,
      whatsapp: contactData.whatsapp || null,
      is_primary: contactData.is_primary ? 1 : 0,
      source: contactData.source || 'MANUAL',
      created_at: now,
    };
  }

  getContacts(companyId: string): ContactRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM contacts WHERE company_id = ? ORDER BY is_primary DESC, created_at ASC
    `);
    return stmt.all(companyId) as unknown as ContactRecord[];
  }

  getCompanyById(id: string): CompanyRecord | null {
    const stmt = this.db.prepare(`SELECT * FROM companies WHERE id = ?`);
    const row = stmt.get(id) as unknown as CompanyRecord | undefined;
    return row || null;
  }

  listCompanies(filters?: {
    crm_stage?: CRMStage;
    priority?: LeadPriority;
    category?: string;
    region?: string;
    city?: string;
    search?: string;
  }): CompanyRecord[] {
    let query = `SELECT * FROM companies WHERE 1=1`;
    const params: (string | number)[] = [];

    if (filters?.crm_stage) {
      query += ` AND crm_stage = ?`;
      params.push(filters.crm_stage);
    }
    if (filters?.priority) {
      query += ` AND priority = ?`;
      params.push(filters.priority);
    }
    if (filters?.category) {
      query += ` AND category = ?`;
      params.push(filters.category);
    }
    if (filters?.region) {
      query += ` AND region = ?`;
      params.push(filters.region);
    }
    if (filters?.city) {
      query += ` AND city = ?`;
      params.push(filters.city);
    }
    if (filters?.search) {
      query += ` AND (LOWER(name) LIKE LOWER(?) OR LOWER(category) LIKE LOWER(?) OR LOWER(city) LIKE LOWER(?))`;
      const s = `%${filters.search.trim()}%`;
      params.push(s, s, s);
    }

    query += ` ORDER BY created_at DESC`;

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as unknown as CompanyRecord[];
  }

  /**
   * Importa candidatos a partir do CompanyDataProvider ativo
   * e cadastra com deduplicação automática.
   */
  async discoverAndImportFromProvider(params: {
    region: string;
    city: string;
    state?: string | null;
    segment: string;
    limit?: number;
  }): Promise<{ imported: number; updated: number; companies: CompanyRecord[] }> {
    const provider = ProviderRegistry.getCompanyDataProvider();
    const candidates = await provider.searchCompanies(params);

    let imported = 0;
    let updated = 0;
    const results: CompanyRecord[] = [];

    for (const candidate of candidates) {
      const regResult = this.registerCompany({
        name: candidate.name,
        cnpj: candidate.cnpj,
        category: candidate.category || params.segment,
        region: candidate.region || params.region,
        city: candidate.city || params.city,
        state: candidate.state || params.state,
        address: candidate.address,
        rating: candidate.rating,
        review_count: candidate.reviewCount,
        website: candidate.website,
        phone: candidate.phone,
        instagram: candidate.instagram,
        whatsapp: candidate.whatsapp,
        email: candidate.email,
        contacts: candidate.contactName
          ? [
              {
                name: candidate.contactName,
                role: candidate.contactRole || 'Responsável',
                email: candidate.email,
                phone: candidate.phone,
                whatsapp: candidate.whatsapp,
                is_primary: true,
                source: provider.providerName,
              },
            ]
          : [],
        collected_data_json: candidate.rawSourceData,
      });

      if (regResult.isNew) {
        imported++;
      } else {
        updated++;
      }
      results.push(regResult.company);
    }

    this.logService.info(
      'COMPANIES',
      'IMPORT_BATCH_COMPLETED',
      `Importação de ${candidates.length} empresas concluída (${imported} novas, ${updated} atualizadas).`,
      { imported, updated, segment: params.segment, city: params.city }
    );

    return { imported, updated, companies: results };
  }
}
