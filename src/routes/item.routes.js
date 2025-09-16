const express = require('express')
const controller = require('../controllers/item.controller')

const router = express.Router()

/**
 * @swagger
 * /items:
 *   get:
 *     summary: Lista todos os itens dentro da API
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: Lista de todos os itens
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   nomeCompleto:
 *                     type: string
 *                     example: teste
 */


router.get('/', controller.list)

/**
 * @swagger
 * /items/{id}:
 *   get:
 *     summary: Busca um item pelo seu ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do item a ser buscado
 *     responses:
 *       200:
 *         description: Item encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 nomeCompleto:
 *                   type: string
 *                   example: teste
 *       404:
 *         description: Item não encontrado
 */

router.get('/:id', controller.getOne)

/**
 * @swagger
 * /items:
 *   post:
 *     summary: Cria um novo item na API
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomeCompleto:
 *                 type: string
 *                 example: fulano tal
 *               qra:
 *                 type: string
 *                 example: FULANO
 *               re:
 *                 type: string
 *                 example: 200999-1 (Sempre mantendo esse padrão)
 *     responses:
 *       201:
 *         description: Item criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 2
 *                 nomeCompleto:
 *                   type: string
 *                   example: fulano tal
 *                 qra:
 *                   type: string
 *                   example: FULANO
 *                 re:
 *                   type: string
 *                   example: 200999-1
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 */

router.post('/', controller.create)

/**
 * @swagger
 * /items/{id}:
 *   put:
 *     summary: Atualiza um item existente (parcial ou total)
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do item a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomeCompleto:
 *                 type: string
 *                 example: fulano atualizado
 *               qra:
 *                 type: string
 *                 example: ATUALIZADO
 *               re:
 *                 type: string
 *                 example: 200286-0
 *     responses:
 *       200:
 *         description: Item atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nomeCompleto:
 *                   type: string
 *                 qra:
 *                   type: string
 *                 re:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Item não encontrado
 */

router.put('/:id', controller.update)
/**
 * @swagger
 * /items/{id}:
 *   delete:
 *     summary: Remove um item pelo ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do item a ser removido
 *     responses:
 *       204:
 *         description: Item removido com sucesso (sem corpo)
 *       404:
 *         description: Item não encontrado
 */

router.delete('/:id', controller.remove)


module.exports = router