require('dotenv').config(); 

if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
const app = require('./app')

const PORT = 3000

app.listen(PORT, () => {
    console.log(`Servidor escutando na porta ${PORT}`)
})

