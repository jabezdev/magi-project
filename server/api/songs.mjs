import { Router } from 'express'
import fs from 'fs'
import { join } from 'path'
import { sanitizeFilename, generateId } from './utils.mjs'
import { Scanners } from '../scanners.mjs'

export function songsRoutes(dataDir) {
    const router = Router()

    // List all songs (metadata only)
    router.get('/', (req, res) => {
        try {
            const songs = Scanners.scanSongs(dataDir)
            res.json(songs)
        } catch (error) {
            console.error('Failed to list songs:', error)
            res.status(500).json({ error: 'Failed to list songs' })
        }
    })

    // Get specific song
    router.get('/:id', (req, res) => {
        try {
            const songsDir = join(dataDir, 'songs')
            const id = req.params.id
            const files = fs.readdirSync(songsDir)
            // Match exactly or start with ID (UUID-Title pattern)
            const file = files.find(f => f.startsWith(`${id}-`) || f === `${id}.json`)

            if (!file) {
                return res.status(404).json({ error: 'Song not found' })
            }

            const song = JSON.parse(fs.readFileSync(join(songsDir, file), 'utf-8'))
            res.json(song)
        } catch (error) {
            console.error('Failed to get song:', error)
            res.status(500).json({ error: 'Failed to get song' })
        }
    })

    // Create Song
    router.post('/', (req, res) => {
        try {
            const songsDir = join(dataDir, 'songs')
            const song = req.body

            // Generate UUID
            song.id = generateId()

            const filename = `${song.id}-${sanitizeFilename(song.title)}.json`
            fs.writeFileSync(join(songsDir, filename), JSON.stringify(song, null, 2))

            res.json({ success: true, id: song.id })
        } catch (error) {
            console.error('Failed to create song:', error)
            res.status(500).json({ error: 'Failed to create song' })
        }
    })

    // Update Song
    router.put('/:id', (req, res) => {
        try {
            const songsDir = join(dataDir, 'songs')
            const id = req.params.id
            const song = req.body
            song.id = id // Ensure ID matches URL

            // Find old file if updating (to handle rename)
            const files = fs.readdirSync(songsDir)
            const oldFile = files.find(f => f.startsWith(`${id}-`) || f === `${id}.json`)

            if (oldFile) {
                fs.unlinkSync(join(songsDir, oldFile))
            } else {
                return res.status(404).json({ error: 'Song not found' })
            }

            const filename = `${id}-${sanitizeFilename(song.title)}.json`
            fs.writeFileSync(join(songsDir, filename), JSON.stringify(song, null, 2))

            res.json({ success: true, id: song.id })
        } catch (error) {
            console.error('Failed to update song:', error)
            res.status(500).json({ error: 'Failed to update song' })
        }
    })

    // Delete Song
    router.delete('/:id', (req, res) => {
        try {
            const songsDir = join(dataDir, 'songs')
            const id = req.params.id
            const files = fs.readdirSync(songsDir)
            const file = files.find(f => f.startsWith(`${id}-`) || f === `${id}.json`)

            if (file) {
                fs.unlinkSync(join(songsDir, file))
            }
            res.json({ success: true })
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete song' })
        }
    })

    return router
}
