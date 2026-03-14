```javascript
/**
 * @file Configures Swagger/OpenAPI documentation.
 * @module config/swagger
 */

const swaggerJSDoc = require('swagger-jsdoc');
const config = require('./index');

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Real-time Chat Application API',
        version: '1.0.0',
        description: 'This is the API documentation for the Real-time Chat Application. It covers authentication, user management, chat room operations, and message handling.',
        contact: {
            name: 'Support Team',
            email: 'support@example.com'
        },
    },
    servers: [
        {
            url: config.serverUrl,
            description: 'Development Server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter your JWT Bearer token in the format: `Bearer {token}`',
            },
        },
        schemas: {
            // Reusable schema for user output (excluding password)
            UserOutput: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' },
                    username: { type: 'string', example: 'testuser' },
                    email: { type: 'string', format: 'email', example: 'test@example.com' },
                    status: { type: 'string', enum: ['online', 'offline', 'away'], example: 'online' },
                    lastSeen: { type: 'string', format: 'date-time', example: '2023-10-27T10:00:00Z' },
                    createdAt: { type: 'string', format: 'date-time', example: '2023-10-27T09:00:00Z' },
                    updatedAt: { type: 'string', format: 'date-time', example: '2023-10-27T10:00:00Z' },
                },
                required: ['id', 'username', 'email', 'status', 'createdAt', 'updatedAt'],
            },
            // Reusable schema for room output
            RoomOutput: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
                    name: { type: 'string', example: 'General Chat' },
                    description: { type: 'string', example: 'A public room for general discussion' },
                    isPrivate: { type: 'boolean', example: false },
                    creatorId: { type: 'string', format: 'uuid', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' },
                    createdAt: { type: 'string', format: 'date-time', example: '2023-10-27T09:00:00Z' },
                    updatedAt: { type: 'string', format: 'date-time', example: '2023-10-27T10:00:00Z' },
                    members: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', format: 'uuid' },
                                username: { type: 'string' },
                                status: { type: 'string', enum: ['online', 'offline', 'away'] },
                            }
                        },
                        description: 'List of users who are members of this room.'
                    }
                },
                required: ['id', 'name', 'isPrivate', 'createdAt', 'updatedAt'],
            },
            // Reusable schema for message output
            MessageOutput: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid', example: 'b1c2d3e4-f5a6-7890-1234-567890abcdef' },
                    content: { type: 'string', example: 'Hello everyone!' },
                    senderId: { type: 'string', format: 'uuid', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' },
                    roomId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
                    createdAt: { type: 'string', format: 'date-time', example: '2023-10-27T10:05:00Z' },
                    updatedAt: { type: 'string', format: 'date-time', example: '2023-10-27T10:05:00Z' },
                    sender: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            username: { type: 'string' }
                        },
                        description: 'Details of the message sender.'
                    }
                },
                required: ['id', 'content', 'senderId', 'roomId', 'createdAt', 'updatedAt'],
            },
        },
        responses: {
            BadRequest: {
                description: 'Bad Request - Invalid input data',
                content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string', example: 'Validation error: "username" must be alphanumeric.' } } } } },
            },
            Unauthorized: {
                description: 'Unauthorized - Missing or invalid authentication token',
                content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string', example: 'Not authorized, token failed.' } } } } },
            },
            Forbidden: {
                description: 'Forbidden - User does not have permission to access this resource',
                content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string', example: 'You are not authorized to update this room.' } } } } },
            },
            NotFound: {
                description: 'Not Found - Resource not found',
                content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string', example: 'Room not found.' } } } } },
            },
            Conflict: {
                description: 'Conflict - Resource already exists (e.g., duplicate username/email)',
                content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string', example: 'User with this email already exists.' } } } } },
            },
            ServerError: {
                description: 'Internal Server Error - Something went wrong on the server',
                content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string', example: 'Failed to process your request.' } } } } },
            },
        },
    },
    security: [
        {
            bearerAuth: []
        }
    ]
};

const options = {
    swaggerDefinition,
    // Path to the API docs (routes and models)
    apis: ['./src/routes/*.js', './src/models/*.js'], // Scan routes for JSDoc comments
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
```