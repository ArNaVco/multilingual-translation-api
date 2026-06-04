const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IT4T Multilingual Translation API',
      version: '1.0.0',
      description: 'API for translating JSON language files into multiple languages',
      contact: {
        name: 'IT4T Solutions',
        email: 'support@it4t.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key'
        }
      }
    },
    security: [{ ApiKeyAuth: [] }]
  },
  apis: ['./routes/*.js']
};

module.exports = swaggerJSDoc(options);