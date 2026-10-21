import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { createApiRouter } from './routes';

export function createApp(customDb?: import('node:sqlite').DatabaseSync): express.Application {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Router
  app.use('/api', createApiRouter(customDb));

  // Servir assets do frontend
  const frontendPath = path.resolve(__dirname, '../../src/frontend');
  app.use(express.static(frontendPath));

  // Fallback SPA para a interface web
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  return app;
}
