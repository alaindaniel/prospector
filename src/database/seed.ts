import { DatabaseManager } from './connection';
import { CompanyService } from '../services/CompanyService';
import { SettingsService } from '../services/SettingsService';
import { AuditService } from '../services/AuditService';
import { LeadScoringService } from '../services/LeadScoringService';
import { MessageService } from '../services/MessageService';
import { CRMService } from '../services/CRMService';
import { LogService } from '../services/LogService';

export async function runSeed(customDbPath?: string): Promise<void> {
  const db = DatabaseManager.getConnection(customDbPath);
  const companyService = new CompanyService(db);
  const settingsService = new SettingsService(db);
  const auditService = new AuditService(db);
  const leadScoringService = new LeadScoringService(db);
  const messageService = new MessageService(db);
  const crmService = new CRMService(db);
  const logService = new LogService(db);

  logService.info('SEED', 'SEED_START', 'Iniciando carga de dados de demonstração...');

  // 1. Cadastra Regiões e Segmentos
  const regions = settingsService.listRegionsAndSegments();
  logService.info('SEED', 'REGIONS_LOADED', `${regions.length} regiões e segmentos configurados.`);

  // 2. Cadastra 3 Empresas Reais com dados autênticos
  const c1 = companyService.registerCompany({
    name: 'Condal Espaço Beauty',
    cnpj: null,
    category: 'Salão de Beleza',
    region: 'Tijuca',
    city: 'Rio de Janeiro',
    state: 'RJ',
    address: 'Av. Maracanã, 987, 1º Piso (Shopping Tijuca)',
    rating: 4.8,
    review_count: 320,
    website: 'https://condalbeauty.com.br',
    phone: '(21) 99751-6775',
    instagram: '@condalbeauty',
    whatsapp: '21997516775',
    email: 'atendimento@condalbeauty.com.br',
  });

  const c2 = companyService.registerCompany({
    name: 'Auto Tijuca Centro Automotivo',
    cnpj: null,
    category: 'Oficina Mecânica',
    region: 'Tijuca',
    city: 'Rio de Janeiro',
    state: 'RJ',
    address: 'Rua Conde de Bonfim, 1259',
    rating: 4.7,
    review_count: 198,
    website: null,
    phone: '(21) 96899-9318',
    instagram: null,
    whatsapp: '21968999318',
    email: null,
  });

  const c3 = companyService.registerCompany({
    name: 'Oral Unic Tijuca',
    cnpj: null,
    category: 'Odontologia',
    region: 'Tijuca',
    city: 'Rio de Janeiro',
    state: 'RJ',
    address: 'Rua Major Ávila, 207',
    rating: 4.9,
    review_count: 290,
    website: 'https://oralunictijuca.com.br',
    phone: '(21) 99650-8900',
    instagram: null,
    whatsapp: '21996508900',
    email: null,
  });

  // 3. Executa o ciclo completo para a primeira empresa (Auditoria -> Score -> Mensagem)
  const audit1 = await auditService.runAuditForCompany(c1.company.id);
  const score1 = await leadScoringService.scoreCompany(c1.company.id);
  const msg1 = await messageService.generatePersonalizedMessage(c1.company.id, 'EMAIL');

  // 4. Executa auditoria e score para a segunda empresa
  await auditService.runAuditForCompany(c2.company.id);
  await leadScoringService.scoreCompany(c2.company.id);
  const msg2 = await messageService.generatePersonalizedMessage(c2.company.id, 'WHATSAPP');
  // Deixa a mensagem 2 já aprovada para teste de visualização no pipeline do CRM
  messageService.approveMessage(msg2.id, 'Operador Inicial', 'Aprovada no seed inicial.');

  // 5. Adiciona proposta de exemplo para c2
  crmService.createProposal({
    companyId: c2.company.id,
    title: 'Projeto de Otimização de SEO Local e Automação de WhatsApp',
    serviceScope: 'Auditoria técnica, reestruturação da presença no Google e chatbot de agendamento.',
    estimatedValue: 3500.0,
    notes: 'Proposta inicial alinhada aos gargalos detectados na auditoria digital.',
  });

  logService.info('SEED', 'SEED_COMPLETE', 'Carga de demonstração finalizada com sucesso!');
}

if (require.main === module) {
  runSeed()
    .then(() => {
      console.log('Seed executado com sucesso.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Erro ao executar seed:', err);
      process.exit(1);
    });
}
