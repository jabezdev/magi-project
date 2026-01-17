import express from 'express'
import { settingsStore } from '../lib/settings_store.mjs'

const router = express.Router()

// GET /api/settings
router.get('/', (req, res) => {
    try {
        res.json(settingsStore.get())
    } catch (e) {
        console.error('Failed to get settings:', e)
        res.status(500).json({ error: e.message })
    }
})

// PATCH /api/settings
router.patch('/', (req, res) => {
    try {
        const updated = settingsStore.update(req.body)
        res.json(updated)
    } catch (e) {
        console.error('Failed to update settings:', e)
        res.status(500).json({ error: e.message })
    }
})

export default router
