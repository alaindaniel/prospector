import crypto from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Utilitário central de segurança:
 * - Nunca armazena senhas em texto puro (usa scrypt com salt criptográfico).
 * - Nunca embute tokens diretamente no código (lê via variáveis de ambiente).
 * - Mascara credenciais antes de exibir na UI ou gravar em logs.
 */
export class SecurityService {
  /**
   * Gera hash irreversível de senha usando scrypt + salt aleatório.
   */
  static hashPassword(plainPassword: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
    return `scrypt$${salt}$${derivedKey}`;
  }

  /**
   * Verifica senha contra um hash scrypt em tempo constante.
   */
  static verifyPassword(plainPassword: string, storedHash: string): boolean {
    const parts = storedHash.split('$');
    if (parts.length !== 3 || parts[0] !== 'scrypt') {
      return false;
    }
    const [, salt, keyHex] = parts;
    const derivedBuffer = crypto.scryptSync(plainPassword, salt, 64);
    const keyBuffer = Buffer.from(keyHex, 'hex');
    if (derivedBuffer.length !== keyBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(derivedBuffer, keyBuffer);
  }

  /**
   * Mascara um segredo/token para exibição segura na interface ou nos logs.
   */
  static maskSecret(secret: string | null | undefined): string {
    if (!secret || secret.trim().length === 0) {
      return 'NÃO_CONFIGURADO';
    }
    const clean = secret.trim();
    if (clean.length <= 6) {
      return '******';
    }
    return `${clean.slice(0, 3)}****************${clean.slice(-3)}`;
  }

  /**
   * Obtém configuração de ambiente sem expor tokens hardcoded.
   */
  static getEnvConfig() {
    return {
      port: Number(process.env.PORT || 3000),
      nodeEnv: process.env.NODE_ENV || 'development',
      dbPath: process.env.DB_PATH || './data/prospector.sqlite',
      aiProvider: process.env.AI_PROVIDER || 'deterministic',
      aiApiUrl: process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions',
      aiApiKeyConfigured: Boolean(process.env.AI_API_KEY && process.env.AI_API_KEY.trim().length > 0),
      aiModel: process.env.AI_MODEL || 'gpt-4o-mini',
      aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS || 15000),
      emailProvider: process.env.EMAIL_PROVIDER || 'sandbox',
      whatsappProvider: process.env.WHATSAPP_PROVIDER || 'sandbox',
      companyDataProvider: process.env.COMPANY_DATA_PROVIDER || 'local_catalog',
    };
  }
}
