import { Router } from 'express'
import fs from 'fs'
import { join } from 'path'
import { sharedState } from '../state.mjs'
import { Scanners } from '../scanners.mjs'
import { sanitizeFilename } from './utils.mjs'

export function scripturesRoutes(dataDir) {
    const router = Router()
    const scripturesDir = join(dataDir, 'scriptures')

    // Helper to refresh state
    const refreshScriptures = () => {
        try {
            const items = Scanners.scanScriptures(dataDir)
            sharedState.availableScriptures = items
            return items
        } catch (e) {
            console.error('Failed to refresh scriptures:', e)
            return []
        }
    }

    // List all scriptures
    router.get('/', (req, res) => {
        try {
            // Scanners already returns the list logic
            // But we can also return full content? No, list is usually metadata.
            // Scanners returns metadata.
            const items = Scanners.scanScriptures(dataDir)
            res.json(items)
        } catch (e) {
            res.status(500).json({ error: 'Failed to list scriptures' })
        }
    })

    // Refresh
    router.post('/refresh', (req, res) => {
        const items = refreshScriptures()
        res.json(items)
    })

    // Get specific scripture version content
    router.get('/:id', (req, res) => {
        try {
            const id = req.params.id
            // Scanner uses filename as ID usually or explicit ID
            // Logic in scanner: id = content.id || filename
            // We need to find the file.
            const files = fs.readdirSync(scripturesDir)
            // Simplistic match: try exact filename first, then check content ID (expensive)
            // We prefer filename match for speed if ID matches filename.

            let filename = `${id}.json`
            if (!fs.existsSync(join(scripturesDir, filename))) {
                // Search by checking IDs
                const found = files.find(f => {
                    try {
                        const c = JSON.parse(fs.readFileSync(join(scripturesDir, f), 'utf-8'))
                        return c.id === id
                    } catch { return false }
                })
                if (found) filename = found
                else filename = null
            }

            if (filename) {
                const content = JSON.parse(fs.readFileSync(join(scripturesDir, filename), 'utf-8'))
                res.json(content)
            } else {
                res.status(404).json({ error: 'Scripture version not found' })
            }
        } catch (e) {
            res.status(500).json({ error: 'Failed to get scripture' })
        }
    })

    // Create/Upload Scripture Version
    // Body can be the JSON content directly
    router.post('/', (req, res) => {
        try {
            const data = req.body
            if (!data.id || !data.name || !data.books) {
                return res.status(400).json({ error: 'Invalid scripture format. Requires id, name, books.' })
            }

            const safeId = sanitizeFilename(data.id)
            const filename = `${safeId}.json`
            const filePath = join(scripturesDir, filename)

            if (fs.existsSync(filePath)) {
                return res.status(409).json({ error: 'Version already exists' })
            }

            fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
            refreshScriptures()
            res.json({ success: true, id: safeId })
        } catch (e) {
            console.error('Failed to create scripture:', e)
            res.status(500).json({ error: 'Failed to create scripture' })
        }
    })

    // Update Scripture Version
    router.put('/:id', (req, res) => {
        try {
            const id = req.params.id
            const data = req.body

            // Find file
            const files = fs.readdirSync(scripturesDir)
            let filename = `${id}.json`
            if (!fs.existsSync(join(scripturesDir, filename))) {
                // Search
                const found = files.find(f => {
                    try {
                        const c = JSON.parse(fs.readFileSync(join(scripturesDir, f), 'utf-8'))
                        return c.id === id
                    } catch { return false }
                })
                if (found) filename = found
                else filename = null
            }

            if (filename) {
                fs.writeFileSync(join(scripturesDir, filename), JSON.stringify(data, null, 2))
                refreshScriptures()
                res.json({ success: true })
            } else {
                res.status(404).json({ error: 'Scripture version not found' })
            }
        } catch (e) {
            res.status(500).json({ error: 'Failed to update scripture' })
        }
    })

    // Delete Scripture Version
    router.delete('/:id', (req, res) => {
        try {
            const id = req.params.id
            // Find file
            const files = fs.readdirSync(scripturesDir)
            let filename = `${id}.json`
            if (!fs.existsSync(join(scripturesDir, filename))) {
                const found = files.find(f => {
                    try {
                        const c = JSON.parse(fs.readFileSync(join(scripturesDir, f), 'utf-8'))
                        return c.id === id
                    } catch { return false }
                })
                if (found) filename = found
                else filename = null
            }

            if (filename) {
                fs.unlinkSync(join(scripturesDir, filename))
                refreshScriptures()
                res.json({ success: true })
            } else {
                res.status(404).json({ error: 'Scripture version not found' })
            }
        } catch (e) {
            res.status(500).json({ error: 'Failed to delete scripture' })
        }
    })

    return router
}
