import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from './env';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Secure API Documentation',
      version: '1.0.0',
      description: 'This is a secure API application made with Express and documented with Swagger',
      contact: {
        name: 'Your Name',
        url: 'https://yourwebsite.com',
        email: 'your_email@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.port}/api/v1`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/models/swagger.yaml'], // Path to the API docs
};

export const swaggerDocs = swaggerJsdoc(swaggerOptions);
export { swaggerUi };