import { Router } from 'express'
import fs from 'fs'
import { join } from 'path'
import { sanitizeFilename } from './utils.mjs'
import { Scanners } from '../scanners.mjs'

export function schedulesRoutes(dataDir) {
    const router = Router()

    // List all available schedules
    router.get('/', (req, res) => {
        try {
            const schedules = Scanners.scanSchedules(dataDir)
            res.json(schedules)
        } catch (error) {
            console.error('Failed to list schedules:', error)
            res.status(500).json({ error: 'Failed to list schedules' })
        }
    })

    // Get a specific schedule by name
    router.get('/:name', (req, res) => {
        try {
            const name = req.params.name
            // Handle 'current' specifically if handled by separate endpoint in legacy, 
            // but here we can just treat it as a file
            if (!name) return res.status(400).json({ error: 'Name required' })

            const path = join(dataDir, 'schedules', `${name}.json`)
            if (fs.existsSync(path)) {
                const schedule = JSON.parse(fs.readFileSync(path, 'utf-8'))
                schedule._name = name // Include schedule name in response
                res.json(schedule)
            } else {
                if (name === 'current') {
                    // Fallback for current if not exists
                    res.json({ date: new Date().toISOString(), items: [], _name: 'current' })
                } else {
                    res.status(404).json({ error: 'Schedule not found' })
                }
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to get schedule' })
        }
    })

    // Legacy support: /api/schedule without name -> current
    // We will handle this in the main router or just expect clients to call /api/schedules/current 
    // BUT legacy clients call /api/schedule directly.
    // The aggregator will mount this at /api/schedules and /api/schedule to handle both?
    // Actually, legacy /api/schedule is equivalent to /api/schedule/current in logic basically.
    // We'll expose a specific route for the root '/' of this router if mounted at /api/schedule

    // Update/Save schedule
    router.put('/:name', (req, res) => {
        try {
            const name = req.params.name
            const path = join(dataDir, 'schedules', `${name}.json`)
            const data = { ...req.body }
            delete data._name // Don't save internal field
            fs.writeFileSync(path, JSON.stringify(data, null, 2))
            res.json({ success: true, name })
        } catch (error) {
            res.status(500).json({ error: 'Failed to save schedule' })
        }
    })

    // Create new schedule
    router.post('/', (req, res) => {
        try {
            const { name } = req.body
            if (!name) {
                return res.status(400).json({ error: 'Schedule name is required' })
            }
            const safeName = sanitizeFilename(name)
            const path = join(dataDir, 'schedules', `${safeName}.json`)
            if (fs.existsSync(path)) {
                return res.status(409).json({ error: 'Schedule already exists' })
            }
            const newSchedule = {
                date: new Date().toISOString().split('T')[0],
                items: []
            }
            fs.writeFileSync(path, JSON.stringify(newSchedule, null, 2))
            res.json({ success: true, name: safeName })
        } catch (error) {
            res.status(500).json({ error: 'Failed to create schedule' })
        }
    })

    return router
}
