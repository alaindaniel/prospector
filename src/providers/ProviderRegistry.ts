import { CompanyDataProvider } from './interfaces/CompanyDataProvider';
import { AIProvider } from './interfaces/AIProvider';
import { EmailProvider } from './interfaces/EmailProvider';
import { WhatsAppProvider } from './interfaces/WhatsAppProvider';
import { LocalCatalogCompanyDataProvider } from './implementations/LocalCatalogCompanyDataProvider';
import { DeterministicDiagnosticAIProvider } from './implementations/DeterministicDiagnosticAIProvider';
import { OpenAICompatibleAIProvider } from './implementations/OpenAICompatibleAIProvider';
import { SandboxEmailProvider } from './implementations/SandboxEmailProvider';
import { SandboxWhatsAppProvider } from './implementations/SandboxWhatsAppProvider';
import { SecurityService } from '../security/security';
import { IntegrationConnectionManifest } from '../types/models';

export class ProviderRegistry {
  private static companyDataProvider: CompanyDataProvider = new LocalCatalogCompanyDataProvider();
  private static aiProvider: AIProvider = new DeterministicDiagnosticAIProvider();
  private static emailProvider: EmailProvider = new SandboxEmailProvider();
  private static whatsAppProvider: WhatsAppProvider = new SandboxWhatsAppProvider();

  static initialize(): void {
    const config = SecurityService.getEnvConfig();
    if (config.aiProvider === 'openai_compatible' || config.aiApiKeyConfigured) {
      this.aiProvider = new OpenAICompatibleAIProvider();
    } else {
      this.aiProvider = new DeterministicDiagnosticAIProvider();
    }
    this.companyDataProvider = new LocalCatalogCompanyDataProvider();
    this.emailProvider = new SandboxEmailProvider();
    this.whatsAppProvider = new SandboxWhatsAppProvider();
  }

  static getCompanyDataProvider(): CompanyDataProvider {
    return this.companyDataProvider;
  }

  static setCompanyDataProvider(provider: CompanyDataProvider): void {
    this.companyDataProvider = provider;
  }

  static getAIProvider(): AIProvider {
    return this.aiProvider;
  }

  static setAIProvider(provider: AIProvider): void {
    this.aiProvider = provider;
  }

  static getEmailProvider(): EmailProvider {
    return this.emailProvider;
  }

  static getWhatsAppProvider(): WhatsAppProvider {
    return this.whatsAppProvider;
  }

  static getAllConnectionManifests(): IntegrationConnectionManifest[] {
    return [
      this.companyDataProvider.getConnectionManifest(),
      this.aiProvider.getConnectionManifest(),
      this.emailProvider.getConnectionManifest(),
      this.whatsAppProvider.getConnectionManifest(),
    ];
  }
}
