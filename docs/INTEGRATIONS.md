# Integrações Externas e Abstrações — Prospector IA

## 1. Princípio de Desacoplamento

Todas as integrações externas são acessadas exclusivamente por contratos formais (interfaces TypeScript) localizados em `src/providers/interfaces/`:

- `CompanyDataProvider`
- `AIProvider`
- `EmailProvider`
- `WhatsAppProvider`

Nenhum serviço de negócio importa SDKs de terceiros diretamente.

## 2. Política da Fase 1 (Sem Envio Automático Externo)

Na Fase 1 do MVP:
- **Gmail / SMTP** e **WhatsApp** **NÃO** são conectados automaticamente nem realizam disparos reais sem consentimento explícito.
- O botão **APROVAR** na tela de Mensagem apenas registra a decisão do usuário no banco (`status = 'APPROVED'`, `user_decision = 'APPROVED'`), grava o histórico em `communications` e `system_logs`, e avança o lead para o estágio `CONTATO APROVADO` no CRM.

## 3. Manifesto de Transparência de Integração

Sempre que uma integração externa for solicitada ou inspecionada pelo usuário, o sistema apresenta o contrato de transparência (`IntegrationConnectionManifest`) contendo obrigatoriamente:

1. **Qual serviço será conectado** (`serviceName`, `providerId`)
2. **Quais permissões serão necessárias** (`requiredPermissions[]`)
3. **Quais dados serão utilizados** (`dataUsed[]`)
4. **Qual ação será executada** (`actionToExecute`)

### Exemplo — EmailProvider (Gmail OAuth / SMTP)
- **Serviço**: Google Workspace / Gmail API (ou Servidor SMTP Corporativo)
- **Permissões necessárias**: `gmail.compose` / Permissão de envio autenticado em nome do remetente autorizado
- **Dados utilizados**: Endereço de e-mail do destinatário (`contacts.email`), assunto aprovado (`messages.subject`) e corpo da mensagem revisado pelo usuário (`messages.body`)
- **Ação executada**: Envio individual de mensagem comercial previamente aprovada por humano e registro do ID de entrega em `communications`.

### Exemplo — WhatsAppProvider (WhatsApp Business Cloud API)
- **Serviço**: Meta WhatsApp Business API Oficial
- **Permissões necessárias**: `whatsapp_business_messaging`, `whatsapp_business_management`
- **Dados utilizados**: Número de telefone/WhatsApp validado da empresa (`companies.whatsapp` / `contacts.whatsapp`) e texto aprovado (`messages.body`)
- **Ação executada**: Disparo único de mensagem após clique explícito e aprovação humana.
