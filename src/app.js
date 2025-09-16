const express = require('express')
const cors = require('cors')
const helmet = require('helmet')


const app = express()

// Middlewares
app.use(cors())
app.use(helmet())
app.use(express.json())

// swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger'); // <- sem chaves

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// montando de forma canônica (serve + setup juntos)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));


// rota para verificar saude api
app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})

// routes
const routes = require('./routes')
app.use('/api/v1', routes)


module.exports = app