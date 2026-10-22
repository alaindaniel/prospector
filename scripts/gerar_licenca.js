/**
 * Prospector IA — Gerador de Licenças SaaS para Vendas no Mercado Livre
 * Uso: node scripts/gerar_licenca.js "Nome do Comprador"
 */

const crypto = require('crypto');

const buyerName = process.argv[2] || 'Cliente Mercado Livre';
const timestamp = Date.now().toString(36).toUpperCase();
const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();

const licenseKey = `PROSP-2026-ML-${timestamp.slice(-4)}-${randomBytes.slice(-4)}`;

console.log('======================================================');
console.log('⚡ PROSPECTOR IA — LICENÇA SAAS GERADA COM SUCESSO');
console.log('======================================================');
console.log(`👤 Comprador:   ${buyerName}`);
console.log(`🔑 Chave Única: ${licenseKey}`);
console.log(`🌐 Acesso SaaS: https://alaindaniel.github.io/prospector/`);
console.log(`📅 Data:        ${new Date().toLocaleString('pt-BR')}`);
console.log('======================================================');
console.log('\n📋 MENSAGEM PRONTA PARA COLAR NO CHAT DO MERCADO LIVRE:\n');
console.log(`Olá, ${buyerName}! Parabéns pela sua aquisição do PROSPECTOR IA 2026 SaaS Pro! ⚡

Seu acesso exclusivo já foi provisionado:

🔑 SUA CHAVE SERIAL DE ATIVAÇÃO: ${licenseKey}
🌐 LINK DO PAINEL SAAS ONLINE: https://alaindaniel.github.io/prospector/

📖 COMO COMEÇAR:
1. Acesse o link acima no seu navegador (computador ou celular).
2. Clique no botão "🔑 Ativar Licença" no topo direito.
3. Cole sua chave para liberar todos os recursos vitalícios!

⚠️ IMPORTANTE PARA LIBERAÇÃO DE SUPORTE:
Por ser uma licença digital com chave de ativação exclusiva, por favor responda aqui no chat:
👉 "RECEBI MEU ACESSO E CONFIRMO A ATIVAÇÃO DA MINHA LICENÇA"

Assim que você confirmar, ativamos sua garantia e liberamos nosso canal de suporte prioritário!`);
console.log('======================================================\n');
