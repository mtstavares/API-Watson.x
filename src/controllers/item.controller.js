const repo = require('../repositories/item.repository')

async function list(req, res, next) {
    try {
        const items = await repo.list()
        res.json(items)
    } catch (error) {
        next(error)
    }
}

async function getOne(req, res, next) {
    try {
        const id = Number(req.params.id)
        if (Number.isNaN(id)) return res.status(400).json({error: "ID Inválido"})

        const items = await repo.list()
        const item = items.find(i => i.id === id)

        if(!item) return res.status(404).json({error: "Item não encontrado"})
            
        res.json(item)
    } catch (error) {
        next(error)
    }
}

async function create(req, res, next) {
    try {
        const payload = req.body || {}
        if(Object.keys(payload).length === 0) {
            return res.status(400).json({error: "Dados inválidos"})
        }

        const item = await repo.create(payload)
        return res.status(201).json(item)
    } catch (error) {
        next(error)
    }
}

async function update(req, res, next) {
    try {
        const id = Number(req.params.id)
        if(Number.isNaN(id)) return res.status(400).json({error: "ID inválido"})

        const partial = req.body || {}
        const updated = await repo.update(id, partial)

        if (!updated) return res.status(404).json({error:'Item não encontrado'})
        res.json(updated)
    } catch (error) {
        next(error)
    }
}

async function remove(req, res, next) {
    try {
        const id = Number(req.params.id)
        if (Number.isNaN(id)) return res.status(400).json({error: "ID inválido"})

        const ok = await repo.remove(id)
        
        if (!ok) return res.status(404).json({error: "Item não encontrado"})
        res.status(204).send()
    } catch (error) {
        next(error) 
    }
}

module.exports = {list, getOne, create, update, remove}