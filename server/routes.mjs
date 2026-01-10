import { join } from 'path'
import fs from 'fs'
import { sharedState, connectedClients } from './state.mjs'

export function setupRoutes(app, __dirname) {
    // ============ API ROUTES ============
    app.get('/api/lyrics', (req, res) => {
        try {
            const lyricsPath = join(__dirname, 'data', 'lyrics.json')
            const lyrics = JSON.parse(fs.readFileSync(lyricsPath, 'utf-8'))
            res.json(lyrics)
        } catch (error) {
            console.error('Failed to load lyrics:', error)
            res.status(500).json({ error: 'Failed to load lyrics' })
        }
    })

    app.get('/api/config', (req, res) => {
        res.json({
            appTitle: 'MAGI Church Projection System',
            screens: ['control-panel', 'main-projection', 'confidence-monitor'],
            version: '1.0.0'
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
