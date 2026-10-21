# ⚡ Prospector IA — Prospecção B2B, Auditoria Digital & CRM em Pipeline

> Plataforma estruturada de prospecção autônoma B2B com auditoria digital, diagnóstico de presença online, classificação inteligente de leads (Lead Scoring), minutas de abordagem personalizadas e CRM com funil Kanban visual.

---

## 🚀 Demonstração Online

- **GitHub Pages:** [https://alaindaniel.github.io/prospector/](https://alaindaniel.github.io/prospector/)
- **Vercel:** Disponível para importação e deploy em [https://vercel.com](https://vercel.com)

---

## 🎯 Objetivo e Fluxo Completo (Fase 1 — MVP)

1. **Cadastrar Região e Segmento:** Configuração de nichos prioritários (ex: Oficinas Mecânicas, Advocacia, Odontologia).
2. **Prospecção & Catalogação:** Descoberta de empresas reais locais com identificação de dados de contato e telefones normalizados de 11 dígitos no padrão brasileiro com DDD.
3. **Auditoria Digital:** Diagnóstico técnico identificando presença de site, avaliação média no Google, volume de reviews e canais de contato.
4. **Diagnóstico Estruturado:** Separação transparente entre **Dado Coletado**, **Inferência** e **Recomendação**.
5. **Classificação (Lead Scoring):** Atribuição de pontuação objetiva (0 a 100) e prioridade (*Alta*, *Média*, *Baixa*).
6. **Geração de Mensagem Personalizada:** Minuta comercial sob medida para **WhatsApp** ou **E-mail**.
7. **Aprovação Humana Obrigatória:** Botões de edição, aprovação ou rejeição sem disparos não autorizados.
8. **Disparo Assistido com 1 Clique:** Botão **"📲 Abrir no WhatsApp"** que carrega o número e o texto no WhatsApp Web ou App oficial.
9. **Pipeline de CRM Integrado:** Estágios dinâmicos (*NOVO*, *ANALISADO*, *CONTATO APROVADO*, *CONTATADO*, *RESPONDEU*, *INTERESSADO*, *REUNIÃO*, *PROPOSTA*, *CLIENTE*).
10. **Trilha de Auditoria & Logs:** Registro imutável de todas as ações no sistema.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3 moderno (Custom Properties, Grid, Flexbox), Vanilla JavaScript SPA responsivo.
- **Backend:** Node.js, Express, TypeScript.
- **Banco de Dados:** SQLite nativo (`node:sqlite`) com WAL mode e índices relacionais.
- **Deploy:** GitHub Pages (Static / Client-side Engine) e Vercel.

---

## 💻 Execução Local

```bash
# 1. Instalar dependências
npm install

# 2. Compilar TypeScript
npm run build

# 3. Iniciar o servidor
npm start
```

Acesse no seu navegador: **`http://localhost:3000`**

### Execução de Testes Automatizados

```bash
npm test
```

---

## 📦 Publicação no GitHub Pages

1. Crie o repositório no GitHub: `https://github.com/new` com o nome **`prospector`**.
2. No terminal:
   ```bash
   git init -b main
   git remote add origin https://github.com/alaindaniel/prospector.git
   git add .
   git commit -m "feat: initial commit ready for deploy"
   git push -u origin main
   ```
3. No GitHub, acesse **Settings > Pages**:
   - Em **Branch**, selecione **`main`** e a pasta **/ (root)**.
   - Clique em **Save**.
4. Em 1 a 2 minutos o sistema estará no ar em:
   **`https://alaindaniel.github.io/prospector/`**

---

## 🌐 Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e conecte com o GitHub.
2. Clique em **"Add New..." > "Project"**.
3. Selecione o repositório `alaindaniel/prospector`.
4. Clique em **"Deploy"**.

---

## 📄 Licença

MIT License — Desenvolvido por **Prospector IA / Alain Daniel**.
