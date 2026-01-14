import { Router } from 'express'
import fs from 'fs'
import { join } from 'path'
import { connectedClients, sharedState } from '../state.mjs'

export function settingsRoutes(publicDir) {
    const router = Router()

    router.get('/config', (req, res) => {
        res.json({
            appTitle: 'MAGI Church Projection System',
            screens: ['control-panel', 'main-projection', 'confidence-monitor'],
            version: '2.0.0'
        })
    })

    router.get('/state', (req, res) => {
        res.json({
            ...sharedState,
            connectedClients: connectedClients.size
        })
    })

    router.get('/settings', (req, res) => {
        try {
            const settingsPath = join(publicDir, 'settings.json')
            if (fs.existsSync(settingsPath)) {
                res.json(JSON.parse(fs.readFileSync(settingsPath, 'utf-8')))
            } else {
                res.json({})
            }
        } catch (error) {
            console.error('Failed to get settings:', error)
            res.status(500).json({ error: 'Failed to get settings' })
        }
    })

    router.post('/settings', (req, res) => {
        try {
            const settingsPath = join(publicDir, 'settings.json')
            let existing = {}
            if (fs.existsSync(settingsPath)) {
                existing = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
            }
            const merged = { ...existing, ...req.body }
            fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2))
            res.json({ success: true })
        } catch (error) {
            console.error('Failed to save settings:', error)
            res.status(500).json({ error: 'Failed to save settings' })
        }
    })

    return router
}
