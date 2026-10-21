# Guia de Desenvolvimento — Prospector IA

## 1. Pré-requisitos

- **Node.js**: v22.5+ ou v24+ (utiliza o módulo nativo `node:sqlite` para persistência SQLite sem dependência de compiladores C++ externos)
- **npm**: v10+

## 2. Instalação e Execução Local

```bash
# 1. Instalar dependências
npm install

# 2. Compilar TypeScript
npm run build

# 3. Popular dados iniciais de exemplo (opcional, o servidor também inicializa o schema automaticamente)
npm run seed

# 4. Iniciar o servidor (Backend + Frontend em http://localhost:3000)
npm start
```

## 3. Executando os Testes Automatizados

A suíte de testes cobre todas as exigências funcionais e de robustez:
- Cadastro de região/segmento e empresa
- Deduplicação de empresas (CNPJ, domínio, telefone, nome+cidade)
- Execução de auditoria e preservação de `NULL`/indisponível
- Geração de diagnóstico com separação `DADO COLETADO` / `INFERÊNCIA DA IA` / `RECOMENDAÇÃO`
- Classificação de lead (`generateLeadScore`)
- Geração de mensagem personalizada e follow-up
- Fluxo de aprovação/edição/rejeição sem envio externo
- Mudança de estágio do CRM
- Motor de automação: retry limitado, backoff, detecção de duplicidade e recuperação de tarefas interrompidas

```bash
npm test
```

## 4. Estrutura de Diretórios

```
Prospector/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── INTEGRATIONS.md
│   ├── AI.md
│   ├── DEVELOPMENT.md
│   └── IMPLEMENTATION_STATUS.md
├── src/
│   ├── types/               # Contratos e modelos de domínio
│   ├── security/            # Hash de segredos, sanitização e variáveis de ambiente
│   ├── database/            # Conexão SQLite, schema DDL e repositórios
│   ├── providers/           # Interfaces e implementações (CompanyData, AI, Email, WhatsApp)
│   ├── ai/                  # Camada independente de IA (AIService)
│   ├── automations/         # Motor de automação baseado em estados (AutomationEngine)
│   ├── services/            # Serviços de domínio (Company, Audit, Score, Message, CRM, Logs)
│   ├── backend/             # API Express (app.ts, routes.ts, server.ts)
│   ├── frontend/            # Dashboard Web modular (index.html, styles.css, app.js)
│   └── tests/               # Suíte de testes automatizados (prospector.test.ts)
├── package.json
└── tsconfig.json
```
