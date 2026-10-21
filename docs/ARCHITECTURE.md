# Arquitetura do Sistema — Prospector IA

## 1. Visão Geral

O **Prospector IA** foi projetado com arquitetura em camadas desacopladas para suportar evolução incremental sem acoplamento entre interface gráfica, regras de negócio, motor de automação, camada de Inteligência Artificial e provedores externos.

```
+-----------------------------------------------------------------------+
|                              FRONTEND                                 |
|  Dashboard SPA (Empresas, Detalhe 6 Abas, Auditoria, Mensagem, CRM)   |
+-----------------------------------+-----------------------------------+
                                    | REST JSON API
+-----------------------------------v-----------------------------------+
|                              BACKEND                                  |
|         Rotas Express, Validação, Tratamento de Erros e Logs          |
+-----------------------------------+-----------------------------------+
                                    |
+-----------------------------------v-----------------------------------+
|                        CAMADA DE SERVIÇOS                             |
|  CompanyService | AuditService | LeadScoringService | MessageService  |
|  CRMService     | SettingsService | LogService      | SecurityService |
+---------+-------------------------+-------------------------+---------+
          |                         |                         |
+---------v---------+     +---------v---------+     +---------v---------+
|   CAMADA DE IA    |     | MOTOR AUTOMAÇÃO   |     |   PROVEDORES      |
|   (AIService)     |     | (State Machine)   |     |   (Interfaces)    |
+---------+---------+     +---------+---------+     +---------+---------+
          |                         |                         |
          +-------------------------+-------------------------+
                                    |
+-----------------------------------v-----------------------------------+
|                           BANCO DE DADOS                              |
|  SQLite Relacional (11 tabelas principais, FKs, Índices, Transações)  |
+-----------------------------------------------------------------------+
```

## 2. Separação de Responsabilidades

1. **Frontend (`src/frontend/`)**:
   - Exclusivamente responsável pela apresentação visual, filtros, navegação entre abas e captura de ações do usuário (cadastro de região/segmento, importação de empresas, solicitação de auditoria, edição/aprovação/rejeição de mensagens e movimentação de cards no pipeline CRM).
   - Não contém regras de cálculo de score, heurísticas de auditoria ou acesso direto a banco.

2. **Backend (`src/backend/`)**:
   - Controladores HTTP/REST (`routes.ts`, `app.ts`, `server.ts`) que recebem requisições, validam payloads, invocam a camada de Serviços e retornam respostas padronizadas.

3. **Serviços de Negócio (`src/services/`)**:
   - `CompanyService`: Cadastro de regiões/segmentos, importação, normalização e deduplicação de empresas e contatos.
   - `AuditService`: Execução de auditoria estruturada preservando a separação estrita entre **DADO COLETADO**, **INFERÊNCIA DA IA** e **RECOMENDAÇÃO**.
   - `LeadScoringService`: Classificação e priorização de leads com base nos sinais reais e diagnóstico.
   - `MessageService`: Geração de abordagens personalizadas e follow-ups, além do fluxo de revisão humana (`EDITAR`, `APROVAR`, `REJEITAR`) sem disparo externo automático na Fase 1.
   - `CRMService`: Máquina de transição de estágios do funil comercial (`NOVO` até `CLIENTE`, além de `SEM INTERESSE` e `NÃO RESPONDEU`), propostas e histórico completo.
   - `LogService`: Registro imutável de todas as operações em `system_logs`.

4. **Camada de IA (`src/ai/`)**:
   - Implementa os métodos obrigatórios:
     - `analyzeCompany()`
     - `generateAudit()`
     - `generateLeadScore()`
     - `generateMessage()`
     - `generateFollowup()`
   - Toda chamada registra no banco tanto o resultado quanto o snapshot exato dos dados de entrada (`input_data_json`) utilizados na análise.
   - Jamais inventa fatos ausentes: campos não coletados permanecem `null` / `indisponível`.

5. **Motor de Automação Baseado em Estados (`src/automations/`)**:
   - Gerencia tarefas assíncronas e síncronas (`automation_jobs`) com os estados:
     - `PENDING`
     - `RUNNING`
     - `WAITING_APPROVAL`
     - `COMPLETED`
     - `FAILED`
     - `CANCELLED`
   - Implementa controle de `timeout`, limite máximo de tentativas (`max_attempts`), `backoff` exponencial (`next_run_at`), prevenção de execução duplicada (`idempotency_key`) e recuperação de tarefas interrompidas após fechamento inesperado (`recoverStuckJobs`).

6. **Integrações Externas (`src/providers/`)**:
   - Interfaces formais:
     - `CompanyDataProvider`
     - `AIProvider`
     - `EmailProvider`
     - `WhatsAppProvider`
   - Permitem substituir qualquer fornecedor sem alterar os serviços de domínio.
   - Inclui manifesto de consentimento transparente informando serviço, permissões, dados utilizados e ação antes de qualquer ativação externa.
