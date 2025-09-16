const { write } = require('fs')
const fs = require('fs/promises')
const path = require('path')

const DB_PATH = path.join(__dirname, '../../db/data.json')

async function list() {
    try {
        const raw = await fs.readFile(DB_PATH, 'utf-8')
        const data = JSON.parse(raw)

        return Array.isArray(data) ? data : []
    } catch (error) {
        if(error.code === 'ENOENT') return[]
        throw error
    }
}

async function writeAll(data) {
    const json = JSON.stringify(data, null, 2)
    await fs.writeFile(DB_PATH, json, 'utf-8')
}

async function create(payload) {
    const all = await list()
    const nextId = all.length ? Math.max(...all.map(i => i.id || 0)) +1 : 1
    const now = new Date().toISOString()


    const item = {
        id: nextId,
        ...payload,
        createdAt: now,
        updatedAt: now,
    }

    all.push(item)
    await writeAll(all)
    return item
}

async function update(id, partial) {
    const all = await list()
    const idx = all.findIndex(i => i.id === id)
    if (idx === -1) return null

    const now = new Date().toISOString()
    const current = all[idx]

    const updated = {
        ...current,
        ...partial,
        id: current.id,
        updatedAt: now
    }

    all[idx] = updated
    await writeAll(all)
    return updated
}

async function remove(id) {
    const all = await list()
    const idx = all.findIndex(i => i.id === id)

    if (idx === -1) return false

    all.splice(idx, 1)
    await writeAll(all)
    return true
}

module.exports = {list, writeAll, create, update, remove}