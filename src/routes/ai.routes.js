const express = require('express')
const { generateText } = require('../services/watson.service')

const { detectIntent } = require('../services/nlp.mapper')
const repo = require('../repositories/item.repository')


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

/**
 * @swagger
 * /ai/assistant:
 *   post:
 *     summary: Interpreta um comando em linguagem natural e executa CRUD
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
 *                 example: "Crie um funcionário com nome 'João Silva', QRA SILVA e RE 200999-1"
 *     responses:
 *       200:
 *         description: Resultado da operação
 */


function withTimeout(promise, ms, onTimeoutValue = null) {
    return Promise.race([
        promise,
        new Promise((resolve) => setTimeout(() => resolve(onTimeoutValue), ms)),
    ]);
}

async function narrarComIA(contexto, objeto) {
    const jsonStr = JSON.stringify(objeto, null, 2).slice(0, 2000); // limita tamanho
    const prompt = `
Você é um assistente que escreve respostas curtas, claras e em português.
Explique em no máximo 2 frases o que ocorreu na operação.
Não repita o JSON; apenas narre o resultado de forma amigável.

Contexto: ${contexto}

JSON do resultado (apenas para você entender, não mostre isso ao usuário):
${jsonStr}
`.trim();

    try {
        // timeout de 2 segundos; se estourar, volta null e usamos fallback
        const out = await withTimeout(
            generateText(prompt, { max_new_tokens: 120, temperature: 0.3 }),
            2000,
            null
        );
        return (out && out.trim()) || null;
    } catch {
        return null;
    }
}


router.post('/assistant', async (req, res, next) => {
    try {
        const { prompt } = req.body || {}
        if (!prompt) return res.status(400).json({ error: "Campo prompt é obrigatório" })

        const parsed = detectIntent(prompt)
        switch (parsed.intent) {
            case 'list': {
                const all = await repo.list();
                const message = await narrarComIA('Listagem de itens do cadastro', { total: all.length });
                return res.json({
                    intent: 'list',
                    message: message || `Encontrei ${all.length} registro(s).`,
                    data: all
                });

            }

            case 'get': {
                if (!parsed.id) return res.status(400).json({ error: 'informe o id' });
                const all = await repo.list();
                const item = all.find(i => i.id === parsed.id);
                if (!item) return res.status(404).json({ error: `Item ${parsed.id} não encontrado.` });

                const message = await narrarComIA(`Consulta do item ${parsed.id}`, item);
                return res.json({
                    intent: 'get',
                    message: message || `Item ${parsed.id} encontrado.`,
                    data: item
                });

            }
            case 'update': {
                if (!parsed.id) return res.status(400).json({ error: 'informe o id' });

                let patch = parsed.fields || {};
                const m = prompt.match(/\{[\s\S]*\}$/);
                if (m) {
                    try { patch = { ...patch, ...JSON.parse(m[0]) }; } catch { }
                }

                if (Object.keys(patch).length === 0) {
                    return res.status(400).json({ error: 'nenhum campo para atualizar foi detectado' });
                }

                const updated = await repo.update(parsed.id, patch);
                if (!updated) return res.status(404).json({ error: `Item ${parsed.id} não encontrado.` });

                const message = await narrarComIA(`Atualização do item ${parsed.id}`, { atualizado: patch, resultado: updated });
                return res.json({
                    intent: 'update',
                    message: message || `Item ${parsed.id} atualizado.`,
                    data: updated
                });

            }
            case 'delete': {
                if (!parsed.id) return res.status(400).json({ error: 'informe o id' });
                const ok = await repo.remove(parsed.id);
                if (!ok) return res.status(404).json({ error: `Item ${parsed.id} não encontrado.` });

                const message = await narrarComIA(`Remoção do item ${parsed.id}`, { removido: parsed.id });
                return res.status(200).json({
                    intent: 'delete',
                    message: message || `Item ${parsed.id} removido.`
                });

            }
            default:
                return res.status(400).json({ error: 'não entendi. Tente: criar, listar, buscar id X, atualizar id X, apagar id X' });
        }
    } catch (error) {
        next(error)
    }
})

router.post('/generate', async (req, res, next) => {
    try {
        const { prompt } = req.body
        if (!prompt) {
            return res.status(400).json({ error: "Campo prompt é obrigatório" })
        }

        const output = await generateText(prompt)
        res.json({ output })
    } catch (error) {
        next(error)
    }
})

module.exports = router