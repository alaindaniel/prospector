# Camada de Inteligência Artificial — Prospector IA

## 1. Arquitetura da Camada de IA

A camada de IA (`src/ai/AIService.ts` + `src/providers/interfaces/AIProvider.ts`) é totalmente independente do restante da aplicação e expõe cinco operações fundamentais:

1. `analyzeCompany(input)` — Sintetiza a presença digital da empresa com base apenas nos dados coletados.
2. `generateAudit(input)` — Gera auditoria detalhada contendo pontos positivos, problemas encontrados, oportunidades e recomendações.
3. `generateLeadScore(input)` — Calcula pontuação (0–100), prioridade (`ALTA`, `MEDIA`, `BAIXA`), classificação e justificativa.
4. `generateMessage(input)` — Redige abordagem comercial personalizada para o canal selecionado (`EMAIL`, `WHATSAPP`, `INSTAGRAM`).
5. `generateFollowup(input)` — Gera mensagem de acompanhamento contextualizada para leads sem resposta.

## 2. Transparência e Proibição de Alucinação

A camada de IA segue três regras invioláveis:

1. **Não inventar informações sobre empresas**:
   - Se `website`, `rating`, `review_count`, `phone`, `email` ou `instagram` não existirem no cadastro da empresa, permanecem `null` (`Indisponível`). A IA jamais cria URLs fictícias, números de avaliações falsos ou nomes de sócios inexistentes.

2. **Separação Estrita em 3 Camadas Semânticas**:
   Toda análise e auditoria separa explicitamente:
   - **`DADO COLETADO` (`collectedFacts`)**: Fatos objetivos presentes no banco (ex.: `"Site: Indisponível (NULL)"`, `"Avaliação: 4.1 com 18 avaliações"`).
   - **`INFERÊNCIA DA IA` (`aiInferences`)**: Deduções analíticas baseadas exclusivamente nos dados coletados (ex.: `"A ausência de website próprio reduz a captação orgânica de clientes que pesquisam fora de diretórios locais"`).
   - **`RECOMENDAÇÃO` (`recommendations`)**: Ações comerciais ou técnicas sugeridas (ex.: `"Propor criação de Landing Page otimizada para conversão local com botão direto de WhatsApp"`).

3. **Rastreabilidade Completa (`input_data_json`)**:
   - Cada registro salvo em `audits`, `lead_scores`, `messages` e `followups` armazena em `input_data_json` o snapshot exato dos dados utilizados para produzir aquela resposta.

## 3. Provedores Suportados

- **`DeterministicDiagnosticAIProvider` (Padrão Local / Offline)**:
  - Motor analítico determinístico e auditável que avalia os dados reais da empresa sem depender de chave externa para funcionamento local imediato.
- **`OpenAICompatibleAIProvider` (LLM via API)**:
  - Conecta-se a qualquer endpoint compatível com OpenAI/Gemini/Ollama configurado via variáveis de ambiente (`AI_API_URL`, `AI_API_KEY`, `AI_MODEL`), com fallback seguro e validação de schema JSON.
