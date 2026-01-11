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

    // List all available schedules
    app.get('/api/schedules', (req, res) => {
        try {
            const schedulesDir = join(__dirname, 'data', 'schedules')
            if (!fs.existsSync(schedulesDir)) {
                return res.json([])
            }
            const files = fs.readdirSync(schedulesDir)
            const schedules = files
                .filter(f => f.endsWith('.json'))
                .map(file => {
                    try {
                        const content = JSON.parse(fs.readFileSync(join(schedulesDir, file), 'utf-8'))
                        const name = file.replace('.json', '')
                        return {
                            name,
                            filename: file,
                            date: content.date || null,
                            itemCount: content.items?.length || 0
                        }
                    } catch {
                        return null
                    }
                })
                .filter(Boolean)
                .sort((a, b) => a.name.localeCompare(b.name))
            res.json(schedules)
        } catch (error) {
            console.error('Failed to list schedules:', error)
            res.status(500).json({ error: 'Failed to list schedules' })
        }
    })

    // Get a specific schedule by name
    app.get('/api/schedule/:name', (req, res) => {
        try {
            const name = req.params.name
            const path = join(__dirname, 'data', 'schedules', `${name}.json`)
            if (fs.existsSync(path)) {
                const schedule = JSON.parse(fs.readFileSync(path, 'utf-8'))
                schedule._name = name // Include schedule name in response
                res.json(schedule)
            } else {
                res.status(404).json({ error: 'Schedule not found' })
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to get schedule' })
        }
    })

    app.get('/api/schedule', (req, res) => {
        try {
            // Support multiple schedules later, for now just 'current.json'
            const path = join(__dirname, 'data', 'schedules', 'current.json')
            if (fs.existsSync(path)) {
                const schedule = JSON.parse(fs.readFileSync(path, 'utf-8'))
                schedule._name = 'current'
                res.json(schedule)
            } else {
                res.json({ date: new Date().toISOString(), items: [], _name: 'current' })
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to get schedule' })
        }
    })

    // Save schedule (default to 'current')
    app.post('/api/schedule', (req, res) => {
        try {
            const path = join(__dirname, 'data', 'schedules', 'current.json')
            const data = { ...req.body }
            delete data._name // Don't save internal field
            fs.writeFileSync(path, JSON.stringify(data, null, 2))
            res.json({ success: true, name: 'current' })
        } catch (error) {
            res.status(500).json({ error: 'Failed to save schedule' })
        }
    })

    // Save schedule with specific name
    app.post('/api/schedule/:name', (req, res) => {
        try {
            const name = req.params.name
            const path = join(__dirname, 'data', 'schedules', `${name}.json`)
            const data = { ...req.body }
            delete data._name // Don't save internal field
            fs.writeFileSync(path, JSON.stringify(data, null, 2))
            res.json({ success: true, name })
        } catch (error) {
            res.status(500).json({ error: 'Failed to save schedule' })
        }
    })

    // Create new schedule
    app.post('/api/schedules/new', (req, res) => {
        try {
            const { name } = req.body
            if (!name) {
                return res.status(400).json({ error: 'Schedule name is required' })
            }
            const safeName = sanitizeFilename(name)
            const path = join(__dirname, 'data', 'schedules', `${safeName}.json`)
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

    // List available videos in the data/videos folder
    app.get('/api/videos', (req, res) => {
        try {
            const videosPath = join(__dirname, 'data', 'videos')
            const thumbsPath = join(__dirname, 'data', 'videos', 'thumbnails')

            // Ensure thumbnails dir exists
            if (!fs.existsSync(thumbsPath)) {
                fs.mkdirSync(thumbsPath, { recursive: true })
            }

            if (!fs.existsSync(videosPath)) {
                return res.json([])
            }
            const files = fs.readdirSync(videosPath)
            const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv']

            const videos = files
                .filter(file => videoExtensions.some(ext => file.toLowerCase().endsWith(ext)))
                .map(file => {
                    const videoPath = `/media/${file}`
                    // Default thumbnail path (server generated)
                    const thumbFileName = `${file}.jpg`
                    const thumbFilePath = join(thumbsPath, thumbFileName)
                    const thumbUrl = `/media/thumbnails/${thumbFileName}`

                    let thumbnail = videoPath // Default to video itself (frontend fallback)

                    // Check if generated thumbnail exists
                    if (fs.existsSync(thumbFilePath)) {
                        thumbnail = thumbUrl
                    } else {
                        // Generate thumbnail asynchronously
                        // We use a small timeout to avoid blocking the response loop too much,
                        // or just fire and forget.
                        // Ideally checking existence prevents re-generation.
                        import('child_process').then(({ exec }) => {
                            const input = join(videosPath, file)
                            const output = thumbFilePath
                            // ffmpeg -i input -ss 00:00:01 -vframes 1 output.jpg
                            exec(`ffmpeg -i "${input}" -ss 00:00:01 -vframes 1 "${output}"`, (err) => {
                                if (err) console.error(`Failed to generate thumbnail for ${file}:`, err)
                            })
                        })
                    }

                    // Also check for manual sidecars in the main folder (legacy/manual override)
                    const extensions = ['.jpg', '.jpeg', '.png', '.webp']
                    const basePath = join(videosPath, file)
                    for (const ext of extensions) {
                        if (fs.existsSync(basePath + ext)) {
                            thumbnail = `/media/${file}${ext}` // manual override
                            break
                        }
                    }

                    return {
                        name: file,
                        path: videoPath,
                        thumbnail: thumbnail
                    }
                })
            res.json(videos)
        } catch (error) {
            console.error('Failed to list videos:', error)
            res.status(500).json({ error: 'Failed to list videos' })
        }
    })

    // --- SETTINGS ---

    // Get settings
    app.get('/api/settings', (req, res) => {
        try {
            const settingsPath = join(__dirname, 'data', 'settings.json')
            if (fs.existsSync(settingsPath)) {
                res.json(JSON.parse(fs.readFileSync(settingsPath, 'utf-8')))
            } else {
                // Return empty settings, client will use defaults
                res.json({})
            }
        } catch (error) {
            console.error('Failed to get settings:', error)
            res.status(500).json({ error: 'Failed to get settings' })
        }
    })

    // Save settings
    app.post('/api/settings', (req, res) => {
        try {
            const settingsPath = join(__dirname, 'data', 'settings.json')
            // Merge with existing settings
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
}
