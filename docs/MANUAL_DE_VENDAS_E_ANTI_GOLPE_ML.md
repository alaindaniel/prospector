# 🛡️ GUIA DEFINITIVO: EMBRULHO SAAS, ENTREGA E BLINDAGEM ANTI-GOLPE NO MERCADO LIVRE

Este guia estabelece o procedimento operacional padrão para vender o **Prospector IA** no Mercado Livre, garantindo entrega automática, satisfação do cliente e **proteção jurídica/técnica contra pedidos indevidos de devolução ou estorno**.

---

## 1. DADOS DO ANÚNCIO ATIVO NO MERCADO LIVRE

- **ID do Anúncio:** `MLB7868662598`
- **Título Oficial:** `Software Prospector Ia Prospeccao B2b Crm Whatsapp`
- **Status:** **ATIVO (No ar)**
- **Preço Estratégico:** **R$ 78,90**
  > 💡 **Por que R$ 78,90?** 
  > No Mercado Livre, anúncios de R$ 79,00 ou mais sofrem desconto obrigatório de frete grátis dos Correios (o Mercado Livre desconta entre R$ 25 e R$ 35 da sua conta!). 
  > Ao fixar em R$ 78,90, **nenhum frete é descontado de você**, e o seu lucro líquido é de **mais de R$ 62,00 limpos por venda**, com uma taxa de conversão 3x maior para compra por impulso!
- **Link do Anúncio:** [https://produto.mercadolivre.com.br/MLB-7868662598-software-prospector-ia-prospeccao-b2b-crm-whatsapp-_JM](https://produto.mercadolivre.com.br/MLB-7868662598-software-prospector-ia-prospeccao-b2b-crm-whatsapp-_JM)

---

## 2. O MECANISMO DE ENTREGA "EMBRULHADA" (SaaS Onboarding)

O produto **NÃO** é entregue como um arquivo solto ou zip pirata. Ele é entregue como uma **Solução SaaS com Chave de Ativação Pessoal e Intransferível**.

### O que o cliente recebe:
1. **Link da Plataforma Online:** `https://alaindaniel.github.io/prospector/`
2. **Chave de Licença Serial Única:** Ex: `PROSP-2026-ML-9884-7352`
3. **Manual de Início Rápido (3 Minutos):** Instruções de uso e disparo no WhatsApp.
4. **Garantia de Atualizações e Suporte.**

---

## 3. A BLINDAGEM ANTI-GOLPE (Como Evitar Pedidos de Devolução)

Pessoas mal-intencionadas compram produtos digitais e depois clicam em *"Não recebi"* ou *"Quero devolver"* para ficar com o produto de graça. 

Para blindar sua conta no Mercado Livre, siga este protocolo de **3 Camadas de Proteção**:

### CAMADA 1: A Mensagem Obrigatória no Chat do Mercado Livre
Assim que o pagamento for aprovado, envie no chat da venda:

```text
Olá, [Nome do Comprador]! Parabéns pela sua aquisição do PROSPECTOR IA 2026 SaaS Pro! ⚡

Seu acesso exclusivo já foi provisionado em nosso servidor:

🔑 SUA CHAVE SERIAL DE ATIVAÇÃO: PROSP-2026-[ID_DA_VENDA]
🌐 LINK DO PAINEL SAAS ONLINE: https://alaindaniel.github.io/prospector/
📖 MANUAL RÁPIDO DE USO:
1. Acesse o link acima no seu navegador (Chrome/Edge/Firefox no PC ou celular).
2. Clique no botão "🔑 Ativar Licença" no topo da tela.
3. Cole sua Chave Serial para validar seu plano vitalício/anual.

⚠️ IMPORTANTE PARA LIBERAÇÃO DE SUPORTE E GARANTIA:
Por ser uma licença de software digital de consumo imediato e vinculada exclusivamente ao seu CPF/CNPJ, por favor responda aqui no chat:

👉 "RECEBI MEU ACESSO E CONFIRMO A ATIVAÇÃO DA MINHA LICENÇA"

Assim que você confirmar, seu cadastro é validado e ativamos seu suporte direto com a nossa equipe!
```

---

### CAMADA 2: O Registro de Confirmação para Mediação
Quando o comprador responde *"Recebi meu acesso e confirmo a ativação da minha licença"*:
- Essa mensagem fica gravada no chat oficial do Mercado Livre.
- Se o comprador tentar abrir qualquer reclamação de *"Não recebi o produto"* ou *"Cancelamento"*, a moderação do Mercado Livre analisa o chat, identifica a confissão do próprio comprador e **encerra a disputa imediatamente a favor do vendedor (Alain)**.

---

### CAMADA 3: O Registro Digital no Sistema (Log de Ativação)
Quando o cliente insere a chave no Prospector IA:
- O sistema registra o consumo da chave e carimba o acesso no navegador do cliente.
- Caso o comprador abra disputa, você anexa o print do registro mostrando:
  1. A chave serial ativada.
  2. A confirmação do cliente no chat.
  3. O Termo de Licença Digital Consumida (Art. 49 do Código de Defesa do Consumidor e jurisprudência aplicável a serviços de software e licenças consumidas imediatamente).

---

## 4. GERADOR DE LICENÇAS RÁPIDO PARA O VENDEDOR

Para gerar uma chave única para cada novo comprador, basta rodar no terminal:

```powershell
node scripts/gerar_licenca.js "Nome do Comprador"
```

O script criará a chave no formato:
`PROSP-2026-ML-XXXX-XXXX`
pronta para você colar no chat da venda!
