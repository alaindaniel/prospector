import { Router, Request, Response } from 'express';
import { CompanyService } from '../services/CompanyService';
import { AuditService } from '../services/AuditService';
import { LeadScoringService } from '../services/LeadScoringService';
import { MessageService } from '../services/MessageService';
import { CRMService } from '../services/CRMService';
import { SettingsService } from '../services/SettingsService';
import { LogService } from '../services/LogService';
import { AutomationCoordinator } from '../automations/AutomationCoordinator';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { DatabaseManager } from '../database/connection';
import { CRMStage, LeadPriority, MessageChannel } from '../types/models';

function paramString(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0];
  return val ? String(val) : '';
}

export function createApiRouter(customDb?: import('node:sqlite').DatabaseSync): Router {
  const router = Router();
  const conn = customDb || DatabaseManager.getConnection();
  const companyService = new CompanyService(conn);
  const auditService = new AuditService(conn);
  const leadScoringService = new LeadScoringService(conn);
  const messageService = new MessageService(conn);
  const crmService = new CRMService(conn);
  const settingsService = new SettingsService(conn);
  const logService = new LogService(conn);
  const coordinator = new AutomationCoordinator(conn);
  const automationEngine = coordinator.getEngine();

  // Health Check
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Prospector IA',
      phase: 'FASE_1_MVP',
      timestamp: new Date().toISOString(),
    });
  });

  // Manifestos de Transparência de Integração
  router.get('/providers/manifests', (req: Request, res: Response) => {
    const manifests = ProviderRegistry.getAllConnectionManifests();
    res.json(manifests);
  });

  // Regiões e Segmentos
  router.get('/settings/regions', (req: Request, res: Response) => {
    const regions = settingsService.listRegionsAndSegments();
    res.json(regions);
  });

  router.post('/settings/regions', (req: Request, res: Response) => {
    try {
      const { region, city, state, segment, description } = req.body;
      if (!region || !city || !segment) {
        return res.status(400).json({ error: 'Região, cidade e segmento são obrigatórios.' });
      }
      const created = settingsService.addRegionAndSegment({ region, city, state, segment, description });
      logService.info('SETTINGS', 'REGION_SEGMENT_ADDED', `Região cadastrada: ${region} - ${city} (${segment})`);
      res.status(201).json(created);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  // Configurações Globais Seguras
  router.get('/settings', (req: Request, res: Response) => {
    res.json(settingsService.getAllSettingsSafe());
  });

  // Limpar Banco de Dados / Começar do Zero
  router.post('/database/clear-all', (req: Request, res: Response) => {
    try {
      const db = DatabaseManager.getConnection();
      db.exec(`
        DELETE FROM companies;
        DELETE FROM contacts;
        DELETE FROM audits;
        DELETE FROM lead_scores;
        DELETE FROM messages;
        DELETE FROM communications;
        DELETE FROM followups;
        DELETE FROM proposals;
        DELETE FROM automation_jobs;
        DELETE FROM system_logs;
      `);
      logService.info('DATABASE', 'DATABASE_CLEARED', 'Todas as empresas e históricos foram limpos pelo usuário.');
      res.json({ success: true, message: 'Todas as empresas e históricos foram excluídos.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  // Empresas: Listagem com filtros
  router.get('/companies', (req: Request, res: Response) => {
    try {
      const { crm_stage, priority, category, region, city, search } = req.query;
      const companies = companyService.listCompanies({
        crm_stage: crm_stage as CRMStage,
        priority: priority as LeadPriority,
        category: category as string,
        region: region as string,
        city: city as string,
        search: search as string,
      });
      res.json(companies);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  // Empresas: Cadastro Individual (com deduplicação automática)
  router.post('/companies', (req: Request, res: Response) => {
    try {
      const { name, category, region, city } = req.body;
      if (!name || !category || !region || !city) {
        return res.status(400).json({ error: 'Nome, categoria, região e cidade são obrigatórios.' });
      }
      const result = companyService.registerCompany(req.body);
      res.status(result.isNew ? 201 : 200).json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  // Empresas: Importação em Lote via Provider
  router.post('/companies/import', async (req: Request, res: Response) => {
    try {
      const { region, city, state, segment, limit } = req.body;
      if (!region || !city || !segment) {
        return res.status(400).json({ error: 'Região, cidade e segmento são obrigatórios para importação.' });
      }

      // Registra automaticamente a região e segmento se for uma nova combinação
      const existingRegions = settingsService.listRegionsAndSegments();
      const alreadyRegistered = existingRegions.some(
        r => r.segment.toLowerCase() === segment.toLowerCase() && r.city.toLowerCase() === city.toLowerCase()
      );
      if (!alreadyRegistered) {
        settingsService.addRegionAndSegment({
          region: region.trim(),
          city: city.trim(),
          state: state ? String(state).trim().toUpperCase() : null,
          segment: segment.trim(),
          description: `Região cadastrada automaticamente via prospecção de ${segment} em ${city}`,
        });
      }

      const result = await companyService.discoverAndImportFromProvider({
        region,
        city,
        state,
        segment,
        limit: limit ? Number(limit) : 10,
      });
      res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  // Detalhe Completo de Empresa (Alimenta as 6 abas da interface)
  router.get('/companies/:id', (req: Request, res: Response) => {
    try {
      const id = paramString(req.params.id);
      const detail = crmService.getAggregatedCompanyDetail(id);
      res.json(detail);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(404).json({ error: msg });
    }
  });

  // Executar Auditoria
  router.post('/companies/:id/audit', async (req: Request, res: Response) => {
    try {
      const id = paramString(req.params.id);
      const audit = await auditService.runAuditForCompany(id);
      res.json(audit);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  // Gerar Lead Score
  router.post('/companies/:id/score', async (req: Request, res: Response) => {
    try {
      const id = paramString(req.params.id);
      const score = await leadScoringService.scoreCompany(id);
      res.json(score);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  // Gerar Mensagem Personalizada
  router.post('/companies/:id/message', async (req: Request, res: Response) => {
    try {
      const id = paramString(req.params.id);
      const { channel = 'EMAIL', recipient } = req.body;
      const message = await messageService.generatePersonalizedMessage(
        id,
        channel as MessageChannel,
        recipient
      );
      res.status(201).json(message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  // Decisão Humana: Aprovar Mensagem (Fase 1: apenas aprova internamente)
  router.post('/messages/:id/approve', (req: Request, res: Response) => {
    try {
      const id = paramString(req.params.id);
      const { decidedBy, notes } = req.body;
      const updated = messageService.approveMessage(id, decidedBy, notes);
      res.json(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  // Decisão Humana: Rejeitar Mensagem
  router.post('/messages/:id/reject', (req: Request, res: Response) => {
    try {
      const id = paramString(req.params.id);
      const { reason, decidedBy } = req.body;
      if (!reason) {
        return res.status(400).json({ error: 'Motivo da rejeição é obrigatório.' });
      }
      const updated = messageService.rejectMessage(id, reason, decidedBy);
      res.json(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  // Decisão Humana: Editar Mensagem (com opção de aprovar)
  router.put('/messages/:id', (req: Request, res: Response) => {
    try {
      const id = paramString(req.params.id);
      const { subject, body, notes, approveNow, decidedBy } = req.body;
      if (!body) {
        return res.status(400).json({ error: 'O corpo da mensagem não pode ser vazio.' });
      }
      const updated = messageService.editAndApproveMessage(
        id,
        { subject, body, notes, approveNow: Boolean(approveNow) },
        decidedBy
      );
      res.json(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  // CRM: Pipeline Visual Overview
  router.get('/crm/pipeline', (req: Request, res: Response) => {
    try {
      const overview = crmService.getPipelineOverview();
      res.json(overview);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  // CRM: Atualizar Estágio
  router.post('/crm/stage', (req: Request, res: Response) => {
    try {
      const { companyId, stage, notes } = req.body;
      if (!companyId || !stage) {
        return res.status(400).json({ error: 'companyId e stage são obrigatórios.' });
      }
      const updated = crmService.updateStage(companyId, stage as CRMStage, notes);
      res.json(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  // CRM: Criar Proposta
  router.post('/crm/proposals', (req: Request, res: Response) => {
    try {
      const { companyId, title, serviceScope, estimatedValue, notes } = req.body;
      if (!companyId || !title || !serviceScope) {
        return res.status(400).json({ error: 'companyId, title e serviceScope são obrigatórios.' });
      }
      const proposal = crmService.createProposal({
        companyId,
        title,
        serviceScope,
        estimatedValue: estimatedValue ? Number(estimatedValue) : null,
        notes,
      });
      res.status(201).json(proposal);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  // Automações: Fila e Jobs
  router.get('/automations/jobs', (req: Request, res: Response) => {
    try {
      const jobs = automationEngine.getAllJobs(50);
      res.json(jobs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  router.post('/automations/jobs', (req: Request, res: Response) => {
    try {
      const { type, companyId, payload, idempotencyKey, maxAttempts, timeoutMs } = req.body;
      if (!type) {
        return res.status(400).json({ error: 'O tipo da tarefa é obrigatório.' });
      }
      const job = automationEngine.enqueueJob({
        type,
        companyId,
        payload,
        idempotencyKey,
        maxAttempts,
        timeoutMs,
      });
      res.status(201).json(job);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  router.post('/automations/jobs/:id/run', async (req: Request, res: Response) => {
    try {
      const id = paramString(req.params.id);
      const processed = await automationEngine.processJob(id);
      res.json(processed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  router.post('/automations/recover', (req: Request, res: Response) => {
    try {
      const count = automationEngine.recoverStuckJobs();
      res.json({ recoveredJobsCount: count });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  // Logs do Sistema
  router.get('/logs', (req: Request, res: Response) => {
    try {
      const { limit, companyId } = req.query;
      const logs = logService.getRecentLogs(limit ? Number(limit) : 100, companyId as string);
      res.json(logs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  return router;
}
