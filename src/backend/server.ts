import { createApp } from './app';
import { DatabaseManager } from '../database/connection';
import { SecurityService } from '../security/security';
import { AutomationCoordinator } from '../automations/AutomationCoordinator';
import { LogService } from '../services/LogService';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { runSeed } from '../database/seed';

async function bootstrap() {
  const config = SecurityService.getEnvConfig();
  console.log(`[Prospector IA] Inicializando servidor no ambiente "${config.nodeEnv}"...`);

  // 1. Inicializa Provedores
  ProviderRegistry.initialize();

  // 2. Conecta ao Banco de Dados e Garante o Schema
  const db = DatabaseManager.getConnection(config.dbPath);
  const logService = new LogService(db);

  // 3. Recuperação de Tarefas Interrompidas (Crash Recovery)
  const coordinator = new AutomationCoordinator(db);
  const recoveredCount = coordinator.getEngine().recoverStuckJobs();
  if (recoveredCount > 0) {
    console.log(`[Prospector IA] ${recoveredCount} jobs interrompidos foram recuperados com sucesso.`);
  }

  // 4. Se o banco estiver vazio, não força seed automático (deixa limpo para o usuário)
  // Seed de demonstração pode ser executado manualmente via npm run seed
  const countRow = db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number };
  console.log(`[Prospector IA] Total de empresas no banco: ${countRow.count}`);

  // 5. Inicia Servidor HTTP
  const app = createApp();
  const server = app.listen(config.port, () => {
    logService.info('SYSTEM', 'SERVER_STARTED', `Servidor iniciado na porta ${config.port}`);
    console.log(`=======================================================`);
    console.log(`🚀 Prospector IA - Servidor Operacional`);
    console.log(`   URL: http://localhost:${config.port}`);
    console.log(`   Banco de Dados: ${config.dbPath}`);
    console.log(`   Provedor de IA: ${config.aiProvider}`);
    console.log(`   Fase: 1 (Aprovações Humanas sem envio externo)`);
    console.log(`=======================================================`);
  });

  // Encerramento Gracioso
  const gracefulShutdown = () => {
    console.log('\n[Prospector IA] Encerrando servidor graciosamente...');
    server.close(() => {
      DatabaseManager.closeConnection();
      console.log('[Prospector IA] Conexão com banco fechada. Finalizado.');
      process.exit(0);
    });
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

bootstrap().catch((err) => {
  console.error('[Prospector IA] Falha fatal na inicialização:', err);
  process.exit(1);
});
