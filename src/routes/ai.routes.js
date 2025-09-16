const express = require('express')
const { generateText } = require('../services/watson.service')

const router = express.Router()

/**
 * @swagger
 * /ai/generate:
 *   post:
 *     summary: Gera texto usando Watsonx.ai
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *                 example: "Resuma a importância da segurança da informação"
 *     responses:
 *       200:
 *         description: Texto gerado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 output:
 *                   type: string
 */

router.post('/generate', async (req, res, next) => {
    try {
        const {prompt} = req.body
        if(!prompt) {
            return res.status(400).json({error: "Campo prompt é obrigatório"})
        }

        const output = await generateText(prompt)
        res.json({output})
    } catch (error) {
        next(error)
    }
})

module.exports = router