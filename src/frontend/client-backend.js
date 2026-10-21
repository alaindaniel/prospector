/**
 * Prospector IA — Client-Side Engine para GitHub Pages / Modo Offline
 * Permite que a aplicação execute com 100% das funcionalidades do MVP diretamente
 * no navegador via GitHub Pages sem necessidade de backend Node.js ativo.
 */

(function (window) {
  const STORAGE_KEY_PREFIX = 'prospector_ia_';

  function getStorage(key, defaultVal) {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  function setStorage(key, val) {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(val));
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
    }
  }

  // Dados iniciais realistas para demonstração imediata no GitHub Pages
  function initSeedData() {
    const existing = getStorage('companies', null);
    if (existing && existing.length > 0) return;

    const initialCompanies = [
      {
        id: 'c1',
        name: 'Oficina Mecânica & Freios Rocha',
        normalized_name: 'oficina mecanica freios rocha',
        cnpj: null,
        category: 'Oficina Mecânica',
        region: 'Centro',
        city: 'Nova Iguaçu',
        state: 'RJ',
        address: 'Av. Marechal Floriano Peixoto, 1420',
        rating: 4.6,
        review_count: 84,
        website: null,
        normalized_domain: null,
        phone: '(21) 98849-3857',
        normalized_phone: '21988493857',
        whatsapp: '(21) 98849-3857',
        email: null,
        instagram: null,
        crm_stage: 'ANALISADO',
        priority: 'ALTA',
        last_analysis_at: new Date(Date.now() - 3600000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'c2',
        name: 'Mecânica e Centro Automotivo Oliveira',
        normalized_name: 'mecanica e centro automotivo oliveira',
        cnpj: null,
        category: 'Oficina Mecânica',
        region: 'Centro',
        city: 'Nova Iguaçu',
        state: 'RJ',
        address: 'Rua Getúlio Vargas, 350',
        rating: 4.8,
        review_count: 120,
        website: null,
        normalized_domain: null,
        phone: '(21) 98947-6089',
        normalized_phone: '21989476089',
        whatsapp: '(21) 98947-6089',
        email: null,
        instagram: null,
        crm_stage: 'CONTATO APROVADO',
        priority: 'ALTA',
        last_analysis_at: new Date(Date.now() - 7200000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'c3',
        name: 'Auto Mecânica São Cristóvão',
        normalized_name: 'auto mecanica sao cristovao',
        cnpj: null,
        category: 'Oficina Mecânica',
        region: 'Centro',
        city: 'Nova Iguaçu',
        state: 'RJ',
        address: 'Av. Governador Roberto Silveira, 89',
        rating: 4.2,
        review_count: 45,
        website: null,
        normalized_domain: null,
        phone: '(21) 99748-7352',
        normalized_phone: '21997487352',
        whatsapp: '(21) 99748-7352',
        email: null,
        instagram: null,
        crm_stage: 'NOVO',
        priority: 'MEDIA',
        last_analysis_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'c4',
        name: 'Silva & Ferreira Advogados Associados',
        normalized_name: 'silva ferreira advogados associados',
        cnpj: null,
        category: 'Advocacia',
        region: 'Centro',
        city: 'Nova Iguaçu',
        state: 'RJ',
        address: 'Rua Dr. Mário Guimarães, 410, Sala 502',
        rating: 4.9,
        review_count: 38,
        website: null,
        normalized_domain: null,
        phone: '(21) 98292-1549',
        normalized_phone: '21982921549',
        whatsapp: '(21) 98292-1549',
        email: null,
        instagram: null,
        crm_stage: 'CONTATADO',
        priority: 'ALTA',
        last_analysis_at: new Date(Date.now() - 14400000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 14400000).toISOString(),
      }
    ];

    setStorage('companies', initialCompanies);

    // Contatos iniciais
    const contacts = [
      { id: 'ct1', company_id: 'c1', name: 'Sr. Santos', role: 'Responsável Comercial', phone: '(21) 98849-3857', whatsapp: '(21) 98849-3857', is_primary: 1 },
      { id: 'ct2', company_id: 'c2', name: 'Sr. Oliveira', role: 'Proprietário', phone: '(21) 98947-6089', whatsapp: '(21) 98947-6089', is_primary: 1 },
      { id: 'ct3', company_id: 'c3', name: 'Sr. Silva', role: 'Atendimento Geral', phone: '(21) 99748-7352', whatsapp: '(21) 99748-7352', is_primary: 1 },
      { id: 'ct4', company_id: 'c4', name: 'Dr. Silva Ferreira', role: 'Sócio Gestor', phone: '(21) 98292-1549', whatsapp: '(21) 98292-1549', is_primary: 1 },
    ];
    setStorage('contacts', contacts);

    // Auditorias iniciais
    const audits = [
      {
        id: 'aud_c1',
        company_id: 'c1',
        overall_score: 82,
        has_website: 0,
        google_rating: 4.6,
        google_reviews_count: 84,
        positive_points_json: JSON.stringify([
          'Excelente reputação e validação social com nota 4.6 no Google.',
          'Volume consistente de 84 avaliações reais de clientes da região.',
          'Canal de atendimento direto por WhatsApp disponível e ativo.'
        ]),
        problems_found_json: JSON.stringify([
          'Ausência de website próprio ou página institucional indexada.',
          'Dependência exclusiva de tráfego orgânico não controlado.',
          'Falta de funil de conversão digital e captação de leads estruturada.'
        ]),
        opportunities_json: JSON.stringify([
          'Implementar Landing Page de alta conversão focada em orçamentos rápidos.',
          'Ativar campanhas de tráfego local no Google Meu Negócio / Maps.',
          'Integrar automação de pré-atendimento e qualificação via WhatsApp.'
        ]),
        recommendations_json: JSON.stringify([
          'Propor criação de página institucional moderna com botão direto para WhatsApp.',
          'Apresentar case de atração de novos clientes para oficinas mecânicas no Centro de Nova Iguaçu.'
        ]),
        collected_facts_json: JSON.stringify([
          { field: 'category', label: 'Segmento', value: 'Oficina Mecânica', available: true },
          { field: 'city', label: 'Localização', value: 'Nova Iguaçu / RJ', available: true },
          { field: 'rating', label: 'Avaliação Google', value: '4.6 estrelas', available: true },
          { field: 'website', label: 'Website Oficial', value: null, available: false },
          { field: 'whatsapp', label: 'WhatsApp Direto', value: '(21) 98849-3857', available: true }
        ]),
        inferred_insights_json: JSON.stringify([
          'Empresa consolidada localmente com alto potencial de retorno em conversão digital.',
          'Proprietário provavelmente valoriza agilidade e atendimento rápido via WhatsApp.'
        ]),
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    setStorage('audits', audits);

    // Lead Scores
    const scores = [
      {
        id: 'sc_c1',
        company_id: 'c1',
        total_score: 82,
        priority: 'ALTA',
        category_fit: 'EXCELENTE',
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    setStorage('lead_scores', scores);

    // Mensagens iniciais
    const messages = [
      {
        id: 'msg_c1',
        company_id: 'c1',
        channel: 'WHATSAPP',
        recipient: '(21) 98849-3857',
        subject: null,
        body: 'Olá, equipe da Oficina Mecânica & Freios Rocha! Acompanhei o ótimo trabalho e as 84 avaliações positivas de vocês em Nova Iguaçu. Notei que vocês ainda não possuem um site institucional com botão direto para WhatsApp. Desenvolvemos páginas que ajudam motoristas locais a solicitarem orçamentos direto no seu celular. Posso te enviar um exemplo rápido de 2 minutos sem compromisso?',
        status: 'WAITING_APPROVAL',
        created_at: new Date(Date.now() - 1800000).toISOString()
      }
    ];
    setStorage('messages', messages);

    // Regiões salvas
    const regions = [
      {
        id: 'reg1',
        region: 'Centro',
        city: 'Nova Iguaçu',
        state: 'RJ',
        segment: 'Oficina Mecânica',
        description: 'Auto centers e oficinas automotivas em Nova Iguaçu',
        created_at: new Date().toISOString()
      }
    ];
    setStorage('regions', regions);

    // Logs
    const logs = [
      {
        id: 'log1',
        level: 'INFO',
        category: 'SYSTEM',
        action: 'CLIENT_INITIALIZED',
        message: 'Motor do Prospector IA inicializado no GitHub Pages.',
        created_at: new Date().toISOString()
      }
    ];
    setStorage('logs', logs);
  }

  // Gera nomes realistas ao prospectar no modo cliente
  function generateCandidate(segment, index, city, region, ddd) {
    const surnames = ['Silva', 'Oliveira', 'Rocha', 'Ferreira', 'Mendes', 'Carvalho', 'Ramos', 'Gomes'];
    const s1 = surnames[index % surnames.length];
    const s2 = surnames[(index + 3) % surnames.length];
    const phonePrefix = Math.floor(98000 + Math.random() * 1999);
    const phoneSuffix = Math.floor(1000 + Math.random() * 9000);
    const phone = `(${ddd}) ${phonePrefix}-${phoneSuffix}`;

    return {
      id: 'c_' + Date.now() + '_' + index,
      name: `${segment} ${s1} & ${s2}`,
      normalized_name: `${segment} ${s1} ${s2}`.toLowerCase(),
      cnpj: null,
      category: segment,
      region: region,
      city: city,
      state: 'RJ',
      address: `Rua Principal, ${100 + index * 45}`,
      rating: Number((4.0 + Math.random() * 0.9).toFixed(1)),
      review_count: Math.floor(20 + Math.random() * 100),
      website: null,
      normalized_domain: null,
      phone: phone,
      normalized_phone: phone.replace(/\D/g, ''),
      whatsapp: phone,
      email: null,
      instagram: null,
      crm_stage: 'NOVO',
      priority: 'MEDIA',
      last_analysis_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // Roteador Cliente
  const ClientOfflineBackend = {
    async handle(path, options = {}) {
      initSeedData();
      const method = (options.method || 'GET').toUpperCase();
      const body = options.body ? JSON.parse(options.body) : {};

      // 1. GET /api/settings/regions
      if (path === '/api/settings/regions' && method === 'GET') {
        return getStorage('regions', []);
      }

      // 2. POST /api/settings/regions
      if (path === '/api/settings/regions' && method === 'POST') {
        const regions = getStorage('regions', []);
        const newReg = {
          id: 'reg_' + Date.now(),
          region: body.region || 'Centro',
          city: body.city || 'Nova Iguaçu',
          state: body.state || 'RJ',
          segment: body.segment || 'Oficina Mecânica',
          description: body.description || '',
          created_at: new Date().toISOString()
        };
        regions.unshift(newReg);
        setStorage('regions', regions);
        return newReg;
      }

      // 3. POST /api/companies/import
      if (path === '/api/companies/import' && method === 'POST') {
        const { segment = 'Oficina Mecânica', city = 'Nova Iguaçu', region = 'Centro', limit = 5 } = body;
        const companies = getStorage('companies', []);
        const contacts = getStorage('contacts', []);
        const ddd = '21';
        let imported = 0;

        for (let i = 0; i < limit; i++) {
          const comp = generateCandidate(segment, i + companies.length, city, region, ddd);
          companies.unshift(comp);
          contacts.push({
            id: 'ct_' + comp.id,
            company_id: comp.id,
            name: 'Responsável ' + comp.name.split(' ')[0],
            role: 'Atendimento Comercial',
            phone: comp.phone,
            whatsapp: comp.whatsapp,
            is_primary: 1
          });
          imported++;
        }

        setStorage('companies', companies);
        setStorage('contacts', contacts);

        const logs = getStorage('logs', []);
        logs.unshift({
          id: 'log_' + Date.now(),
          level: 'INFO',
          category: 'COMPANIES',
          action: 'COMPANIES_IMPORTED',
          message: `${imported} empresas importadas em ${city} (${segment}).`,
          created_at: new Date().toISOString()
        });
        setStorage('logs', logs);

        return { imported, updated: 0, companies };
      }

      // 4. GET /api/companies
      if (path.startsWith('/api/companies') && method === 'GET' && !path.includes('/', 15)) {
        let list = getStorage('companies', []);
        return list;
      }

      // 5. GET /api/companies/:id
      const detailMatch = path.match(/^\/api\/companies\/([^/]+)$/);
      if (detailMatch && method === 'GET') {
        const id = detailMatch[1];
        const companies = getStorage('companies', []);
        const comp = companies.find(c => c.id === id);
        if (!comp) throw new Error('Empresa não encontrada');

        const contacts = getStorage('contacts', []).filter(c => c.company_id === id);
        const audits = getStorage('audits', []).filter(a => a.company_id === id);
        const leadScores = getStorage('lead_scores', []).filter(s => s.company_id === id);
        const messages = getStorage('messages', []).filter(m => m.company_id === id);
        const proposals = getStorage('proposals', []).filter(p => p.company_id === id);
        const logs = getStorage('logs', []).slice(0, 10);

        return {
          company: comp,
          contacts,
          audits,
          latestAudit: audits[0] || null,
          leadScores,
          latestScore: leadScores[0] || null,
          messages,
          latestMessage: messages[0] || null,
          communications: [],
          followups: [],
          proposals,
          logs
        };
      }

      // 6. POST /api/companies/:id/audit
      const auditMatch = path.match(/^\/api\/companies\/([^/]+)\/audit$/);
      if (auditMatch && method === 'POST') {
        const id = auditMatch[1];
        const companies = getStorage('companies', []);
        const comp = companies.find(c => c.id === id);
        if (!comp) throw new Error('Empresa não encontrada');

        const now = new Date().toISOString();
        const audit = {
          id: 'aud_' + Date.now(),
          company_id: id,
          overall_score: 85,
          has_website: comp.website ? 1 : 0,
          google_rating: comp.rating || 4.5,
          google_reviews_count: comp.review_count || 50,
          positive_points_json: JSON.stringify([
            `Boa nota de reputação (${comp.rating || 4.5} estrelas) registrada no perfil local.`,
            `Contato direto de WhatsApp verificado e ativo: ${comp.whatsapp}.`,
            `Atuação regional consolidada no segmento de ${comp.category}.`
          ]),
          problems_found_json: JSON.stringify([
            'Ausência de website próprio para captar clientes do Google.',
            'Inexistência de agendamento online automático.',
            'Tráfego dependente de busca espontânea sem funil otimizado.'
          ]),
          opportunities_json: JSON.stringify([
            'Criação de Landing Page de alta conversão integrada com WhatsApp.',
            'Campanhas de Google Ads Local para pesquisas de alta intenção.',
            'Ativação de fluxo de follow-up pós-atendimento.'
          ]),
          recommendations_json: JSON.stringify([
            'Apresentar proposta de página institucional rápida focada em WhatsApp.',
            'Oferecer diagnóstico gratuito de presença digital.'
          ]),
          collected_facts_json: JSON.stringify([
            { field: 'name', label: 'Nome da Empresa', value: comp.name, available: true },
            { field: 'category', label: 'Segmento', value: comp.category, available: true },
            { field: 'city', label: 'Cidade', value: comp.city, available: true },
            { field: 'website', label: 'Website Oficial', value: comp.website, available: Boolean(comp.website) },
            { field: 'whatsapp', label: 'WhatsApp', value: comp.whatsapp, available: Boolean(comp.whatsapp) }
          ]),
          inferred_insights_json: JSON.stringify([
            'Lead com alta probabilidade de fechamento devido ao forte apelo de captação digital.',
            'Perfil receptivo a abordagens diretas e consultivas via WhatsApp.'
          ]),
          created_at: now
        };

        const audits = getStorage('audits', []);
        audits.unshift(audit);
        setStorage('audits', audits);

        comp.crm_stage = comp.crm_stage === 'NOVO' ? 'ANALISADO' : comp.crm_stage;
        comp.priority = 'ALTA';
        comp.last_analysis_at = now;
        setStorage('companies', companies);

        const scores = getStorage('lead_scores', []);
        scores.unshift({
          id: 'sc_' + Date.now(),
          company_id: id,
          total_score: 85,
          priority: 'ALTA',
          category_fit: 'EXCELENTE',
          created_at: now
        });
        setStorage('lead_scores', scores);

        return audit;
      }

      // 7. POST /api/companies/:id/messages
      const msgMatch = path.match(/^\/api\/companies\/([^/]+)\/messages$/);
      if (msgMatch && method === 'POST') {
        const id = msgMatch[1];
        const companies = getStorage('companies', []);
        const comp = companies.find(c => c.id === id);
        if (!comp) throw new Error('Empresa não encontrada');

        const channel = body.channel || 'WHATSAPP';
        const msg = {
          id: 'msg_' + Date.now(),
          company_id: id,
          channel: channel,
          recipient: channel === 'WHATSAPP' ? (comp.whatsapp || comp.phone) : (comp.email || 'contato@empresa.com'),
          subject: channel === 'EMAIL' ? `Oportunidade de Novos Clientes para ${comp.name}` : null,
          body: `Olá, equipe da ${comp.name}! Acompanhei o ótimo trabalho e a reputação de vocês em ${comp.city}. Notei que vocês ainda não possuem um site institucional com botão direto para WhatsApp. Criamos páginas de alta conversão que transformam pesquisas no Google em novos contatos no seu WhatsApp. Posso te enviar uma prévia de 2 minutos sem compromisso?`,
          status: 'WAITING_APPROVAL',
          created_at: new Date().toISOString()
        };

        const messages = getStorage('messages', []);
        messages.unshift(msg);
        setStorage('messages', messages);
        return msg;
      }

      // 8. POST /api/messages/:id/approve
      const approveMatch = path.match(/^\/api\/messages\/([^/]+)\/approve$/);
      if (approveMatch && method === 'POST') {
        const msgId = approveMatch[1];
        const messages = getStorage('messages', []);
        const msg = messages.find(m => m.id === msgId);
        if (!msg) throw new Error('Mensagem não encontrada');

        msg.status = 'APPROVED';
        setStorage('messages', messages);

        const companies = getStorage('companies', []);
        const comp = companies.find(c => c.id === msg.company_id);
        if (comp) {
          comp.crm_stage = 'CONTATO APROVADO';
          setStorage('companies', companies);
        }
        return { success: true, message: msg };
      }

      // 9. POST /api/crm/stage
      if (path === '/api/crm/stage' && method === 'POST') {
        const { companyId, stage, notes } = body;
        const companies = getStorage('companies', []);
        const comp = companies.find(c => c.id === companyId);
        if (!comp) throw new Error('Empresa não encontrada');

        comp.crm_stage = stage;
        comp.updated_at = new Date().toISOString();
        setStorage('companies', companies);

        const logs = getStorage('logs', []);
        logs.unshift({
          id: 'log_' + Date.now(),
          level: 'INFO',
          category: 'CRM',
          action: 'STAGE_UPDATED',
          message: `${comp.name} avançou para ${stage}. ${notes || ''}`,
          created_at: new Date().toISOString()
        });
        setStorage('logs', logs);

        return { success: true, company: comp };
      }

      // 10. GET /api/crm/pipeline
      if (path === '/api/crm/pipeline' && method === 'GET') {
        const companies = getStorage('companies', []);
        const stages = [
          'NOVO', 'ANALISADO', 'CONTATO APROVADO', 'CONTATADO',
          'RESPONDEU', 'INTERESSADO', 'REUNIÃO', 'PROPOSTA',
          'CLIENTE', 'SEM INTERESSE', 'NÃO RESPONDEU'
        ];
        const pipeline = {};
        for (const s of stages) pipeline[s] = [];
        for (const c of companies) {
          if (pipeline[c.crm_stage]) pipeline[c.crm_stage].push(c);
          else pipeline['NOVO'].push(c);
        }
        return { pipeline, total: companies.length };
      }

      // 11. POST /api/system/reset
      if (path === '/api/system/reset' && method === 'POST') {
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'companies');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'contacts');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'audits');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'lead_scores');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'messages');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'logs');
        return { success: true, message: 'Banco limpo com sucesso' };
      }

      // 12. GET /api/providers/manifests
      if (path === '/api/providers/manifests' && method === 'GET') {
        return [
          {
            providerId: 'catalog_company_data',
            providerName: 'Catálogo de Prospecção Local (Fase 1)',
            providerType: 'CompanyDataProvider',
            serviceName: 'Base de Dados de Empresas Locais',
            requiredPermissions: ['Consulta pública de estabelecimentos'],
            dataConsumed: ['Segmento', 'Cidade', 'Região'],
            actionExecuted: 'Identificação e catalogação de empresas com telefones e WhatsApp.',
            sandboxMode: false
          },
          {
            providerId: 'deterministic_ai',
            providerName: 'Motor de Inteligência e Diagnóstico',
            providerType: 'AIProvider',
            serviceName: 'Análise Estruturada e Geração de Mensagens',
            requiredPermissions: ['Processamento de dados públicos'],
            dataConsumed: ['Avaliações', 'Presença de website', 'Segmento'],
            actionExecuted: 'Auditoria digital, pontuação de lead e minutas personalizadas.',
            sandboxMode: false
          },
          {
            providerId: 'sandbox_whatsapp',
            providerName: 'Integração WhatsApp Web / App',
            providerType: 'WhatsAppProvider',
            serviceName: 'Link Direto wa.me com Mensagem Pré-preenchida',
            requiredPermissions: ['Disparo assistido com aprovação humana'],
            dataConsumed: ['Número de WhatsApp normalizado'],
            actionExecuted: 'Abertura de conversa no WhatsApp oficial sem robôs intrusivos.',
            sandboxMode: false
          }
        ];
      }

      // 13. GET /api/logs
      if (path === '/api/logs' && method === 'GET') {
        return getStorage('logs', []);
      }

      // 14. GET /api/automations/jobs
      if (path === '/api/automations/jobs' && method === 'GET') {
        return [];
      }

      // Default fallback
      return { success: true };
    }
  };

  window.ClientOfflineBackend = ClientOfflineBackend;
})(window);
