import { songsRoutes } from './songs.mjs'
import { schedulesRoutes } from './schedules.mjs'
import { mediaRoutes } from './media.mjs'
import { settingsRoutes } from './settings.mjs'
import { slidesRoutes } from './slides.mjs'
import { scripturesRoutes } from './scriptures.mjs'
import { join } from 'path'
import fs from 'fs'
import { sanitizeFilename } from './utils.mjs'

// Support helpers logic (ensureDirs, checkAndMigrate) locally here or imported
// For simplicity, defining them here as they aren't reused elsewhere yet.

function ensureDirs(dataDir) {
    const dirs = [
        join(dataDir, 'songs'),
        join(dataDir, 'schedules'),
        join(dataDir, 'slides'),
        join(dataDir, 'scriptures'),
        join(dataDir, 'media'),
        join(dataDir, 'media', 'background_videos'),
        join(dataDir, 'media', 'background_videos', 'thumbnails'),
        join(dataDir, 'media', 'content_videos'),
        join(dataDir, 'media', 'background_images'),
        join(dataDir, 'media', 'content_images'),
        join(dataDir, 'media', 'content_videos', 'thumbnails'),
        join(dataDir, 'slides', 'local_slides'),
        join(dataDir, 'slides', 'image_slides'),
        join(dataDir, 'slides', 'canva_slides')
    ]
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
    })
}

function checkAndMigrate(dataDir) {
    const songsDir = join(dataDir, 'songs')
    const lyricsPath = join(dataDir, 'lyrics.json')

    let files = []
    try {
        files = fs.readdirSync(songsDir)
    } catch {
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
                    if (!allSongs.find(s => s.id === song.id)) {
                        allSongs.push(song)
                    }
                })
            })

            allSongs.forEach(song => {
                const filename = `${song.id}-${sanitizeFilename(song.title)}.json`
                fs.writeFileSync(
                    join(songsDir, filename),
                    JSON.stringify(song, null, 2)
                )
            })

            if (sets.length > 0) {
                const schedule = {
                    date: new Date().toISOString().split('T')[0],
                    items: sets.flatMap(set => set.songs.map(s => ({
                        songId: s.id,
                        variationId: s.variations?.[0]?.id || 'default'
                    })))
                }

                fs.writeFileSync(
                    join(dataDir, 'schedules', 'current.json'),
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
    const dataDir = join(__dirname, 'data')
    ensureDirs(dataDir)
    checkAndMigrate(dataDir)

    // Mount sub-routers
    app.use('/api/songs', songsRoutes(dataDir))
    app.use('/api/schedules', schedulesRoutes(dataDir))
    app.use('/api/slides', slidesRoutes(dataDir))
    app.use('/api/scriptures', scripturesRoutes(dataDir))
    app.use('/api', mediaRoutes(dataDir))
    app.use('/api', settingsRoutes(dataDir))
}

