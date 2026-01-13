import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import { setupRoutes } from './server/api/index.mjs'
import { setupSocket } from './server/socket.mjs'
import { Scanners } from './server/scanners.mjs'
import { sharedState } from './server/state.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 3000

// ============ MIDDLEWARE ============
app.use(cors())
app.use(express.json())
app.use(express.static('dist'))
app.use('/public', express.static('public'))
app.use('/public', express.static('public'))
// Use absolute path for robustness
const mediaDir = join(__dirname, 'data', 'media')
const legacyVideoDir = join(__dirname, 'data', 'media', 'background_videos')

app.use('/media', (req, res, next) => {
  next()
}, express.static(mediaDir), express.static(legacyVideoDir))

// ============ SETUP MODULES ============
setupRoutes(app, __dirname)

// Initial Scan
const dataDir = join(__dirname, 'data')

console.log('Initializing Data Scanners...')
try {
  sharedState.availableMedia.backgroundVideos = Scanners.scanMedia(dataDir, 'background_videos')
  sharedState.availableMedia.contentVideos = Scanners.scanMedia(dataDir, 'content_videos')
  sharedState.availableMedia.backgroundImages = Scanners.scanMedia(dataDir, 'background_images')
  sharedState.availableMedia.contentImages = Scanners.scanMedia(dataDir, 'content_images')

  // Legacy mapping
  sharedState.availableVideos = sharedState.availableMedia.backgroundVideos

  sharedState.availableSlides = Scanners.scanSlides(dataDir)
  sharedState.availableScriptures = Scanners.scanScriptures(dataDir)

  console.log(`[INIT] Loaded:
    - ${sharedState.availableMedia.backgroundVideos.length} Background Videos
    - ${sharedState.availableMedia.contentVideos.length} Content Videos
    - ${sharedState.availableMedia.backgroundImages.length} Background Images
    - ${sharedState.availableMedia.contentImages.length} Content Images
    - ${sharedState.availableSlides.length} Slide Sets
    - ${sharedState.availableScriptures.length} Scripture Versions`)

} catch (e) {
  console.error('Failed to run initial scan:', e)
}

setupSocket(io)

// ============ CATCH-ALL (SPA) ============
// Must be after API routes setup
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' })
  }
  // Serve index.html for all other routes
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

// ============ START SERVER ============
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║         MAGI Church Projection System                    ║
╠══════════════════════════════════════════════════════════╣
║  Server running on: http://0.0.0.0:${String(PORT).padEnd(24, ' ')}║
║                                                          ║
║  Screens:                                                ║
║  • Control Panel:      http://localhost:${PORT}/            ║
║  • Main Projection:    http://localhost:${PORT}/main        ║
║  • Confidence Monitor: http://localhost:${PORT}/confidence  ║
║  • Lower Thirds:       http://localhost:${PORT}/thirds      ║
║  • Mobile (People):    http://localhost:${PORT}/mobile      ║
╚══════════════════════════════════════════════════════════╝
  `)
})
