const express = require('express')
const { generateText } = require('../services/watson.service')

const { detectIntent, getDeep } = require('../services/nlp.mapper')
const repo = require('../repositories/item.repository')


const router = express.Router()


async function replyNatural(res, { intent, context, data = null, fallback, status = 200 }) {
    let message = null;
    if (typeof narrarComIA === 'function') {
        message = await narrarComIA(context, data ?? {});
    }
    return res.status(status).json({
        intent,
        message: message || fallback,
        ...(data !== undefined ? { data } : {})
    });
}



function setDeep(obj, path, value) {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length; i++) {
        const key = parts[i];
        if (i === parts.length - 1) {
            cur[key] = value;
        } else {
            cur[key] = cur[key] || {};
            cur = cur[key];
        }
    }
    return obj;
}



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
        console.log('[AI/ASSISTANT][DEBUG]', JSON.stringify({ prompt, parsed }, null, 2));
        switch (parsed.intent) {
            case 'search': {
                const { field, value } = parsed.query || {};
                if (!field || !value) return res.status(400).json({ error: 'consulta inválida' });

                const all = await repo.list();
                const exactFields = new Set(['re', 'cpf', 'documentos.rg', 'codigoOpm']);
                const isExact = exactFields.has(field);
                const valNorm = value.toString().toLowerCase();

                const filtered = all.filter(item => {
                    const v = getDeep(item, field);
                    if (v == null) return false;
                    const s = v.toString().toLowerCase();
                    return isExact ? s === valNorm : s.includes(valNorm);
                });

                return replyNatural(res, {
                    intent: 'search',
                    context: `Busca por ${field} contendo "${value}"`,
                    data: filtered,
                    fallback: `Encontrei ${filtered.length} resultado(s) para ${field} ~ "${value}".`
                });
            }


            case 'select': {
                const { section, query } = parsed;
                if (!section || !query) return res.status(400).json({ error: 'seção ou filtro inválido' });

                const all = await repo.list();
                const exactFields = new Set(['re', 'cpf', 'documentos.rg', 'codigoOpm']);
                const isExact = exactFields.has(query.field);
                const valNorm = query.value.toString().toLowerCase();

                const filtered = all.filter(item => {
                    const v = getDeep(item, query.field);
                    if (v == null) return false;
                    const s = v.toString().toLowerCase();
                    return isExact ? s === valNorm : s.includes(valNorm);
                });

                if (filtered.length === 0)
                    return res.status(404).json({ error: `Nenhum registro encontrado para ${query.field}="${query.value}"` });
                if (filtered.length > 1)
                    return res.status(409).json({ error: `Filtro ambíguo: ${filtered.length} registros encontrados. Refine a consulta.` });

                const picked = getDeep(filtered[0], section);

                return replyNatural(res, {
                    intent: 'select',
                    context: `Consulta da seção ${section} do registro filtrado por ${query.field}="${query.value}"`,
                    data: picked,
                    fallback: `Resultado para ${section}.`
                });
            }


            case 'list': {
                const all = await repo.list();
                return replyNatural(res, {
                    intent: 'list',
                    context: 'Listagem de funcionários',
                    data: all,
                    fallback: `Encontrei ${all.length} registro(s).`
                });
            }

            case 'get': {
                if (!parsed.id) return res.status(400).json({ error: 'informe o id' });
                const all = await repo.list();
                const item = all.find(i => i.id === parsed.id);
                if (!item) return res.status(404).json({ error: `Item ${parsed.id} não encontrado.` });

                return replyNatural(res, {
                    intent: 'get',
                    context: `Consulta do item ${parsed.id}`,
                    data: item,
                    fallback: `Item ${parsed.id} encontrado.`
                });
            }

            case 'update': {
                const { id, fields, updateTarget, query } = parsed;

                // 1) por filtro + alvo
                if (updateTarget && query) {
                    const all = await repo.list();
                    const exactFields = new Set(['re', 'cpf', 'documentos.rg', 'codigoOpm']);
                    const isExact = exactFields.has(query.field);
                    const valNorm = query.value.toString().toLowerCase();

                    const matches = all.filter(item => {
                        const v = getDeep(item, query.field);
                        if (v == null) return false;
                        const s = v.toString().toLowerCase();
                        return isExact ? s === valNorm : s.includes(valNorm);
                    });

                    if (matches.length === 0)
                        return res.status(404).json({ error: `Nenhum registro encontrado para ${query.field} ~ "${query.value}"` });
                    if (matches.length > 1)
                        return res.status(409).json({ error: `Filtro ambíguo: ${matches.length} registros encontrados. Refine a consulta.` });

                    const target = matches[0];
                    const patch = setDeep({}, updateTarget.path, updateTarget.value);
                    const updated = await repo.update(target.id, patch);
                    if (!updated) return res.status(404).json({ error: `Item ${target.id} não encontrado.` });

                    return replyNatural(res, {
                        intent: 'update',
                        context: `Atualização por filtro (${query.field} ~ "${query.value}")`,
                        data: { id: target.id, atualizado: patch, resultado: updated },
                        fallback: `Item ${target.id} atualizado.`
                    });
                }

                // 2) por id (fallback)
                if (id) {
                    let patch = fields || {};
                    const m = prompt.match(/\{[\s\S]*\}$/);
                    if (m) { try { patch = { ...patch, ...JSON.parse(m[0]) }; } catch { } }
                    if (Object.keys(patch).length === 0)
                        return res.status(400).json({ error: 'nenhum campo para atualizar foi detectado' });

                    const updated = await repo.update(id, patch);
                    if (!updated) return res.status(404).json({ error: `Item ${id} não encontrado.` });

                    return replyNatural(res, {
                        intent: 'update',
                        context: `Atualização do item ${id}`,
                        data: { atualizado: patch, resultado: updated },
                        fallback: `Item ${id} atualizado.`
                    });
                }

                return res.status(400).json({ error: 'informe o id OU um filtro (ex.: "qra TESTE") e o alvo (ex.: "atualize o re ... para ...")' });
            }



            case 'delete': {
                if (!parsed.id) return res.status(400).json({ error: 'informe o id' });
                const ok = await repo.remove(parsed.id);
                if (!ok) return res.status(404).json({ error: `Item ${parsed.id} não encontrado.` });

                return replyNatural(res, {
                    intent: 'delete',
                    context: `Remoção do item ${parsed.id}`,
                    data: { id: parsed.id },
                    fallback: `Item ${parsed.id} removido.`
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