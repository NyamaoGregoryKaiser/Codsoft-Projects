```javascript
const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./config');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ECM CMS API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Enterprise Content Management System backend.',
      contact: {
        name: 'AI Developer',
        url: 'https://example.com',
        email: 'info@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}/api/v1`,
        description: 'Development Server',
      },
      {
        url: 'https://api.yourdomain.com/api/v1',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter the JWT token obtained from login (e.g., "Bearer eyJhbGci...")',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['user', 'author', 'editor', 'admin'] },
            isEmailVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          example: {
            id: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
            username: 'johndoe',
            email: 'john.doe@example.com',
            role: 'author',
            isEmailVerified: true,
            createdAt: '2023-10-26T10:00:00.000Z',
            updatedAt: '2023-10-26T10:00:00.000Z',
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          example: {
            id: 'c290f1ee-6c54-4b01-90e6-d701748f0851',
            name: 'Technology',
            slug: 'technology',
            description: 'Articles about tech.',
            createdAt: '2023-10-26T10:00:00.000Z',
            updatedAt: '2023-10-26T10:00:00.000Z',
          },
        },
        Post: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            slug: { type: 'string' },
            content: { type: 'string' },
            excerpt: { type: 'string', nullable: true },
            featuredImage: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['draft', 'published', 'archived'] },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
            authorId: { type: 'string', format: 'uuid', nullable: true },
            categoryId: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            author: { '$ref': '#/components/schemas/User' }, // Joined author info
            category: { '$ref': '#/components/schemas/Category' }, // Joined category info
          },
          example: {
            id: 'p290f1ee-6c54-4b01-90e6-d701748f0851',
            title: 'My First Blog Post',
            slug: 'my-first-blog-post',
            content: 'This is the content of my first blog post.',
            excerpt: 'A short summary.',
            featuredImage: '/uploads/posts/featured-image-123.jpg',
            status: 'published',
            publishedAt: '2023-10-26T10:30:00.000Z',
            authorId: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
            categoryId: 'c290f1ee-6c54-4b01-90e6-d701748f0851',
            createdAt: '2023-10-26T10:00:00.000Z',
            updatedAt: '2023-10-26T10:00:00.000Z',
          },
        },
        Media: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            filename: { type: 'string' },
            originalName: { type: 'string' },
            mimeType: { type: 'string' },
            size: { type: 'integer' },
            path: { type: 'string' },
            uploadedBy: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          example: {
            id: 'm290f1ee-6c54-4b01-90e6-d701748f0851',
            filename: 'my_image_12345.jpg',
            originalName: 'image.jpg',
            mimeType: 'image/jpeg',
            size: 102400,
            path: '/uploads/media/my_image_12345.jpg',
            uploadedBy: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
            createdAt: '2023-10-26T10:00:00.000Z',
            updatedAt: '2023-10-26T10:00:00.000Z',
          },
        },
      },
    },
  },
  apis: ['./server/src/routes/*.js'], // Path to the API routes files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
```