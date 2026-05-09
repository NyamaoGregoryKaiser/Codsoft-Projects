import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import logger from './logger';

const swaggerDocument = YAML.load(path.resolve(__dirname, '../../docs/api.yaml'));

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  logger.info('Swagger UI available at /api-docs');
};