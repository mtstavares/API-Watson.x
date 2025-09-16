const swaggerJSDoc = require('swagger-jsdoc')

const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'Watson.x API',
            version: '1.0.0',
            description: "API com CRUD em arquivo json para testar IA Watson.x"
        },
        servers: [{url:'http://localhost:3000/api/v1'}],
    },

    apis: ['src/routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;