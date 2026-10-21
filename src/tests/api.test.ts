import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../backend/app';
import { DatabaseManager } from '../database/connection';
import { ProviderRegistry } from '../providers/ProviderRegistry';

describe('Fluxo Completo do MVP — Teste de Integração da API HTTP', () => {
  let server: http.Server;
  let baseUrl: string;
  let db: ReturnType<typeof DatabaseManager.createIsolatedDatabase>;

  before(async () => {
    db = DatabaseManager.createIsolatedDatabase(':memory:');
    ProviderRegistry.initialize();

    const app = createApp(db);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr !== null) {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    db.close();
  });

  async function request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, body: json };
  }

  test('Valida os 12 passos do MVP de ponta a ponta', async () => {
    // 1. Cadastrar uma região e segmento
    const regRes = await request('/api/settings/regions', {
      method: 'POST',
      body: JSON.stringify({
        region: 'Zona Leste',
        city: 'São Paulo',
        state: 'SP',
        segment: 'Auto Center',
        description: 'Auto centers e oficinas automotivas',
      }),
    });
    assert.equal(regRes.status, 201);
    assert.equal(regRes.body.region, 'Zona Leste');

    // 2. Importar/cadastrar empresas encontradas
    const importRes = await request('/api/companies/import', {
      method: 'POST',
      body: JSON.stringify({
        region: 'Zona Leste',
        city: 'São Paulo',
        segment: 'Auto Center',
        limit: 3,
      }),
    });
    assert.equal(importRes.status, 200);
    assert.ok(importRes.body.imported > 0);

    // 3. Armazenar os dados no banco
    const listRes = await request('/api/companies');
    assert.equal(listRes.status, 200);
    assert.ok(listRes.body.length > 0);

    const targetCompany = listRes.body[0];
    const companyId = targetCompany.id;
    assert.ok(companyId);

    // 4. Executar uma auditoria
    const auditRes = await request(`/api/companies/${companyId}/audit`, { method: 'POST' });
    assert.equal(auditRes.status, 200);
    assert.ok(auditRes.body.id);
    assert.ok(auditRes.body.positive_points_json);

    // 5. Gerar diagnóstico com IA (disponível via GET agregada)
    const detailRes1 = await request(`/api/companies/${companyId}`);
    assert.equal(detailRes1.status, 200);
    assert.ok(detailRes1.body.latestAudit);
    assert.equal(detailRes1.body.company.crm_stage, 'ANALISADO');

    // 6. Classificar o lead
    const scoreRes = await request(`/api/companies/${companyId}/score`, { method: 'POST' });
    assert.equal(scoreRes.status, 200);
    assert.ok(scoreRes.body.score >= 0);
    assert.ok(scoreRes.body.priority);

    // 7. Gerar uma mensagem personalizada
    const msgRes = await request(`/api/companies/${companyId}/message`, {
      method: 'POST',
      body: JSON.stringify({ channel: 'EMAIL' }),
    });
    assert.equal(msgRes.status, 201);
    assert.equal(msgRes.body.status, 'WAITING_APPROVAL');
    const messageId = msgRes.body.id;

    // 8. Exibir a mensagem para aprovação
    const detailRes2 = await request(`/api/companies/${companyId}`);
    assert.equal(detailRes2.status, 200);
    assert.equal(detailRes2.body.latestMessage.id, messageId);

    // 9. Registrar a decisão do usuário (Aprovação sem envio externo na Fase 1)
    const approveRes = await request(`/api/messages/${messageId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ decidedBy: 'Operador Teste', notes: 'Validado' }),
    });
    assert.equal(approveRes.status, 200);
    assert.equal(approveRes.body.status, 'APPROVED');

    // 10. Exibir o lead no CRM (no estágio CONTATO APROVADO)
    const pipelineRes = await request('/api/crm/pipeline');
    assert.equal(pipelineRes.status, 200);
    const approvedLeads = pipelineRes.body['CONTATO APROVADO'] || [];
    assert.ok(approvedLeads.some((c: { id: string }) => c.id === companyId));

    // 11. Registrar todo o histórico
    const detailRes3 = await request(`/api/companies/${companyId}`);
    assert.ok(detailRes3.body.communications.length >= 2);
    assert.ok(detailRes3.body.communications.some((c: { event_type: string }) => c.event_type === 'MESSAGE_APPROVED'));

    // 12. Criar logs de todas as operações
    const logsRes = await request('/api/logs?limit=50');
    assert.equal(logsRes.status, 200);
    assert.ok(logsRes.body.length > 0);
    assert.ok(logsRes.body.some((l: { category: string }) => l.category === 'MESSAGES' || l.category === 'COMPANIES'));
  });
});
