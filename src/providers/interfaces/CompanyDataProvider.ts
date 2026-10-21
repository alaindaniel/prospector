import { IntegrationConnectionManifest } from '../../types/models';

export interface DiscoveredCompanyCandidate {
  name: string;
  cnpj?: string | null;
  category: string;
  region: string;
  city: string;
  state?: string | null;
  address?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  website?: string | null;
  phone?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  contactName?: string | null;
  contactRole?: string | null;
  rawSourceData?: Record<string, unknown>;
}

export interface SearchCompaniesQuery {
  region: string;
  city: string;
  state?: string | null;
  segment: string;
  limit?: number;
}

export interface CompanyDataProvider {
  readonly providerId: string;
  readonly providerName: string;
  getConnectionManifest(): IntegrationConnectionManifest;
  searchCompanies(query: SearchCompaniesQuery): Promise<DiscoveredCompanyCandidate[]>;
}
