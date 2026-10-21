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

  // 2. Cadastra 3 Empresas com perfis digitais distintos
  const c1 = companyService.registerCompany({
    name: 'Auto Mecânica São José',
    cnpj: '12.345.678/0001-90',
    category: 'Oficina Mecânica',
    region: 'Zona Leste',
    city: 'São Paulo',
    state: 'SP',
    address: 'Rua São José, 120 - Mooca',
    rating: 4.2,
    review_count: 28,
    website: null, // Sem site oficial: ótimo lead para prospecção
    phone: '(11) 98765-4321',
    instagram: '@mecanicasaojose',
    whatsapp: '11987654321',
    email: 'contato@mecanicasaojose.com.br',
  });

  const c2 = companyService.registerCompany({
    name: 'Clínica OdontoSorriso Prime',
    cnpj: '98.765.432/0001-10',
    category: 'Clínica Odontológica',
    region: 'Zona Sul',
    city: 'São Paulo',
    state: 'SP',
    address: 'Av. Santo Amaro, 2400',
    rating: 4.8,
    review_count: 145,
    website: 'https://odontosorrisoprime.com.br',
    phone: '(11) 97654-3210',
    instagram: '@odontosorriso.sp',
    whatsapp: '11976543210',
    email: 'recepcao@odontosorrisoprime.com.br',
  });

  const c3 = companyService.registerCompany({
    name: 'Restaurante Sabor da Terra',
    cnpj: null,
    category: 'Restaurante',
    region: 'Centro',
    city: 'Curitiba',
    state: 'PR',
    address: 'Rua das Flores, 88',
    rating: 3.9,
    review_count: 84,
    website: null,
    phone: '(41) 3322-1100',
    instagram: null,
    whatsapp: '(41) 99111-2233',
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
