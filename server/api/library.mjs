import express from 'express'
import { libraryStore } from '../lib/library_store.mjs'

const router = express.Router()

// GET /api/library
// List all items, optionally filtered by type
router.get('/', (req, res) => {
    try {
        const { type } = req.query
        const items = libraryStore.list(type)
        res.json(items)
    } catch (e) {
        console.error('Failed to list library:', e)
        res.status(500).json({ error: e.message })
    }
})

// GET /api/library/:id
// Get a specific item
router.get('/:id', (req, res) => {
    try {
        const item = libraryStore.get(req.params.id)
        if (!item) return res.status(404).json({ error: 'Item not found' })
        res.json(item)
    } catch (e) {
        console.error('Failed to get item:', e)
        res.status(500).json({ error: e.message })
    }
})

// POST /api/library
// Create a new item
router.post('/', (req, res) => {
    try {
        const newItem = libraryStore.create(
            req.body,
            req.headers['x-user-id'] || 'System', // Example auth header
            req.headers['x-device-id'] || 'server'
        )
        res.json(newItem)
    } catch (e) {
        console.error('Failed to create item:', e)
        res.status(500).json({ error: e.message })
    }
})

// PUT /api/library/:id
// Update an item
router.put('/:id', (req, res) => {
    try {
        const updatedItem = libraryStore.update(
            req.params.id,
            req.body,
            req.headers['x-user-id'] || 'System',
            req.headers['x-device-id'] || 'server',
            req.body.change_summary || 'Updated via API'
        )
        res.json(updatedItem)
    } catch (e) {
        console.error('Failed to update item:', e)
        res.status(500).json({ error: e.message })
    }
})

// DELETE /api/library/:id
// Soft delete an item
router.delete('/:id', (req, res) => {
    try {
        const result = libraryStore.delete(
            req.params.id,
            req.headers['x-user-id'] || 'System',
            req.headers['x-device-id'] || 'server',
        )
        res.json({ success: true, id: result.id })
    } catch (e) {
        console.error('Failed to delete item:', e)
        res.status(500).json({ error: e.message })
    }
})

// GET /api/library/:id/history
// Get history log
router.get('/:id/history', (req, res) => {
    try {
        const history = libraryStore.getHistory(req.params.id)
        res.json(history)
    } catch (e) {
        console.error('Failed to get history:', e)
        res.status(500).json({ error: e.message })
    }
})

// POST /api/library/:id/revert
// Revert to a specific commit
router.post('/:id/revert', (req, res) => {
    try {
        const { commit_id } = req.body
        if (!commit_id) return res.status(400).json({ error: 'commit_id is required' })

        // 1. Get history to find the snapshot
        const history = libraryStore.getHistory(req.params.id)
        const commit = history.find(h => h.commit_id === commit_id)

        if (!commit) return res.status(404).json({ error: 'Commit not found' })

        // 2. Perform "Forward Revert" using update logic
        // We use the snapshot data as the "delta", effectively overwriting the current state
        // and force undelete if the snapshot wasn't deleted
        const delta = { ...commit.full_snapshot }
        if (!delta.is_deleted) {
            delta.is_deleted = false
        }

        const revertedItem = libraryStore.update(
            req.params.id,
            delta,
            req.headers['x-user-id'] || 'System',
            req.headers['x-device-id'] || 'server',
            `Reverted to commit ${commit.version_number} (${commit_id})`
        )

        res.json(revertedItem)
    } catch (e) {
        console.error('Failed to revert item:', e)
        res.status(500).json({ error: e.message })
    }
})

export default router
