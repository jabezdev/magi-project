import { join, dirname } from 'path'
import fs from 'fs'
import { sharedState, connectedClients } from './state.mjs'

// Helper to ensure directories exist
function ensureDirs(__dirname) {
    const dirs = [
        join(__dirname, 'data', 'songs'),
        join(__dirname, 'data', 'schedules')
    ]
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
    })
}

// Helper to sanitize filename
function sanitizeFilename(str) {
    return str.replace(/[^a-z0-9]/gi, '-').toLowerCase()
}

// Migration logic
function checkAndMigrate(__dirname) {
    const songsDir = join(__dirname, 'data', 'songs')
    const lyricsPath = join(__dirname, 'data', 'lyrics.json')

    // accessSync throws if not exists, verify contents
    let files = []
    try {
        files = fs.readdirSync(songsDir)
    } catch {
        // dir might not exist yet
        return
    }

    if (files.length === 0 && fs.existsSync(lyricsPath)) {
        console.log('Migrating lyrics.json to new structure...')
        try {
            const data = JSON.parse(fs.readFileSync(lyricsPath, 'utf-8'))
            const sets = data.sets || []
            let allSongs = []

            sets.forEach(set => {
                set.songs.forEach(song => {
                    // Check if already processed (duplicate song in different sets?)
                    // For now, treat them as unique or just ID based. 
                    if (!allSongs.find(s => s.id === song.id)) {
                        allSongs.push(song)
                    }
                })
            })

            // Write songs
            allSongs.forEach(song => {
                const filename = `${song.id}-${sanitizeFilename(song.title)}.json`
                fs.writeFileSync(
                    join(songsDir, filename),
                    JSON.stringify(song, null, 2)
                )
            })

            // Create initial schedule from first set if exists
            if (sets.length > 0) {
                const schedule = {
                    date: new Date().toISOString().split('T')[0],
                    items: sets.flatMap(set => set.songs.map(s => ({
                        songId: s.id,
                        variationId: s.variations?.[0]?.id || 'default' // Fallback
                    })))
                }

                fs.writeFileSync(
                    join(__dirname, 'data', 'schedules', 'current.json'),
                    JSON.stringify(schedule, null, 2)
                )
            }

            console.log(`Migrated ${allSongs.length} songs.`)
        } catch (e) {
            console.error('Migration failed:', e)
        }
    }
}

export function setupRoutes(app, __dirname) {
    ensureDirs(__dirname)
    checkAndMigrate(__dirname)

    // ============ API ROUTES ============

    // --- SONGS ---

    // List all songs (metadata only)
    app.get('/api/songs', (req, res) => {
        try {
            const songsDir = join(__dirname, 'data', 'songs')
            const files = fs.readdirSync(songsDir)

            const songs = files
                .filter(f => f.endsWith('.json'))
                .map(file => {
                    try {
                        const content = JSON.parse(fs.readFileSync(join(songsDir, file), 'utf-8'))
                        return {
                            id: content.id,
                            title: content.title,
                            artist: content.artist,
                            variations: content.variations || [],
                            _filename: file // Internal use
                        }
                    } catch {
                        return null
                    }
                })
                .filter(Boolean)
                .sort((a, b) => a.title.localeCompare(b.title))

            res.json(songs)
        } catch (error) {
            console.error('Failed to list songs:', error)
            res.status(500).json({ error: 'Failed to list songs' })
        }
    })

    // Get specific song
    app.get('/api/songs/:id', (req, res) => {
        try {
            const songsDir = join(__dirname, 'data', 'songs')
            const id = parseInt(req.params.id)
            const files = fs.readdirSync(songsDir)
            const file = files.find(f => parseInt(f.split('-')[0]) === id)

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

    // Create or Update Song
    app.post('/api/songs', (req, res) => {
        try {
            const songsDir = join(__dirname, 'data', 'songs')
            const song = req.body

            if (!song.id) {
                // Generate ID: Max existing ID + 1
                const files = fs.readdirSync(songsDir)
                const ids = files.map(f => parseInt(f.split('-')[0])).filter(n => !isNaN(n))
                const maxId = ids.length > 0 ? Math.max(...ids) : 0
                song.id = maxId + 1
            }

            // Find old file if updating (to handle rename)
            const files = fs.readdirSync(songsDir)
            const oldFile = files.find(f => parseInt(f.split('-')[0]) === song.id)
            if (oldFile) {
                fs.unlinkSync(join(songsDir, oldFile))
            }

            const filename = `${song.id}-${sanitizeFilename(song.title)}.json`
            fs.writeFileSync(join(songsDir, filename), JSON.stringify(song, null, 2))

            res.json({ success: true, id: song.id })
        } catch (error) {
            console.error('Failed to save song:', error)
            res.status(500).json({ error: 'Failed to save song' })
        }
    })

    // Delete Song
    app.delete('/api/songs/:id', (req, res) => {
        try {
            const songsDir = join(__dirname, 'data', 'songs')
            const id = parseInt(req.params.id)
            const files = fs.readdirSync(songsDir)
            const file = files.find(f => parseInt(f.split('-')[0]) === id)

            if (file) {
                fs.unlinkSync(join(songsDir, file))
            }
            res.json({ success: true })
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete song' })
        }
    })

    // --- SCHEDULE ---

    app.get('/api/schedule', (req, res) => {
        try {
            // Support multiple schedules later, for now just 'current.json'
            const path = join(__dirname, 'data', 'schedules', 'current.json')
            if (fs.existsSync(path)) {
                res.json(JSON.parse(fs.readFileSync(path, 'utf-8')))
            } else {
                res.json({ date: new Date().toISOString(), items: [] })
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to get schedule' })
        }
    })

    app.post('/api/schedule', (req, res) => {
        try {
            const path = join(__dirname, 'data', 'schedules', 'current.json')
            fs.writeFileSync(path, JSON.stringify(req.body, null, 2))
            res.json({ success: true })
        } catch (error) {
            res.status(500).json({ error: 'Failed to save schedule' })
        }
    })

    // --- CONFIG, STATE, VIDEOS ---

    app.get('/api/config', (req, res) => {
        res.json({
            appTitle: 'MAGI Church Projection System',
            screens: ['control-panel', 'main-projection', 'confidence-monitor'],
            version: '2.0.0'
        })
    })

    // Get current state (for debugging/API access)
    app.get('/api/state', (req, res) => {
        res.json({
            ...sharedState,
            connectedClients: connectedClients.size
        })
    })

    // List available videos in the public/videos folder
    app.get('/api/videos', (req, res) => {
        try {
            const videosPath = join(__dirname, 'public', 'videos')
            if (!fs.existsSync(videosPath)) {
                return res.json([])
            }
            const files = fs.readdirSync(videosPath)
            const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv']
            const videos = files
                .filter(file => videoExtensions.some(ext => file.toLowerCase().endsWith(ext)))
                .map(file => ({
                    name: file,
                    path: `/public/videos/${file}`,
                    thumbnail: `/public/videos/${file}` // Video element will generate thumbnail
                }))
            res.json(videos)
        } catch (error) {
            console.error('Failed to list videos:', error)
            res.status(500).json({ error: 'Failed to list videos' })
        }
    })
}
