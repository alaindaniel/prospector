/**
 * Prospector IA — Frontend Controller (Vanilla SPA)
 * Gerencia o ciclo completo: cadastro de região/segmento, prospecção de empresas,
 * auditoria, diagnóstico IA, classificação, mensagem personalizada, aprovação humana e CRM.
 */

// Estado da Aplicação
const state = {
  currentView: 'companies',
  companies: [],
  selectedCompanyId: null,
  companyDetail: null,
  regions: [],
  isEditingMessage: false,
};

// Utilitário seguro para adicionar event listeners sem quebrar o script se o elemento não existir
function on(id, event, handler) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener(event, handler);
  }
}

// Utilitários de API com fallback transparente para GitHub Pages / Demonstração
const isStaticHost = window.location.protocol === 'file:' || 
                     window.location.hostname.endsWith('github.io');
let useOfflineFallback = isStaticHost;

async function api(path, options = {}) {
  if (useOfflineFallback && window.ClientOfflineBackend) {
    return window.ClientOfflineBackend.handle(path, options);
  }
  try {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const res = await fetch(path, { ...options, headers });
    if (!res.ok) {
      if (res.status === 404 && window.ClientOfflineBackend) {
        useOfflineFallback = true;
        return window.ClientOfflineBackend.handle(path, options);
      }
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || 'Erro na requisição');
    }
    return res.json();
  } catch (err) {
    if (window.ClientOfflineBackend) {
      useOfflineFallback = true;
      return window.ClientOfflineBackend.handle(path, options);
    }
    throw err;
  }
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  toast.textContent = message;
  toast.style.borderColor = isError ? 'var(--rose)' : 'var(--emerald)';
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

function formatDate(isoString) {
  if (!isoString) return 'Nunca';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return isoString;
  }
}

// Navegação entre Views Principais
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
    });
  });
}

function switchView(viewName) {
  state.currentView = viewName;
  document.querySelectorAll('.nav-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === viewName);
  });
  document.querySelectorAll('.view-section').forEach((s) => {
    s.classList.toggle('active', s.id === `view-${viewName}`);
  });

  if (viewName === 'companies') loadCompanies();
  if (viewName === 'crm') loadCrmPipeline();
  if (viewName === 'automations') loadAutomationJobs();
  if (viewName === 'integrations') loadIntegrations();
  if (viewName === 'logs') loadSystemLogs();
}

// Inicialização Global
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupModals();
  setupFilterListeners();
  await loadRegions();
  await loadCompanies();
  await refreshStats();
});

// 1. Carregar e Filtrar Empresas
async function loadCompanies() {
  const tbody = document.getElementById('companiesTableBody');
  if (!tbody) return;

  try {
    const crmStage = document.getElementById('filterCrmStage')?.value || '';
    const priority = document.getElementById('filterPriority')?.value || '';
    const search = document.getElementById('filterSearch')?.value || '';

    const query = new URLSearchParams();
    if (crmStage) query.append('crm_stage', crmStage);
    if (priority) query.append('priority', priority);
    if (search) query.append('search', search);

    const companies = await api(`/api/companies?${query.toString()}`);
    state.companies = companies;
    renderCompaniesTable(companies);
    refreshStats();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="11" class="text-center text-danger py-4">Erro ao carregar empresas: ${err.message}</td></tr>`;
  }
}

function renderCompaniesTable(companies) {
  const tbody = document.getElementById('companiesTableBody');
  if (!tbody) return;

  if (companies.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="text-center py-5">
          <p class="text-muted mb-2 font-medium" style="font-size: 1rem;">Nenhuma empresa cadastrada no momento.</p>
          <p class="text-dim text-sm mb-3">Clique no botão abaixo para buscar e cadastrar empresas por segmento e cidade!</p>
          <button class="btn btn-primary btn-sm" onclick="openProspectModal()">🚀 Prospectar Novas Empresas</button>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = companies
    .map((c) => {
      const ratingText = c.rating !== null ? `⭐ ${c.rating.toFixed(1)}` : '<span class="text-danger italic">Indisponível</span>';
      const reviewText = c.review_count !== null ? `${c.review_count} avaliações` : '<span class="text-danger italic">Indisponível</span>';
      const siteText = c.website ? `<a href="${c.website}" target="_blank" class="text-indigo">Link ↗</a>` : '<span class="text-danger italic">Sem site</span>';
      const phoneText = c.phone || c.whatsapp || '<span class="text-danger italic">Indisponível</span>';
      
      const priorityClass = `badge-${(c.priority || 'baixa').toLowerCase()}`;
      const stageClass = c.crm_stage === 'CLIENTE' ? 'badge-stage-cliente' : c.crm_stage === 'CONTATO APROVADO' ? 'badge-stage-aprovado' : 'badge-stage';

      return `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td>${c.category}</td>
          <td>${c.city}${c.state ? ' / ' + c.state : ''}</td>
          <td>${ratingText}</td>
          <td>${reviewText}</td>
          <td>${siteText}</td>
          <td>${phoneText}</td>
          <td><span class="badge ${stageClass}">${c.crm_stage}</span></td>
          <td><span class="badge ${priorityClass}">${c.priority}</span></td>
          <td class="text-sm">${formatDate(c.last_analysis_at)}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="openCompanyModal('${c.id}')">Ver Detalhes</button>
          </td>
        </tr>
      `;
    })
    .join('');
}

function setupFilterListeners() {
  on('filterSearch', 'input', debounce(loadCompanies, 300));
  on('filterCrmStage', 'change', loadCompanies);
  on('filterPriority', 'change', loadCompanies);
  on('btnRefreshCompanies', 'click', loadCompanies);
}

function debounce(func, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

// 2. Ficha Completa da Empresa (6 Abas)
window.openCompanyModal = async function (companyId) {
  state.selectedCompanyId = companyId;
  state.isEditingMessage = false;
  const modal = document.getElementById('companyDetailModal');
  if (modal) modal.classList.add('active');

  // Abre na primeira aba por padrão
  switchModalTab('tab-resumo');
  await reloadCompanyDetail(companyId);
};

window.openProspectModal = function() {
  document.querySelectorAll('#importModal .tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#importModal .tab-content').forEach(c => c.classList.remove('active'));
  const targetTabBtn = document.querySelector('#importModal [data-tab="tab-import-provider"]');
  if (targetTabBtn) targetTabBtn.classList.add('active');
  const targetContent = document.getElementById('tab-import-provider');
  if (targetContent) targetContent.classList.add('active');
  const modal = document.getElementById('importModal');
  if (modal) modal.classList.add('active');
};

async function reloadCompanyDetail(companyId) {
  try {
    const detail = await api(`/api/companies/${companyId}`);
    state.companyDetail = detail;
    renderCompanyDetail(detail);
  } catch (err) {
    showToast(`Erro ao carregar ficha: ${err.message}`, true);
  }
}

function renderCompanyDetail(detail) {
  if (!detail || !detail.company) {
    console.error('Dados da empresa não encontrados ou formato inválido:', detail);
    return;
  }
  const { company, latestAudit, latestScore, latestMessage, proposals, communications } = detail;

  // Header do Modal
  const nameEl = document.getElementById('modalCompanyName');
  if (nameEl) nameEl.textContent = company.name;
  const catEl = document.getElementById('modalCategoryBadge');
  if (catEl) catEl.textContent = company.category;
  const cityEl = document.getElementById('modalCityBadge');
  if (cityEl) cityEl.textContent = `${company.city} (${company.region})`;
  
  const stageBadge = document.getElementById('modalStageBadge');
  if (stageBadge) {
    stageBadge.textContent = company.crm_stage;
    stageBadge.className = `badge ${company.crm_stage === 'CLIENTE' ? 'badge-stage-cliente' : company.crm_stage === 'CONTATO APROVADO' ? 'badge-stage-aprovado' : 'badge-stage'}`;
  }

  const priorityBadge = document.getElementById('modalPriorityBadge');
  if (priorityBadge) {
    priorityBadge.textContent = company.priority;
    priorityBadge.className = `badge badge-${(company.priority || 'baixa').toLowerCase()}`;
  }

  // ABA 1: RESUMO (Todos os dados encontrados, preservando NULL/Indisponível sem alucinação)
  const grid = document.getElementById('collectedDataGrid');
  if (grid) {
    const fields = [
      { label: 'CNPJ', val: company.cnpj },
      { label: 'Segmento', val: company.category },
      { label: 'Cidade / Região', val: `${company.city} (${company.region})` },
      { label: 'Endereço', val: company.address },
      { label: 'Avaliação Média', val: company.rating !== null ? `${company.rating.toFixed(1)} estrelas` : null },
      { label: 'Total de Avaliações', val: company.review_count !== null ? `${company.review_count} avaliações` : null },
      { label: 'Website Oficial', val: company.website },
      { label: 'Telefone Principal', val: company.phone },
      { label: 'WhatsApp', val: company.whatsapp },
      { label: 'E-mail Comercial', val: company.email },
      { label: 'Instagram', val: company.instagram },
    ];

    grid.innerHTML = fields
      .map((f) => `
        <div class="data-cell">
          <div class="data-cell-label">${f.label}</div>
          <div class="data-cell-value ${f.val ? '' : 'unavailable'}">${f.val || 'NULL / Indisponível'}</div>
        </div>
      `)
      .join('');
  }

  // Separação Semântica Transparente (DADO COLETADO, INFERÊNCIA DA IA, RECOMENDAÇÃO)
  const collectedFactsContainer = document.getElementById('resumoCollectedFacts');
  const inferencesContainer = document.getElementById('resumoInferences');
  const recommendationsContainer = document.getElementById('resumoRecommendations');

  if (latestAudit) {
    const facts = JSON.parse(latestAudit.collected_facts_json || '[]');
    const inferences = JSON.parse(latestAudit.ai_inferences_json || '[]');
    const recs = JSON.parse(latestAudit.recommendations_json || '[]');

    if (collectedFactsContainer) collectedFactsContainer.innerHTML = facts.map(f => `<div class="semantic-item">${f.label}: <strong>${f.value || 'Indisponível'}</strong></div>`).join('') || '<p class="text-sm text-muted">Nenhum dado coletado adicional.</p>';
    if (inferencesContainer) inferencesContainer.innerHTML = inferences.map(inf => `<div class="semantic-item">${inf}</div>`).join('') || '<p class="text-sm text-muted">Nenhuma inferência gerada ainda.</p>';
    if (recommendationsContainer) recommendationsContainer.innerHTML = recs.map(r => `<div class="semantic-item">${r}</div>`).join('') || '<p class="text-sm text-muted">Nenhuma recomendação gerada ainda.</p>';
  } else {
    if (collectedFactsContainer) collectedFactsContainer.innerHTML = '<p class="text-sm text-muted">Execute a auditoria para extrair fatos.</p>';
    if (inferencesContainer) inferencesContainer.innerHTML = '<p class="text-sm text-muted">Aguardando auditoria...</p>';
    if (recommendationsContainer) recommendationsContainer.innerHTML = '<p class="text-sm text-muted">Aguardando auditoria...</p>';
  }

  // ABA 2: AUDITORIA
  const auditTimestampEl = document.getElementById('auditTimestampText');
  const auditPositiveEl = document.getElementById('auditPositiveList');
  const auditProblemsEl = document.getElementById('auditProblemsList');
  const auditOppEl = document.getElementById('auditOpportunitiesList');
  const auditRecEl = document.getElementById('auditRecommendationsList');
  const auditSnapshotEl = document.getElementById('auditInputSnapshotJson');

  if (latestAudit) {
    if (auditTimestampEl) auditTimestampEl.textContent = `Auditoria realizada em ${formatDate(latestAudit.created_at)} via ${latestAudit.provider_name}`;
    
    const pos = JSON.parse(latestAudit.positive_points_json || '[]');
    const prob = JSON.parse(latestAudit.problems_found_json || '[]');
    const opp = JSON.parse(latestAudit.opportunities_json || '[]');
    const rec = JSON.parse(latestAudit.recommendations_json || '[]');

    if (auditPositiveEl) auditPositiveEl.innerHTML = pos.map(p => `<li>${p}</li>`).join('') || '<li>Nenhum ponto positivo mapeado.</li>';
    if (auditProblemsEl) auditProblemsEl.innerHTML = prob.map(p => `<li>${p}</li>`).join('') || '<li>Nenhum problema impeditivo identificado.</li>';
    if (auditOppEl) auditOppEl.innerHTML = opp.map(o => `<li>${o}</li>`).join('') || '<li>Nenhuma oportunidade mapeada.</li>';
    if (auditRecEl) auditRecEl.innerHTML = rec.map(r => `<li>${r}</li>`).join('') || '<li>Nenhuma recomendação registrada.</li>';
    if (auditSnapshotEl) auditSnapshotEl.textContent = JSON.stringify(JSON.parse(latestAudit.input_data_json || '{}'), null, 2);
  } else {
    if (auditTimestampEl) auditTimestampEl.textContent = 'Nenhuma auditoria realizada ainda.';
    if (auditPositiveEl) auditPositiveEl.innerHTML = '<li>Auditoria pendente. Clique no botão acima para executar.</li>';
    if (auditProblemsEl) auditProblemsEl.innerHTML = '<li>Auditoria pendente.</li>';
    if (auditOppEl) auditOppEl.innerHTML = '<li>Auditoria pendente.</li>';
    if (auditRecEl) auditRecEl.innerHTML = '<li>Auditoria pendente.</li>';
    if (auditSnapshotEl) auditSnapshotEl.textContent = '{}';
  }

  // ABA 3: OPORTUNIDADES & LEAD SCORE
  const scoreNumEl = document.getElementById('scoreNumber');
  const scoreClassBadge = document.getElementById('scoreClassificationBadge');
  const scorePrioBadge = document.getElementById('scorePriorityBadge');
  const scoreRationaleEl = document.getElementById('scoreRationaleText');
  const scoreSnapshotEl = document.getElementById('scoreInputSnapshotJson');

  if (latestScore) {
    if (scoreNumEl) scoreNumEl.textContent = latestScore.score;
    if (scoreClassBadge) {
      scoreClassBadge.textContent = latestScore.classification;
      scoreClassBadge.className = `badge ${latestScore.classification === 'QUENTE' ? 'badge-alta' : latestScore.classification === 'MORNO' ? 'badge-media' : 'badge-baixa'}`;
    }
    if (scorePrioBadge) {
      scorePrioBadge.textContent = `Prioridade ${latestScore.priority}`;
      scorePrioBadge.className = `badge badge-${(latestScore.priority || 'baixa').toLowerCase()}`;
    }
    if (scoreRationaleEl) scoreRationaleEl.textContent = latestScore.rationale;
    if (scoreSnapshotEl) scoreSnapshotEl.textContent = JSON.stringify(JSON.parse(latestScore.input_data_json || '{}'), null, 2);
  } else {
    if (scoreNumEl) scoreNumEl.textContent = '--';
    if (scoreClassBadge) scoreClassBadge.textContent = 'NÃO CLASSIFICADO';
    if (scorePrioBadge) scorePrioBadge.textContent = 'SEM PRIORIDADE';
    if (scoreRationaleEl) scoreRationaleEl.textContent = 'Clique em "Recalcular Score" para classificar este lead.';
    if (scoreSnapshotEl) scoreSnapshotEl.textContent = '{}';
  }

  // ABA 4: MENSAGEM (Canal, Destinatário, Assunto, Mensagem, Status, EDITAR, APROVAR, REJEITAR)
  const btnApprove = document.getElementById('btnApproveMessage');
  const subjectInput = document.getElementById('msgSubjectInput');
  const bodyInput = document.getElementById('msgBodyInput');
  const msgChannelEl = document.getElementById('msgChannelDisplay');
  const msgRecipientEl = document.getElementById('msgRecipientDisplay');
  const msgStatusEl = document.getElementById('msgStatusBadge');
  const msgFactsEl = document.getElementById('msgUsedFactsList');

  if (latestMessage) {
    if (msgChannelEl) msgChannelEl.textContent = latestMessage.channel;
    if (msgRecipientEl) msgRecipientEl.textContent = latestMessage.recipient || 'Equipe Comercial';
    
    if (msgStatusEl) {
      msgStatusEl.textContent = latestMessage.status;
      msgStatusEl.className = `badge ${latestMessage.status === 'APPROVED' ? 'badge-stage-aprovado' : latestMessage.status === 'REJECTED' ? 'badge-alta' : 'badge-media'}`;
    }

    if (subjectInput) subjectInput.value = latestMessage.subject || '(Sem assunto / Canal de mensagem direta)';
    if (bodyInput) bodyInput.value = latestMessage.body;

    const usedFacts = JSON.parse(latestMessage.input_data_json || '{}');
    if (msgFactsEl) msgFactsEl.innerHTML = `<pre class="code-box">${JSON.stringify(usedFacts, null, 2)}</pre>`;

    if (btnApprove) {
      if (latestMessage.status === 'APPROVED') {
        btnApprove.disabled = true;
        btnApprove.textContent = '✅ MENSAGEM JÁ APROVADA';
      } else {
        btnApprove.disabled = false;
        btnApprove.textContent = '✅ APROVAR MENSAGEM';
      }
    }
  } else {
    if (msgChannelEl) msgChannelEl.textContent = '-';
    if (msgRecipientEl) msgRecipientEl.textContent = '-';
    if (msgStatusEl) msgStatusEl.textContent = 'NENHUMA MENSAGEM';
    if (subjectInput) subjectInput.value = '';
    if (bodyInput) bodyInput.value = 'Nenhuma abordagem gerada ainda. Selecione o canal e clique em "Gerar Nova Mensagem".';
    if (msgFactsEl) msgFactsEl.innerHTML = '<p class="text-sm text-muted">Aguardando geração de mensagem.</p>';
    if (btnApprove) btnApprove.disabled = true;
  }

  // ABA 5: HISTÓRICO
  const timeline = document.getElementById('historyTimeline');
  if (timeline) {
    if (communications.length === 0) {
      timeline.innerHTML = '<p class="text-muted text-sm py-3">Nenhum evento registrado no histórico até o momento.</p>';
    } else {
      timeline.innerHTML = communications
        .map(comm => `
          <div class="timeline-item">
            <div class="timeline-meta">${formatDate(comm.created_at)} • Canal: ${comm.channel} • [${comm.event_type}]</div>
            <div><strong>${comm.summary}</strong></div>
            ${comm.details_json ? `<div class="text-dim text-sm mt-1">${comm.details_json}</div>` : ''}
          </div>
        `)
        .join('');
    }
  }

  // ABA 6: CRM & PROPOSTAS
  const crmStageSel = document.getElementById('crmStageSelector');
  if (crmStageSel) crmStageSel.value = company.crm_stage;

  const propContainer = document.getElementById('proposalsListContainer');
  if (propContainer) {
    if (proposals.length === 0) {
      propContainer.innerHTML = '<p class="text-muted text-sm py-2">Nenhuma proposta cadastrada ainda para este lead.</p>';
    } else {
      propContainer.innerHTML = proposals
        .map(p => `
          <div class="card-section mt-2">
            <div class="section-head-row">
              <h5>${p.title}</h5>
              <span class="badge badge-stage">${p.status}</span>
            </div>
            <div class="text-emerald font-bold mt-1">${p.estimated_value ? 'R$ ' + p.estimated_value.toFixed(2) : 'Valor sob consulta'}</div>
            <p class="text-sm text-muted mt-1">${p.service_scope}</p>
          </div>
        `)
        .join('');
    }
  }
}

// 3. Ações da Ficha da Empresa (Execuções, Auditorias, Aprovações)
function setupModals() {
  // Tabs do Modal da Empresa
  document.querySelectorAll('#companyDetailModal .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchModalTab(btn.dataset.tab));
  });

  on('btnCloseCompanyModal', 'click', () => {
    const modal = document.getElementById('companyDetailModal');
    if (modal) modal.classList.remove('active');
    loadCompanies();
  });

  // Botão Ciclo Completo IA
  on('btnRunFullAIFlow', 'click', async () => {
    if (!state.selectedCompanyId) return;
    try {
      showToast('⚡ Executando ciclo completo de IA (Auditoria + Score + Mensagem)...');
      await api(`/api/companies/${state.selectedCompanyId}/audit`, { method: 'POST' });
      await api(`/api/companies/${state.selectedCompanyId}/score`, { method: 'POST' });
      await api(`/api/companies/${state.selectedCompanyId}/message`, {
        method: 'POST',
        body: JSON.stringify({ channel: 'EMAIL' }),
      });
      showToast('Ciclo concluído! Mensagem gerada e pronta para aprovação.');
      await reloadCompanyDetail(state.selectedCompanyId);
      switchModalTab('tab-mensagem');
    } catch (err) {
      showToast(`Erro no ciclo de IA: ${err.message}`, true);
    }
  });

  // Reexecutar apenas Auditoria
  on('btnRunAuditOnly', 'click', async () => {
    if (!state.selectedCompanyId) return;
    try {
      showToast('🔍 Executando auditoria digital...');
      await api(`/api/companies/${state.selectedCompanyId}/audit`, { method: 'POST' });
      showToast('Auditoria atualizada!');
      await reloadCompanyDetail(state.selectedCompanyId);
    } catch (err) {
      showToast(`Erro na auditoria: ${err.message}`, true);
    }
  });

  // Recalcular apenas Score
  on('btnRunScoreOnly', 'click', async () => {
    if (!state.selectedCompanyId) return;
    try {
      showToast('🎯 Calculando Lead Score...');
      await api(`/api/companies/${state.selectedCompanyId}/score`, { method: 'POST' });
      showToast('Lead Score atualizado!');
      await reloadCompanyDetail(state.selectedCompanyId);
    } catch (err) {
      showToast(`Erro no cálculo de score: ${err.message}`, true);
    }
  });

  // Gerar Nova Mensagem
  on('btnGenerateNewMessage', 'click', async () => {
    if (!state.selectedCompanyId) return;
    try {
      const channel = document.getElementById('msgChannelSelect')?.value || 'EMAIL';
      showToast(`💬 Redigindo abordagem personalizada para ${channel}...`);
      await api(`/api/companies/${state.selectedCompanyId}/message`, {
        method: 'POST',
        body: JSON.stringify({ channel }),
      });
      showToast('Nova mensagem gerada!');
      await reloadCompanyDetail(state.selectedCompanyId);
    } catch (err) {
      showToast(`Erro ao gerar mensagem: ${err.message}`, true);
    }
  });

  // APROVAR MENSAGEM (Fase 1: apenas aprovação interna, avança lead para CONTATO APROVADO)
  on('btnApproveMessage', 'click', async () => {
    const msg = state.companyDetail?.latestMessage;
    if (!msg) return;
    try {
      showToast('Registrando aprovação humana...');
      await api(`/api/messages/${msg.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ decidedBy: 'Operador Comercial', notes: 'Aprovado via painel.' }),
      });
      showToast('Mensagem aprovada com sucesso! Lead avançado para "CONTATO APROVADO".');
      await reloadCompanyDetail(state.selectedCompanyId);
      await loadCompanies();
    } catch (err) {
      showToast(`Erro na aprovação: ${err.message}`, true);
    }
  });

  // COPIAR TEXTO DA MENSAGEM
  on('btnCopyMessage', 'click', () => {
    const bodyInput = document.getElementById('msgBodyInput');
    if (!bodyInput || !bodyInput.value) {
      showToast('Nenhum texto disponível para cópia.', true);
      return;
    }
    navigator.clipboard.writeText(bodyInput.value);
    showToast('📋 Mensagem copiada para a área de transferência!');
  });

  // ABRIR NO WHATSAPP COM TEXTO PRONTO
  on('btnOpenWhatsAppDirect', 'click', async () => {
    const company = state.companyDetail?.company;
    const bodyInput = document.getElementById('msgBodyInput');
    if (!company || !bodyInput || !bodyInput.value) {
      showToast('Nenhuma mensagem ou empresa selecionada.', true);
      return;
    }

    // Busca o melhor telefone disponível (priorizando números válidos com DDD e 8 ou 9 dígitos)
    const phoneCandidates = [company.whatsapp, company.phone].filter(Boolean);
    let chosenDigits = null;

    for (const cand of phoneCandidates) {
      const clean = String(cand).replace(/\D/g, '').replace(/^0+/, '');
      if (clean.length === 10 || clean.length === 11 || (clean.length >= 12 && clean.startsWith('55'))) {
        chosenDigits = clean;
        break;
      }
    }

    if (!chosenDigits && phoneCandidates.length > 0) {
      chosenDigits = String(phoneCandidates[0]).replace(/\D/g, '').replace(/^0+/, '');
    }

    if (!chosenDigits) {
      showToast('Esta empresa não possui número de WhatsApp ou telefone cadastrado.', true);
      return;
    }

    // Formata rigorosamente para o padrão internacional do WhatsApp (wa.me/<DDI><DDD><Número>)
    let digits = chosenDigits;
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
      // Já contém DDI 55 + DDD (2 dígitos) + 8 ou 9 dígitos locais
    } else if (digits.length === 10 || digits.length === 11) {
      // 10 dígitos (DDD + 8 dígitos) ou 11 dígitos (DDD + 9 dígitos) -> adiciona DDI Brasil (55)
      digits = '55' + digits;
    } else if (digits.length === 8 || digits.length === 9) {
      // Faltando DDD, completa com DDD padrão 21 (ou 9 na frente se 8 dígitos)
      digits = '5521' + (digits.length === 8 ? '9' + digits : digits);
    } else {
      showToast(`Número com formato incompatível para WhatsApp: ${company.whatsapp || company.phone}`, true);
      return;
    }

    const text = encodeURIComponent(bodyInput.value);
    const waUrl = `https://wa.me/${digits}?text=${text}`;

    // Abre o WhatsApp Web ou aplicativo oficial
    window.open(waUrl, '_blank');

    // Avança o estágio do CRM para 'CONTATADO' e registra comunicação
    try {
      await api('/api/crm/stage', {
        method: 'POST',
        body: JSON.stringify({
          companyId: company.id,
          stage: 'CONTATADO',
          notes: 'Mensagem aberta e enviada pelo operador via WhatsApp Web/App.',
        }),
      });
      showToast('📲 WhatsApp aberto com sucesso! Lead atualizado para "CONTATADO" no CRM.');
      await reloadCompanyDetail(company.id);
      await loadCompanies();
    } catch (err) {
      console.warn('Erro ao atualizar estágio do CRM:', err);
    }
  });

  // ABRIR NO E-MAIL (GMAIL / OUTLOOK)
  on('btnOpenEmailDirect', 'click', async () => {
    const company = state.companyDetail?.company;
    const bodyInput = document.getElementById('msgBodyInput');
    const subjectInput = document.getElementById('msgSubjectInput');
    if (!company || !bodyInput || !bodyInput.value) return;

    const email = company.email || '';
    const subject = encodeURIComponent(subjectInput?.value || 'Oportunidade Comercial');
    const body = encodeURIComponent(bodyInput.value);
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

    window.open(mailtoUrl, '_blank');

    try {
      await api('/api/crm/stage', {
        method: 'POST',
        body: JSON.stringify({
          companyId: company.id,
          stage: 'CONTATADO',
          notes: 'Mensagem aberta no cliente de e-mail do operador.',
        }),
      });
      showToast('✉️ E-mail aberto! Lead atualizado para "CONTATADO" no CRM.');
      await reloadCompanyDetail(company.id);
      await loadCompanies();
    } catch (err) {
      console.warn('Erro ao atualizar CRM:', err);
    }
  });

  // REJEITAR MENSAGEM
  on('btnRejectMessage', 'click', async () => {
    const msg = state.companyDetail?.latestMessage;
    if (!msg) return;
    const reason = prompt('Por favor, digite o motivo da rejeição da mensagem:');
    if (!reason || reason.trim().length === 0) return;

    try {
      await api(`/api/messages/${msg.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim(), decidedBy: 'Operador Comercial' }),
      });
      showToast('Mensagem rejeitada e registrada no histórico.');
      await reloadCompanyDetail(state.selectedCompanyId);
    } catch (err) {
      showToast(`Erro ao rejeitar: ${err.message}`, true);
    }
  });

  // EDITAR MENSAGEM
  on('btnToggleEditMessage', 'click', async () => {
    const msg = state.companyDetail?.latestMessage;
    if (!msg) return;
    const subjectInput = document.getElementById('msgSubjectInput');
    const bodyInput = document.getElementById('msgBodyInput');
    const btnEdit = document.getElementById('btnToggleEditMessage');

    if (!state.isEditingMessage) {
      // Entra em modo de edição
      state.isEditingMessage = true;
      if (subjectInput) subjectInput.removeAttribute('readonly');
      if (bodyInput) bodyInput.removeAttribute('readonly');
      if (subjectInput) subjectInput.focus();
      if (btnEdit) btnEdit.textContent = '💾 SALVAR EDIÇÃO';
      showToast('Modo de edição ativo. Altere o texto e clique em Salvar.');
    } else {
      // Salva a edição
      try {
        await api(`/api/messages/${msg.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            subject: subjectInput ? subjectInput.value : '',
            body: bodyInput ? bodyInput.value : '',
            notes: 'Ajuste manual de copy realizado pelo operador.',
            approveNow: false,
          }),
        });
        state.isEditingMessage = false;
        if (subjectInput) subjectInput.setAttribute('readonly', 'true');
        if (bodyInput) bodyInput.setAttribute('readonly', 'true');
        if (btnEdit) btnEdit.textContent = '✏️ EDITAR';
        showToast('Edição salva com sucesso!');
        await reloadCompanyDetail(state.selectedCompanyId);
      } catch (err) {
        showToast(`Erro ao salvar edição: ${err.message}`, true);
      }
    }
  });

  // Salvar Estágio no CRM
  on('btnSaveStage', 'click', async () => {
    if (!state.selectedCompanyId) return;
    const stage = document.getElementById('crmStageSelector')?.value;
    if (!stage) return;
    try {
      await api(`/api/crm/stage`, {
        method: 'POST',
        body: JSON.stringify({ companyId: state.selectedCompanyId, stage, notes: 'Alteração manual no CRM' }),
      });
      showToast(`Estágio do lead atualizado para ${stage}!`);
      await reloadCompanyDetail(state.selectedCompanyId);
    } catch (err) {
      showToast(`Erro ao alterar estágio: ${err.message}`, true);
    }
  });

  // Toggle e Form de Nova Proposta
  on('btnToggleNewProposal', 'click', () => {
    document.getElementById('formNewProposal')?.classList.toggle('hidden');
  });
  on('btnCancelProposal', 'click', () => {
    document.getElementById('formNewProposal')?.classList.add('hidden');
  });
  on('formNewProposal', 'submit', async (e) => {
    e.preventDefault();
    if (!state.selectedCompanyId) return;
    try {
      const title = document.getElementById('propTitle')?.value;
      const estimatedValue = document.getElementById('propValue')?.value;
      const serviceScope = document.getElementById('propScope')?.value;

      await api('/api/crm/proposals', {
        method: 'POST',
        body: JSON.stringify({
          companyId: state.selectedCompanyId,
          title,
          estimatedValue,
          serviceScope,
        }),
      });

      showToast('Proposta cadastrada com sucesso!');
      const form = document.getElementById('formNewProposal');
      if (form) {
        form.reset();
        form.classList.add('hidden');
      }
      await reloadCompanyDetail(state.selectedCompanyId);
    } catch (err) {
      showToast(`Erro ao salvar proposta: ${err.message}`, true);
    }
  });

  // Limpar Banco de Dados (Zerar Tudo)
  on('btnCleanDatabase', 'click', async () => {
    if (!confirm('Deseja realmente apagar todas as empresas cadastradas e começar do zero?')) {
      return;
    }
    try {
      showToast('Limpando banco de dados...');
      await api('/api/database/clear-all', { method: 'POST' });
      state.companies = [];
      renderCompaniesTable([]);
      await refreshStats();
      showToast('🗑️ Banco limpo com sucesso! 0 empresas.');
    } catch (err) {
      showToast(`Erro ao limpar banco: ${err.message}`, true);
    }
  });

  // Modal de Prospecção (Abrir Aba Provedor)
  on('btnOpenProspectModal', 'click', () => {
    openProspectModal();
  });

  // Modal de Licença SaaS (Mercado Livre)
  on('btnOpenLicenseModal', 'click', () => {
    const saved = localStorage.getItem('prospector_ia_license');
    const display = document.getElementById('licenseStatusDisplay');
    const input = document.getElementById('licenseKeyInput');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (display) display.innerHTML = `✅ ATIVA: <code>${parsed.key}</code> (${parsed.plan || 'SaaS Pro Vitalício'})`;
        if (input) input.value = parsed.key;
      } catch {}
    } else {
      if (display) display.innerHTML = `⚠️ Modo Demonstração (Insira sua chave do Mercado Livre)`;
    }
    const modal = document.getElementById('licenseModal');
    if (modal) modal.classList.add('active');
  });

  on('btnCloseLicenseModal', 'click', () => {
    const modal = document.getElementById('licenseModal');
    if (modal) modal.classList.remove('active');
  });

  on('btnCancelLicenseModal', 'click', () => {
    const modal = document.getElementById('licenseModal');
    if (modal) modal.classList.remove('active');
  });

  on('formActivateLicense', 'submit', (e) => {
    e.preventDefault();
    const key = document.getElementById('licenseKeyInput')?.value?.trim().toUpperCase();
    if (!key || key.length < 10) {
      showToast('Por favor, informe uma chave de licença válida.', true);
      return;
    }
    const licenseData = {
      key: key,
      status: 'ATIVA',
      plan: 'SaaS Pro 2026 Vitalício',
      activatedAt: new Date().toISOString()
    };
    localStorage.setItem('prospector_ia_license', JSON.stringify(licenseData));
    const display = document.getElementById('licenseStatusDisplay');
    if (display) display.innerHTML = `✅ ATIVA: <code>${key}</code> (SaaS Pro 2026 Vitalício)`;
    showToast('🎉 Licença ativada com sucesso! Todos os recursos liberados.');
    const modal = document.getElementById('licenseModal');
    if (modal) modal.classList.remove('active');
  });

  // Modal de Cadastro Manual (Abrir Aba Manual)
  on('btnOpenManualModal', 'click', () => {
    document.querySelectorAll('#importModal .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#importModal .tab-content').forEach(c => c.classList.remove('active'));
    const targetTabBtn = document.querySelector('#importModal [data-tab="tab-register-manual"]');
    if (targetTabBtn) targetTabBtn.classList.add('active');
    const targetContent = document.getElementById('tab-register-manual');
    if (targetContent) targetContent.classList.add('active');
    const modal = document.getElementById('importModal');
    if (modal) modal.classList.add('active');
  });

  on('btnCloseImportModal', 'click', () => {
    document.getElementById('importModal')?.classList.remove('active');
  });
  on('btnCancelImportModal', 'click', () => {
    document.getElementById('importModal')?.classList.remove('active');
  });
  on('btnCancelManualModal', 'click', () => {
    document.getElementById('importModal')?.classList.remove('active');
  });

  // Submissão Importação Provedor
  on('formImportProvider', 'submit', async (e) => {
    e.preventDefault();
    const segment = document.getElementById('importCustomSegment')?.value.trim();
    const city = document.getElementById('importCustomCity')?.value.trim();
    const region = document.getElementById('importCustomRegion')?.value.trim() || 'Centro';
    const stateVal = document.getElementById('importCustomState')?.value.trim() || 'SP';
    const limit = document.getElementById('importLimit')?.value || '5';

    if (!segment || !city) {
      showToast('Segmento e cidade são obrigatórios para busca.', true);
      return;
    }

    try {
      showToast(`Buscando empresas de ${segment} em ${city}...`);
      const result = await api('/api/companies/import', {
        method: 'POST',
        body: JSON.stringify({
          region,
          city,
          state: stateVal,
          segment,
          limit,
        }),
      });

      if (result.imported > 0) {
        showToast(`🎉 Sucesso! ${result.imported} nova(s) empresa(s) de ${segment} adicionada(s)!`);
      } else if (result.updated > 0) {
        showToast(`${result.updated} empresa(s) já existentes foram atualizadas.`);
      } else {
        showToast('Nenhuma nova empresa encontrada com esses critérios.', true);
      }

      document.getElementById('importModal')?.classList.remove('active');
      await loadCompanies();
      await refreshStats();
      await loadRegions();
    } catch (err) {
      showToast(`Erro na importação: ${err.message}`, true);
    }
  });

  // Submissão Cadastro Manual
  on('formRegisterManual', 'submit', async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: document.getElementById('manualName')?.value,
        category: document.getElementById('manualCategory')?.value,
        cnpj: document.getElementById('manualCnpj')?.value || null,
        region: document.getElementById('manualRegion')?.value,
        city: document.getElementById('manualCity')?.value,
        website: document.getElementById('manualWebsite')?.value || null,
        phone: document.getElementById('manualPhone')?.value || null,
        email: document.getElementById('manualEmail')?.value || null,
      };

      const result = await api('/api/companies', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      showToast(result.isNew ? 'Empresa cadastrada com sucesso!' : 'Empresa já existente atualizada com novos dados!');
      document.getElementById('formRegisterManual')?.reset();
      document.getElementById('importModal')?.classList.remove('active');
      await loadCompanies();
      await refreshStats();
    } catch (err) {
      showToast(`Erro no cadastro: ${err.message}`, true);
    }
  });

  // Tabs internas do Modal de Importação
  document.querySelectorAll('#importModal .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#importModal .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#importModal .tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

function switchModalTab(tabId) {
  document.querySelectorAll('#companyDetailModal .tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });
  document.querySelectorAll('#companyDetailModal .tab-content').forEach(c => {
    c.classList.toggle('active', c.id === tabId);
  });
}

// 4. Regiões e Segmentos
async function loadRegions() {
  try {
    const regions = await api('/api/settings/regions');
    state.regions = regions;

    const select = document.getElementById('importSelectRegion');
    if (select) {
      select.innerHTML = '<option value="">-- Ou escolha uma região/segmento salvo --</option>' + regions
        .map(r => `<option value="${r.id}">${r.segment} — ${r.city} / ${r.state || ''} (${r.region})</option>`)
        .join('');

      select.onchange = () => {
        const selected = regions.find(r => r.id === select.value);
        if (selected) {
          const segEl = document.getElementById('importCustomSegment');
          const cityEl = document.getElementById('importCustomCity');
          const regEl = document.getElementById('importCustomRegion');
          const stEl = document.getElementById('importCustomState');
          if (segEl) segEl.value = selected.segment;
          if (cityEl) cityEl.value = selected.city;
          if (regEl) regEl.value = selected.region;
          if (stEl) stEl.value = selected.state || '';
        }
      };

      // Preenche com a primeira região por padrão se os campos estiverem vazios
      const segInput = document.getElementById('importCustomSegment');
      if (regions.length > 0 && segInput && !segInput.value) {
        segInput.value = regions[0].segment;
        const cityEl = document.getElementById('importCustomCity');
        const regEl = document.getElementById('importCustomRegion');
        const stEl = document.getElementById('importCustomState');
        if (cityEl) cityEl.value = regions[0].city;
        if (regEl) regEl.value = regions[0].region;
        if (stEl) stEl.value = regions[0].state || '';
      }
    }

    const statRegEl = document.getElementById('statActiveRegions');
    if (statRegEl) statRegEl.textContent = regions.length;
  } catch (err) {
    console.error('Erro ao carregar regiões:', err);
  }
}

// 5. CRM Pipeline Visual (Kanban)
async function loadCrmPipeline() {
  const board = document.getElementById('pipelineBoard');
  if (!board) return;
  board.innerHTML = '<p class="text-muted text-sm py-4">Carregando pipeline...</p>';

  try {
    const overview = await api('/api/crm/pipeline');
    const stages = [
      'NOVO', 'ANALISADO', 'CONTATO APROVADO', 'CONTATADO',
      'RESPONDEU', 'INTERESSADO', 'REUNIÃO', 'PROPOSTA', 'CLIENTE',
      'SEM INTERESSE', 'NÃO RESPONDEU'
    ];

    board.innerHTML = stages
      .map(stage => {
        const list = overview[stage] || [];
        return `
          <div class="pipeline-column">
            <div class="pipeline-col-header">
              <span>${stage}</span>
              <span class="badge ${stage === 'CLIENTE' ? 'badge-stage-cliente' : stage === 'CONTATO APROVADO' ? 'badge-stage-aprovado' : 'badge-stage'}">${list.length}</span>
            </div>
            <div class="pipeline-cards-list">
              ${
                list.length === 0
                  ? '<p class="text-dim text-sm text-center py-4">Sem leads</p>'
                  : list.map(c => `
                      <div class="pipeline-card" onclick="openCompanyModal('${c.id}')">
                        <div class="pipeline-card-title">${c.name}</div>
                        <div class="pipeline-card-meta">${c.category} • ${c.city}</div>
                        <div class="pipeline-card-footer">
                          <span class="badge badge-${(c.priority || 'baixa').toLowerCase()}">${c.priority}</span>
                          <span class="text-dim text-sm">${c.rating ? '⭐ ' + c.rating.toFixed(1) : ''}</span>
                        </div>
                      </div>
                    `).join('')
              }
            </div>
          </div>
        `;
      })
      .join('');
  } catch (err) {
    board.innerHTML = `<p class="text-danger py-4">Erro ao carregar pipeline: ${err.message}</p>`;
  }
}

on('btnRefreshCrm', 'click', loadCrmPipeline);

// 6. Automações e Jobs
async function loadAutomationJobs() {
  const tbody = document.getElementById('jobsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="9" class="text-center py-3">Carregando fila...</td></tr>';

  try {
    const jobs = await api('/api/automations/jobs');
    if (jobs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-3">Nenhum job registrado na fila.</td></tr>';
      return;
    }

    tbody.innerHTML = jobs
      .map(j => `
        <tr>
          <td class="text-sm font-mono">${j.id.slice(0, 8)}...</td>
          <td><strong>${j.type}</strong></td>
          <td><span class="badge ${j.status === 'COMPLETED' ? 'badge-stage-aprovado' : j.status === 'FAILED' ? 'badge-alta' : 'badge-media'}">${j.status}</span></td>
          <td>${j.attempts} / ${j.max_attempts}</td>
          <td class="text-sm">${formatDate(j.created_at)}</td>
          <td class="text-sm">${formatDate(j.executed_at)}</td>
          <td class="text-sm">${formatDate(j.next_run_at)}</td>
          <td class="text-danger text-sm">${j.last_error || '-'}</td>
          <td>
            ${j.status === 'PENDING' ? `<button class="btn btn-secondary btn-sm" onclick="runJobNow('${j.id}')">Executar</button>` : '-'}
          </td>
        </tr>
      `)
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-danger py-3">Erro: ${err.message}</td></tr>`;
  }
}

window.runJobNow = async function(jobId) {
  try {
    showToast(`Executando tarefa ${jobId.slice(0, 8)}...`);
    await api(`/api/automations/jobs/${jobId}/run`, { method: 'POST' });
    showToast('Tarefa executada com sucesso!');
    await loadAutomationJobs();
  } catch (err) {
    showToast(`Erro na execução do job: ${err.message}`, true);
  }
};

on('btnRefreshJobs', 'click', loadAutomationJobs);
on('btnRecoverJobs', 'click', async () => {
  try {
    const result = await api('/api/automations/recover', { method: 'POST' });
    showToast(`Recuperação concluída: ${result.recoveredJobsCount} tarefas reajustadas.`);
    await loadAutomationJobs();
  } catch (err) {
    showToast(`Erro na recuperação: ${err.message}`, true);
  }
});

// 7. Integrações e Transparência
async function loadIntegrations() {
  const grid = document.getElementById('integrationsGrid');
  if (!grid) return;
  grid.innerHTML = '<p class="text-muted text-sm py-4">Carregando contratos de provedores...</p>';

  try {
    const manifests = await api('/api/providers/manifests');
    grid.innerHTML = manifests
      .map(m => `
        <div class="integration-card">
          <div class="integration-card-head">
            <div>
              <h3>${m.serviceName}</h3>
              <div class="text-dim text-sm">${m.providerType} (${m.providerId})</div>
            </div>
            <span class="badge ${m.connectedInPhase1 ? 'badge-stage-aprovado' : 'badge-media'}">${m.statusLabel}</span>
          </div>

          <div class="integration-section">
            <div class="integration-section-title">Permissões Necessárias:</div>
            <ul class="text-muted">
              ${m.requiredPermissions.map(p => `<li><code>${p}</code></li>`).join('')}
            </ul>
          </div>

          <div class="integration-section">
            <div class="integration-section-title">Dados Utilizados:</div>
            <p class="text-muted">${m.dataUsed.join(' • ')}</p>
          </div>

          <div class="integration-section">
            <div class="integration-section-title">Ação a Ser Executada:</div>
            <p class="text-muted">${m.actionToExecute}</p>
          </div>

          <div class="notice-banner mt-3">
            🛡️ <strong>Segurança:</strong> ${m.securityNotes}
          </div>
        </div>
      `)
      .join('');
  } catch (err) {
    grid.innerHTML = `<p class="text-danger py-4">Erro ao carregar manifestos: ${err.message}</p>`;
  }
}

// 8. Logs do Sistema
async function loadSystemLogs() {
  const tbody = document.getElementById('logsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3">Carregando logs...</td></tr>';

  try {
    const logs = await api('/api/logs?limit=50');
    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">Nenhum log gravado.</td></tr>';
      return;
    }

    tbody.innerHTML = logs
      .map(log => `
        <tr>
          <td class="text-sm font-mono">${formatDate(log.created_at)}</td>
          <td><span class="badge ${log.level === 'ERROR' ? 'badge-alta' : log.level === 'WARN' ? 'badge-media' : 'badge-stage'}">${log.level}</span></td>
          <td><code>${log.category}</code></td>
          <td><strong>${log.action}</strong></td>
          <td class="text-sm">${log.message}</td>
        </tr>
      `)
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-danger py-3">Erro: ${err.message}</td></tr>`;
  }
}

on('btnRefreshLogs', 'click', loadSystemLogs);

// 9. Estatísticas do Topo
async function refreshStats() {
  try {
    const companies = Array.isArray(state.companies) ? state.companies : await api('/api/companies');
    const totalEl = document.getElementById('statTotalCompanies');
    if (totalEl) totalEl.textContent = companies.length;
    
    // Contagem de quem tem mensagem esperando aprovação
    const approved = companies.filter(c => c.crm_stage === 'CONTATO APROVADO').length;
    const approvedEl = document.getElementById('statApprovedContacts');
    if (approvedEl) approvedEl.textContent = approved;

    const waiting = companies.filter(c => c.crm_stage === 'ANALISADO' || c.crm_stage === 'NOVO').length;
    const waitingEl = document.getElementById('statWaitingApproval');
    if (waitingEl) waitingEl.textContent = waiting;
  } catch (err) {
    console.error('Erro ao atualizar estatísticas:', err);
  }
}
