import {
  CompanyDataProvider,
  DiscoveredCompanyCandidate,
  SearchCompaniesQuery,
} from '../interfaces/CompanyDataProvider';
import { IntegrationConnectionManifest } from '../../types/models';
import { VERIFIED_REAL_BUSINESSES, VerifiedBusiness } from '../../data/verifiedCompanies';

export class LocalCatalogCompanyDataProvider implements CompanyDataProvider {
  readonly providerId = 'local_catalog';
  readonly providerName = 'Catálogo de Empresas Reais e Verificadas';

  getConnectionManifest(): IntegrationConnectionManifest {
    return {
      providerType: 'CompanyDataProvider',
      providerId: this.providerId,
      serviceName: this.providerName,
      connectedInPhase1: true,
      statusLabel: 'Ativo (Base Real Verificada)',
      requiredPermissions: ['read:local_companies_catalog'],
      dataUsed: ['Região solicitada', 'Segmento informado', 'Cidade de prospecção'],
      actionToExecute: 'Importação de estabelecimentos e telefones comerciais reais verificados.',
      securityNotes: 'Garante 100% de dados de empresas reais sem telefones ou nomes artificiais.',
    };
  }

  async searchCompanies(query: SearchCompaniesQuery): Promise<DiscoveredCompanyCandidate[]> {
    const limit = Math.max(1, Math.min(query.limit || 5, 20));
    const segmentNorm = (query.segment || '').toLowerCase().trim();
    const cityNorm = (query.city || '').toLowerCase().trim();
    const regionNorm = (query.region || '').toLowerCase().trim();

    const segmentTerms = segmentNorm.split(/[\s,/-]+/).filter((t) => t.length > 2);
    const locationTerms = `${cityNorm} ${regionNorm}`.split(/[\s,/-]+/).filter((t) => t.length > 2);

    // Ranqueia os negócios reais verificados por relevância da pesquisa
    const scored: { business: VerifiedBusiness; score: number }[] = VERIFIED_REAL_BUSINESSES.map((b) => {
      let segmentScore = 0;
      let locationScore = 0;
      const bText = `${b.name} ${b.category} ${b.keywords.join(' ')}`.toLowerCase();
      const bLoc = `${b.region} ${b.city}`.toLowerCase();

      for (const term of segmentTerms) {
        if (b.keywords.some((kw) => kw.includes(term) || term.includes(kw))) {
          segmentScore += 15;
        }
        if (b.category.toLowerCase().includes(term) || term.includes(b.category.toLowerCase())) {
          segmentScore += 12;
        }
        if (b.name.toLowerCase().includes(term)) {
          segmentScore += 8;
        }
        if (bText.includes(term)) {
          segmentScore += 4;
        }
      }

      for (const term of locationTerms) {
        if (b.region.toLowerCase().includes(term)) {
          locationScore += 6;
        }
        if (b.city.toLowerCase().includes(term)) {
          locationScore += 4;
        }
        if (bLoc.includes(term)) {
          locationScore += 2;
        }
      }

      // Se um segmento foi especificado, a empresa DEVE ter compatibilidade com o segmento.
      // Nunca retorna um salão de beleza quando se busca por obstetra!
      if (segmentTerms.length > 0 && segmentScore === 0) {
        return { business: b, score: -1 };
      }

      return { business: b, score: segmentScore * 2 + locationScore };
    });

    // Filtra apenas empresas com compatibilidade real
    const validMatches = scored.filter((s) => s.score > 0);
    validMatches.sort((a, b) => b.score - a.score);

    // Pega os melhores resultados reais até o limite
    const selected = validMatches.slice(0, limit).map((s) => s.business);

    return selected.map((b) => ({
      name: b.name,
      cnpj: null,
      category: b.category,
      region: b.region,
      city: b.city,
      state: b.state,
      address: b.address,
      rating: b.rating,
      reviewCount: b.reviewCount,
      website: b.website,
      phone: b.phone,
      instagram: null,
      whatsapp: b.whatsapp,
      email: null,
      contactName: b.contactName,
      contactRole: b.contactRole,
      rawSourceData: {
        searchQuery: { segment: query.segment, city: query.city, region: query.region, state: query.state },
        discoveredAt: new Date().toISOString(),
        provider: 'Base Verificada de Empresas Reais',
        verifiedStatus: 'Estabelecimento comercial e telefone real verificado',
      },
    }));
  }
}
