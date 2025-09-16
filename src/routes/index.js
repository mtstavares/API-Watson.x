const express = require('express')
const itemRoutes = require('./item.routes')
const aiRoutes = require('./ai.routes'); 

const router = express.Router()

router.use('/items', itemRoutes)
router.use('/ai', aiRoutes) 

module.exports = router