import {
  AIProvider,
  CompanyAnalysisInput,
  CompanyAnalysisOutput,
  AuditGenerationOutput,
  LeadScoreGenerationInput,
  LeadScoreGenerationOutput,
  MessageGenerationInput,
  MessageGenerationOutput,
  FollowupGenerationInput,
  FollowupGenerationOutput,
} from '../interfaces/AIProvider';
import { IntegrationConnectionManifest, LeadPriority } from '../../types/models';

export class DeterministicDiagnosticAIProvider implements AIProvider {
  readonly providerId = 'deterministic';
  readonly providerName = 'Motor de IA Analítico e Determinístico';

  getConnectionManifest(): IntegrationConnectionManifest {
    return {
      providerType: 'AIProvider',
      providerId: this.providerId,
      serviceName: this.providerName,
      connectedInPhase1: true,
      statusLabel: 'Ativo (Local / Sem custos de API externa)',
      requiredPermissions: ['execute:analytical_diagnosis'],
      dataUsed: ['Cadastro estruturado da empresa', 'Auditoria digital', 'Sinais de presença pública'],
      actionToExecute: 'Geração de diagnósticos, cálculos de score de lead, recomendações e minutas de mensagens personalizadas.',
      securityNotes: 'Nenhum dado trafega para servidores de terceiros neste modo determinístico.',
    };
  }

  private extractCollectedFacts(company: CompanyAnalysisInput) {
    return [
      {
        field: 'name',
        label: 'Nome Comercial',
        value: company.name,
        available: Boolean(company.name),
      },
      {
        field: 'cnpj',
        label: 'CNPJ',
        value: company.cnpj ?? null,
        available: Boolean(company.cnpj),
      },
      {
        field: 'category',
        label: 'Segmento de Atuação',
        value: company.category,
        available: Boolean(company.category),
      },
      {
        field: 'city',
        label: 'Cidade e Região',
        value: `${company.city}${company.state ? ' / ' + company.state : ''} (${company.region})`,
        available: Boolean(company.city),
      },
      {
        field: 'website',
        label: 'Website Próprio',
        value: company.website ?? null,
        available: Boolean(company.website),
      },
      {
        field: 'rating',
        label: 'Avaliação Média',
        value: company.rating !== null ? `${company.rating.toFixed(1)} estrelas` : null,
        available: company.rating !== null,
      },
      {
        field: 'review_count',
        label: 'Volume de Avaliações',
        value: company.review_count !== null ? `${company.review_count} avaliações` : null,
        available: company.review_count !== null,
      },
      {
        field: 'phone',
        label: 'Telefone Principal',
        value: company.phone ?? null,
        available: Boolean(company.phone),
      },
      {
        field: 'whatsapp',
        label: 'WhatsApp Direto',
        value: company.whatsapp ?? null,
        available: Boolean(company.whatsapp),
      },
      {
        field: 'email',
        label: 'E-mail Comercial',
        value: company.email ?? null,
        available: Boolean(company.email),
      },
      {
        field: 'instagram',
        label: 'Perfil no Instagram',
        value: company.instagram ?? null,
        available: Boolean(company.instagram),
      },
    ];
  }

  async analyzeCompany(input: CompanyAnalysisInput): Promise<CompanyAnalysisOutput> {
    const collectedFacts = this.extractCollectedFacts(input);
    const aiInferences: string[] = [];
    const recommendations: string[] = [];

    const hasWebsite = Boolean(input.website);
    const hasHighRating = (input.rating ?? 0) >= 4.3;
    const hasLotsOfReviews = (input.review_count ?? 0) >= 50;
    const hasWhatsApp = Boolean(input.whatsapp);

    if (hasWebsite && hasHighRating && hasLotsOfReviews) {
      aiInferences.push('A empresa demonstra presença digital sólida e boa aceitação pública no mercado local.');
      recommendations.push('Apresentar soluções avançadas de automação de conversão e expansão de canais.');
    } else if (!hasWebsite) {
      aiInferences.push('A empresa depende exclusivamente de diretórios locais ou redes sociais, perdendo autoridade e conversão direta.');
      recommendations.push('Propor desenvolvimento de página de captura/conversão direta com botão para WhatsApp.');
    } else {
      aiInferences.push('A empresa possui os canais básicos, mas há margem para melhorar captação orgânica e experiência de contato.');
      recommendations.push('Auditar velocidade e pontos de conversão no site atual.');
    }

    if (input.rating !== null && input.rating < 4.0) {
      aiInferences.push('A média de avaliações aponta insatisfações recentes que afetam a conversão de novos clientes locais.');
      recommendations.push('Implantar rotina de coleta e gestão ativa de reputação no Google.');
    }

    if (!hasWhatsApp) {
      aiInferences.push('Falta de canal rápido de atendimento mobile diminui a taxa de resposta imediata dos potenciais compradores.');
      recommendations.push('Integrar canal oficial de WhatsApp no funil de atendimento da empresa.');
    }

    const digitalMaturityLevel = hasWebsite && hasHighRating && hasLotsOfReviews ? 'AVANCADO' : hasWebsite ? 'INTERMEDIARIO' : 'INICIAL';

    const summary = `Diagnóstico inicial de ${input.name}: presença classificada como nível ${digitalMaturityLevel}. ` +
      (hasWebsite ? `Possui site oficial registrado.` : `Não possui site oficial mapeado (dado indisponível).`) +
      (input.rating !== null ? ` Reputação registrada com média ${input.rating} (${input.review_count ?? 0} avaliações).` : ` Reputação em diretórios não mapeada.`);

    return {
      summary,
      digitalMaturityLevel,
      collectedFacts,
      aiInferences,
      recommendations,
      inputSnapshot: input,
    };
  }

  async generateAudit(input: CompanyAnalysisInput): Promise<AuditGenerationOutput> {
    const collectedFacts = this.extractCollectedFacts(input);
    const positivePoints: string[] = [];
    const problemsFound: string[] = [];
    const opportunities: string[] = [];
    const recommendations: string[] = [];
    const aiInferences: string[] = [];

    // Fatos objetivos e inferências
    if (input.rating !== null && input.rating >= 4.0) {
      positivePoints.push(`Boa percepção de marca comprovada: nota média de ${input.rating.toFixed(1)} no mercado.`);
    }
    if (input.review_count !== null && input.review_count >= 30) {
      positivePoints.push(`Volume relevante de engajamento prévio: ${input.review_count} avaliações de clientes.`);
    }
    if (input.website) {
      positivePoints.push(`Possui domínio/site próprio cadastrado (${input.website}).`);
    }
    if (input.phone || input.whatsapp) {
      positivePoints.push('Canais telefônicos ativos cadastrados para contato comercial.');
    }

    // Problemas e gargalos detectados
    if (!input.website) {
      problemsFound.push('Inexistência de website próprio: perda de leads corporativos que pesquisam ativamente no Google.');
      aiInferences.push('A falta de página própria reduz a margem cobrada pelo serviço, pois a empresa compete em diretórios abertos.');
      opportunities.push('Criação rápida de Landing Page institucional de alta conversão.');
      recommendations.push('Estruturar página única com oferta clara, depoimentos reais e chamada para WhatsApp.');
    } else {
      opportunities.push('Otimização de SEO local e integração de automação de captação de leads no site.');
      recommendations.push('Auditar métricas de carregamento e colocar formulário com resposta em tempo real.');
    }

    if (input.review_count === null || input.review_count < 25) {
      problemsFound.push(`Baixa prova social quantificada: ${input.review_count ?? 0} avaliações registradas.`);
      aiInferences.push('Consumidores tendem a escolher concorrentes locais com maior volume de avaliações positivas.');
      opportunities.push('Programa de pós-atendimento para incentivo de reviews positivos.');
      recommendations.push('Criar fluxo automatizado solicitando feedback no momento da entrega do serviço.');
    }

    if (!input.whatsapp) {
      problemsFound.push('Número de WhatsApp não encontrado ou indisponível nos dados públicos.');
      recommendations.push('Configurar canal de WhatsApp Business oficial com mensagem de saudação automática.');
    }

    if (!input.email) {
      problemsFound.push('E-mail corporativo não identificado publicamente.');
    }

    if (positivePoints.length === 0) {
      positivePoints.push('Operação comercial ativa cadastrada na região.');
    }

    return {
      positivePoints,
      problemsFound,
      opportunities,
      recommendations,
      collectedFacts,
      aiInferences,
      inputSnapshot: input,
    };
  }

  async generateLeadScore(input: LeadScoreGenerationInput): Promise<LeadScoreGenerationOutput> {
    const { company, audit } = input;
    const collectedFacts = this.extractCollectedFacts(company);
    const aiInferences: string[] = [];
    const recommendations: string[] = [];

    let score = 50; // Base neutra
    const rationales: string[] = [];

    // Critérios objetivos sem alucinação
    if (!company.website) {
      score += 20; // Grande oportunidade de venda de presença digital
      rationales.push('Sem site: alta aderência para serviços de presença digital e captação (+20 pts).');
      aiInferences.push('Lead com urgência de infraestrutura básica de captação.');
    } else {
      score += 5;
      rationales.push('Com site: potencial para tráfego pago, SEO e melhoria de conversão (+5 pts).');
    }

    if (company.phone || company.whatsapp) {
      score += 15;
      rationales.push('Canal direto de contato disponível para abordagem rápida (+15 pts).');
    } else {
      score -= 20;
      rationales.push('Sem canal direto de contato verificado (-20 pts).');
    }

    if (company.rating !== null && company.rating >= 4.0) {
      score += 10;
      rationales.push('Boa reputação consolidada facilita a conversão (+10 pts).');
    }

    if (company.review_count !== null && company.review_count > 20) {
      score += 5;
      rationales.push('Negócio com tração de clientes no segmento (+5 pts).');
    }

    // Normaliza entre 0 e 100
    score = Math.max(5, Math.min(98, score));

    let priority: LeadPriority = 'MEDIA';
    let classification: 'QUENTE' | 'MORNO' | 'FRIO' = 'MORNO';

    if (score >= 75) {
      priority = 'ALTA';
      classification = 'QUENTE';
      recommendations.push('Abordagem imediata em até 24h com proposta de diagnóstico pontual.');
    } else if (score >= 45) {
      priority = 'MEDIA';
      classification = 'MORNO';
      recommendations.push('Abordagem consultiva explorando oportunidades do setor na região.');
    } else {
      priority = 'BAIXA';
      classification = 'FRIO';
      recommendations.push('Pesquisar mais pontos de contato antes de contato direto.');
    }

    const rationale = rationales.join(' ');

    return {
      score,
      priority,
      classification,
      rationale,
      collectedFacts,
      aiInferences,
      recommendations,
      inputSnapshot: input,
    };
  }

  async generateMessage(input: MessageGenerationInput): Promise<MessageGenerationOutput> {
    const { company, channel, recipient, audit, leadScore } = input;
    const isPhoneOrEmail = recipient && (recipient.includes('@') || /\d{4,}/.test(recipient));
    const contactRef = recipient && !isPhoneOrEmail ? `Olá ${recipient}` : `Olá equipe da ${company.name}`;

    const collectedFactsUsed: string[] = [
      `Nome: ${company.name}`,
      `Segmento: ${company.category}`,
      `Cidade: ${company.city} (${company.region})`,
      `Website: ${company.website ? company.website : 'Indisponível (Sem site)'}`,
      `Avaliações: ${company.rating !== null ? company.rating + ' estrelas (' + (company.review_count ?? 0) + ' avaliações)' : 'Indisponível'}`,
    ];

    const aiInferencesUsed: string[] = [];
    const recommendationsUsed: string[] = [];

    let subject: string | null = null;
    let body = '';

    const hasNoWebsite = !company.website;
    if (hasNoWebsite) {
      aiInferencesUsed.push('Ausência de site oficial reduz captação orgânica na busca local.');
      recommendationsUsed.push('Propor demonstração de página de captação de clientes.');
    }

    if (channel === 'EMAIL') {
      subject = `Diagnóstico de captação digital para ${company.name} em ${company.city}`;
      body = `${contactRef}, tudo bem?

Estava analisando o mercado de ${company.category} em ${company.city} (${company.region}) e identifiquei uma excelente oportunidade para a ${company.name}.

${
  hasNoWebsite
    ? `Notei que vocês contam com excelente atendimento, porém ainda não possuem um site próprio otimizado para transformar pesquisas locais no Google em orçamentos diretos no WhatsApp.`
    : `Analisei a presença digital de vocês em ${company.city} e identifiquei pontos de melhoria para acelerar a conversão dos visitantes do site em contatos qualificados.`
}

Preparamos uma auditoria prática de 3 minutos com os pontos fortes e os gargalos encontrados. 

Você teria 10 minutos nesta semana para eu compartilhar esse diagnóstico sem custo?

Atenciosamente,
Equipe de Expansão Comercial`;
    } else if (channel === 'WHATSAPP') {
      subject = null;
      body = `${contactRef}, tudo bem?

Aqui é da equipe de análise de mercado. Estivemos avaliando o segmento de ${company.category} em ${company.city} e vimos o trabalho da ${company.name}.

${
  hasNoWebsite
    ? `Percebemos que vocês têm boa demanda local, mas ainda não têm um canal web direto gerando orçamentos automáticos.`
    : `Mapeamos oportunidades de otimizar a conversão de clientes que já buscam por ${company.category} na região.`
}

Montamos um diagnóstico rápido com 3 recomendações práticas. Posso enviar o resumo por aqui?`;
    } else {
      subject = null;
      body = `${contactRef}, parabéns pelo trabalho em ${company.city}! Preparamos um diagnóstico gratuito com 3 oportunidades para aumentar as conversões da ${company.name}. Se fizer sentido, responda aqui e compartilhamos o link!`;
    }

    return {
      channel,
      recipient,
      subject,
      body,
      collectedFactsUsed,
      aiInferencesUsed,
      recommendationsUsed,
      inputSnapshot: input,
    };
  }

  async generateFollowup(input: FollowupGenerationInput): Promise<FollowupGenerationOutput> {
    const { company, channel, stepNumber, previousMessageBody } = input;
    const recipientName = company.name;

    let subject: string | null = null;
    let body = '';

    if (channel === 'EMAIL') {
      subject = `Re: Oportunidade de expansão para ${recipientName} (${stepNumber}º contato)`;
      body = `Olá equipe da ${recipientName}, espero que estejam tendo uma excelente semana!

Passando apenas para retomar meu contato anterior sobre a análise que preparamos para o segmento de ${company.category} em ${company.city}.

Sabemos da correria do dia a dia. Se fizer sentido entender como estruturar o canal de conversão digital sem complexidade, fico à disposição para um alinhamento rápido de 10 minutos.

Um abraço!`;
    } else {
      subject = null;
      body = `Olá! Tudo bem por aí? Passando apenas para saber se conseguiram dar uma olhada na oportunidade que comentei para a ${recipientName} em ${company.city}. Se preferirem, posso resumir os 3 pontos principais em uma mensagem rápida!`;
    }

    return {
      channel,
      stepNumber,
      subject,
      body,
      inputSnapshot: input,
    };
  }
}
