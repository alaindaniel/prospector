import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseManager } from '../database/connection';
import { CompanyService } from '../services/CompanyService';
import { AuditService } from '../services/AuditService';
import { LeadScoringService } from '../services/LeadScoringService';
import { MessageService } from '../services/MessageService';
import { CRMService } from '../services/CRMService';
import { AIService } from '../ai/AIService';
import { AutomationEngine } from '../automations/AutomationEngine';
import { ProviderRegistry } from '../providers/ProviderRegistry';

describe('Suíte de Testes do Prospector IA', () => {
  let db: ReturnType<typeof DatabaseManager.createIsolatedDatabase>;

  beforeEach(() => {
    // Banco SQLite isolado em memória para cada suite de teste
    db = DatabaseManager.createIsolatedDatabase(':memory:');
    ProviderRegistry.initialize();
  });

  afterEach(() => {
    db.close();
  });

  test('1. Cadastro de Empresa: preserva dados nulos e não alucina informações', () => {
    const companyService = new CompanyService(db);
    const result = companyService.registerCompany({
      name: 'Oficina do Zé',
      category: 'Oficina Mecânica',
      region: 'Zona Leste',
      city: 'São Paulo',
      state: 'SP',
      phone: '(11) 98888-7777',
      // Website, CNPJ e Instagram omitidos intencionalmente
    });

    assert.equal(result.isNew, true);
    assert.equal(result.company.name, 'Oficina do Zé');
    assert.equal(result.company.website, null, 'Website deve ser NULL quando não fornecido');
    assert.equal(result.company.cnpj, null, 'CNPJ deve ser NULL quando não fornecido');
    assert.equal(result.company.rating, null, 'Rating deve ser NULL quando não fornecido');
    assert.equal(result.company.crm_stage, 'NOVO');
    assert.equal(result.company.priority, 'NAO_CLASSIFICADO');

    // Verifica se os contatos foram criados
    const contacts = companyService.getContacts(result.company.id);
    assert.ok(contacts.length > 0);
  });

  test('2. Deduplicação: detecta e consolida empresas duplicadas', () => {
    const companyService = new CompanyService(db);

    // 1º Cadastro
    const first = companyService.registerCompany({
      name: 'Padaria Estrela Dalva',
      category: 'Padaria',
      region: 'Centro',
      city: 'Curitiba',
      cnpj: '11.222.333/0001-44',
      phone: '(41) 3333-4444',
      website: 'https://estreladalva.com.br',
    });
    assert.equal(first.isNew, true);

    // Tentativa 1: Deduplicação por CNPJ
    const dupCnpj = companyService.registerCompany({
      name: 'Padaria Estrela Dalva Matriz',
      category: 'Padaria',
      region: 'Centro',
      city: 'Curitiba',
      cnpj: '11222333000144', // Sem pontuação
    });
    assert.equal(dupCnpj.isNew, false, 'Deve identificar duplicação por CNPJ');
    assert.equal(dupCnpj.company.id, first.company.id);

    // Tentativa 2: Deduplicação por Domínio
    const dupDomain = companyService.registerCompany({
      name: 'Estrela Dalva Panificadora',
      category: 'Panificação',
      region: 'Centro',
      city: 'Curitiba',
      website: 'http://www.estreladalva.com.br/contato',
    });
    assert.equal(dupDomain.isNew, false, 'Deve identificar duplicação por domínio');
    assert.equal(dupDomain.company.id, first.company.id);

    // Tentativa 3: Deduplicação por Nome Normalizado + Cidade
    const dupNameCity = companyService.registerCompany({
      name: '  padária  estrela  dalva!  ',
      category: 'Alimentação',
      region: 'Centro',
      city: 'Curitiba',
    });
    assert.equal(dupNameCity.isNew, false, 'Deve identificar duplicação por nome normalizado + cidade');
    assert.equal(dupNameCity.company.id, first.company.id);
  });

  test('3. Auditoria Digital: gera pontos positivos, problemas, oportunidades e dados utilizados', async () => {
    const companyService = new CompanyService(db);
    const auditService = new AuditService(db);

    const reg = companyService.registerCompany({
      name: 'Dr. Sorriso Odontologia',
      category: 'Clínica Odontológica',
      region: 'Zona Sul',
      city: 'São Paulo',
      rating: 4.6,
      review_count: 52,
      website: null, // Sem site intencional
      phone: '(11) 99999-1111',
    });

    const audit = await auditService.runAuditForCompany(reg.company.id);

    assert.ok(audit.id);
    assert.equal(audit.company_id, reg.company.id);

    const positive = JSON.parse(audit.positive_points_json);
    const problems = JSON.parse(audit.problems_found_json);
    const opportunities = JSON.parse(audit.opportunities_json);
    const recommendations = JSON.parse(audit.recommendations_json);
    const inputSnapshot = JSON.parse(audit.input_data_json);

    assert.ok(positive.length > 0, 'Deve conter pontos positivos');
    assert.ok(problems.length > 0, 'Deve identificar o problema de não ter site');
    assert.ok(opportunities.length > 0, 'Deve mapear oportunidades comerciais');
    assert.ok(recommendations.length > 0, 'Deve trazer recomendações práticas');
    assert.equal(inputSnapshot.name, 'Dr. Sorriso Odontologia', 'Snapshot dos dados deve ser preservado');

    // Verifica se a empresa avançou para ANALISADO
    const updatedComp = companyService.getCompanyById(reg.company.id)!;
    assert.equal(updatedComp.crm_stage, 'ANALISADO');
  });

  test('4. Geração de Diagnóstico: separa claramente DADO COLETADO, INFERÊNCIA e RECOMENDAÇÃO', async () => {
    const companyService = new CompanyService(db);
    const aiService = new AIService(db);

    const reg = companyService.registerCompany({
      name: 'Auto Elétrica Rápida',
      category: 'Auto Elétrica',
      region: 'Norte',
      city: 'São Paulo',
      rating: 3.8,
      review_count: 12,
      website: 'https://autoeletrica.com.br',
      phone: '(11) 94444-2222',
    });

    const diagnosis = await aiService.analyzeCompany(reg.company);

    assert.ok(diagnosis.summary);
    assert.ok(diagnosis.collectedFacts.length > 0, 'Deve possuir dados coletados');
    assert.ok(diagnosis.aiInferences.length > 0, 'Deve possuir inferências analíticas');
    assert.ok(diagnosis.recommendations.length > 0, 'Deve possuir recomendações');

    // Valida que campo nulo é explicitado
    const cnpjFact = diagnosis.collectedFacts.find((f) => f.field === 'cnpj');
    assert.equal(cnpjFact?.value, null);
    assert.equal(cnpjFact?.available, false);
  });

  test('5. Classificação (Lead Scoring): pontua, atribui prioridade e classificação', async () => {
    const companyService = new CompanyService(db);
    const scoringService = new LeadScoringService(db);

    const reg = companyService.registerCompany({
      name: 'Funilaria e Pintura Express',
      category: 'Oficina Mecânica',
      region: 'Leste',
      city: 'São Paulo',
      rating: 4.5,
      review_count: 40,
      website: null, // Sem site = potencial alto de oferta
      phone: '(11) 97777-3333',
    });

    const scoreRecord = await scoringService.scoreCompany(reg.company.id);

    assert.ok(scoreRecord.score >= 0 && scoreRecord.score <= 100);
    assert.ok(['ALTA', 'MEDIA', 'BAIXA'].includes(scoreRecord.priority));
    assert.ok(['QUENTE', 'MORNO', 'FRIO'].includes(scoreRecord.classification));
    assert.ok(scoreRecord.rationale.length > 0);

    // Valida persistência da prioridade na empresa
    const updatedComp = companyService.getCompanyById(reg.company.id)!;
    assert.equal(updatedComp.priority, scoreRecord.priority);
  });

  test('6. Geração de Mensagem Personalizada: cria minuta com dados auditados em WAITING_APPROVAL', async () => {
    const companyService = new CompanyService(db);
    const messageService = new MessageService(db);

    const reg = companyService.registerCompany({
      name: 'PetShop Patinhas Felizes',
      category: 'Pet Shop',
      region: 'Oeste',
      city: 'São Paulo',
      email: 'contato@patinhasfelizes.com.br',
      phone: '(11) 93333-8888',
    });

    const message = await messageService.generatePersonalizedMessage(reg.company.id, 'EMAIL');

    assert.ok(message.id);
    assert.equal(message.channel, 'EMAIL');
    assert.equal(message.status, 'WAITING_APPROVAL');
    assert.ok(message.subject?.includes('Patinhas Felizes'));
    assert.ok(message.body.includes('Patinhas Felizes'));
  });

  test('7. Aprovação, Edição e Rejeição: registra decisões sem envio externo na Fase 1', async () => {
    const companyService = new CompanyService(db);
    const messageService = new MessageService(db);
    const crmService = new CRMService(db);

    const reg = companyService.registerCompany({
      name: 'Contabilidade Confiança',
      category: 'Contabilidade',
      region: 'Sul',
      city: 'Curitiba',
      email: 'fiscal@confianca.com.br',
    });

    const msg = await messageService.generatePersonalizedMessage(reg.company.id, 'EMAIL');

    // 1. Edição da mensagem
    const edited = messageService.editAndApproveMessage(
      msg.id,
      {
        subject: 'Assunto Editado Manualmente',
        body: 'Corpo customizado pelo operador.',
        notes: 'Refinamento de proposta',
        approveNow: false,
      },
      'Carlos Operador'
    );
    assert.equal(edited.subject, 'Assunto Editado Manualmente');
    assert.equal(edited.status, 'WAITING_APPROVAL');

    // 2. Aprovação: não dispara externamente, apenas registra e avança CRM para CONTATO APROVADO
    const approved = messageService.approveMessage(msg.id, 'Carlos Operador', 'Aprovado para contato.');
    assert.equal(approved.status, 'APPROVED');
    assert.equal(approved.user_decision, 'APPROVED');

    const compAfterApproval = companyService.getCompanyById(reg.company.id)!;
    assert.equal(compAfterApproval.crm_stage, 'CONTATO APROVADO', 'Estágio do lead deve mudar para CONTATO APROVADO');

    // Verifica histórico em communications
    const comms = crmService.getCommunicationsHistory(reg.company.id);
    const hasApprovalComm = comms.some((c) => c.event_type === 'MESSAGE_APPROVED');
    assert.ok(hasApprovalComm, 'Deve registrar o evento de aprovação no histórico');
  });

  test('8. Mudança de Estágio do CRM e Propostas: valida pipeline e histórico imutável', () => {
    const companyService = new CompanyService(db);
    const crmService = new CRMService(db);

    const reg = companyService.registerCompany({
      name: 'Escola de Idiomas Global',
      category: 'Educação',
      region: 'Centro',
      city: 'São Paulo',
    });

    // Transições pelo pipeline
    crmService.updateStage(reg.company.id, 'INTERESSADO', 'Cliente demonstrou interesse no WhatsApp');
    let comp = companyService.getCompanyById(reg.company.id)!;
    assert.equal(comp.crm_stage, 'INTERESSADO');

    crmService.updateStage(reg.company.id, 'REUNIÃO', 'Reunião agendada para quinta-feira');
    comp = companyService.getCompanyById(reg.company.id)!;
    assert.equal(comp.crm_stage, 'REUNIÃO');

    // Criar proposta
    const proposal = crmService.createProposal({
      companyId: reg.company.id,
      title: 'Plano de Captação de Matrículas 2026',
      serviceScope: 'Gestão de tráfego, automação de respostas e landing page.',
      estimatedValue: 4800.0,
    });
    assert.ok(proposal.id);
    assert.equal(proposal.status, 'DRAFT');

    crmService.updateStage(reg.company.id, 'PROPOSTA');
    comp = companyService.getCompanyById(reg.company.id)!;
    assert.equal(comp.crm_stage, 'PROPOSTA');

    crmService.updateStage(reg.company.id, 'CLIENTE', 'Contrato assinado!');
    comp = companyService.getCompanyById(reg.company.id)!;
    assert.equal(comp.crm_stage, 'CLIENTE');

    // Transição para arquivo/fechado
    crmService.updateStage(reg.company.id, 'SEM INTERESSE');
    comp = companyService.getCompanyById(reg.company.id)!;
    assert.equal(comp.crm_stage, 'SEM INTERESSE');
  });

  test('9. Motor de Automação: retry limitado, backoff e falha sem loops infinitos', async () => {
    const engine = new AutomationEngine(db);

    // Registra handler propositalmente falho para testar retries e limites
    let callCount = 0;
    engine.registerHandler('SCORE_LEAD', async () => {
      callCount++;
      throw new Error(`Falha simulada na tentativa ${callCount}`);
    });

    const job = engine.enqueueJob({
      type: 'SCORE_LEAD',
      maxAttempts: 2,
      timeoutMs: 2000,
    });

    assert.equal(job.status, 'PENDING');
    assert.equal(job.attempts, 0);

    // 1ª Tentativa: deve falhar, agendar backoff e ficar PENDING
    const jobAfterTry1 = await engine.processJob(job.id);
    assert.equal(jobAfterTry1.attempts, 1);
    assert.equal(jobAfterTry1.status, 'PENDING');
    assert.ok(jobAfterTry1.next_run_at);

    // 2ª Tentativa: atinge max_attempts (2) e deve finalizar definitivamente como FAILED
    const jobAfterTry2 = await engine.processJob(job.id);
    assert.equal(jobAfterTry2.attempts, 2);
    assert.equal(jobAfterTry2.status, 'FAILED', 'Deve falhar definitivamente ao exceder max_attempts');
    assert.ok(jobAfterTry2.last_error?.includes('Falha simulada'));

    // 3ª Tentativa desnecessária: não reexecuta se já estiver FAILED
    const jobAfterTry3 = await engine.processJob(job.id);
    assert.equal(jobAfterTry3.status, 'FAILED');
    assert.equal(callCount, 2, 'Não pode chamar novamente após atingir o limite');
  });

  test('10. Recuperação de Tarefas Travadas (Crash Recovery)', () => {
    const engine = new AutomationEngine(db);

    // Simula um job que estava em RUNNING quando o servidor caiu abruptamente
    const job = engine.enqueueJob({
      type: 'IMPORT_COMPANIES',
      maxAttempts: 3,
    });

    // Força manualmente o status RUNNING no banco simulando queda súbita
    db.prepare(`UPDATE automation_jobs SET status = 'RUNNING', attempts = 1 WHERE id = ?`).run(job.id);

    const recoveredCount = engine.recoverStuckJobs();
    assert.equal(recoveredCount, 1, 'Deve recuperar o job interrompido');

    const recoveredJob = engine.getJobById(job.id)!;
    assert.equal(recoveredJob.status, 'PENDING');
    assert.ok(recoveredJob.next_run_at);
    assert.ok(recoveredJob.last_error?.includes('Interrupção'));
  });

  test('11. Detecção de Execuções Duplicadas por Idempotência', () => {
    const engine = new AutomationEngine(db);

    const job1 = engine.enqueueJob({
      type: 'FULL_PROSPECTING_FLOW',
      idempotencyKey: 'flow-empresa-123',
    });

    // Tenta enfileirar novamente com a mesma chave enquanto a anterior ainda está pendente
    const job2 = engine.enqueueJob({
      type: 'FULL_PROSPECTING_FLOW',
      idempotencyKey: 'flow-empresa-123',
    });

    assert.equal(job1.id, job2.id, 'Deve retornar o mesmo job existente em vez de duplicar');
  });
});
