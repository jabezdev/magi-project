import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

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

// ============ SHARED STATE ============
// This state is synchronized across all connected clients
const sharedState = {
  liveSong: null,
  liveVariation: 0,
  livePosition: { partIndex: 0, slideIndex: 0 },
  backgroundVideo: '/public/videos/background.mp4',
  logoMedia: '/public/videos/logo.mp4',
  displayMode: 'clear', // 'lyrics' | 'logo' | 'black' | 'clear'
  displaySettings: {
    fontSize: 3.5,
    fontFamily: 'system-ui',
    lineHeight: 1.5,
    textColor: '#ffffff',
    allCaps: false,
    textShadow: true,
    shadowBlur: 4,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    textOutline: false,
    outlineWidth: 2,
    outlineColor: '#000000',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 5,
    marginRight: 5
  },
  confidenceMonitorSettings: {
    fontSize: 2.5,
    fontFamily: 'system-ui',
    lineHeight: 1.4,
    prevNextOpacity: 0.35
  }
}

// Track connected clients
const connectedClients = new Map()

// ============ MIDDLEWARE ============
app.use(cors())
app.use(express.json())
app.use(express.static('dist'))
app.use('/public', express.static('public'))

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

// Serve index.html for all routes (SPA)
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

// Catch-all route for SPA - must be after API routes
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' })
  }
  // Serve index.html for all other routes
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

// ============ SOCKET.IO EVENTS ============
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id)
  connectedClients.set(socket.id, { connectedAt: new Date() })

  // Send current state to newly connected client
  socket.emit('state-sync', {
    liveSong: sharedState.liveSong,
    liveVariation: sharedState.liveVariation,
    livePosition: sharedState.livePosition,
    backgroundVideo: sharedState.backgroundVideo,
    logoMedia: sharedState.logoMedia,
    displayMode: sharedState.displayMode,
    displaySettings: sharedState.displaySettings,
    confidenceMonitorSettings: sharedState.confidenceMonitorSettings
  })

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id)
    connectedClients.delete(socket.id)
  })

  // Request current state explicitly
  socket.on('request-state', () => {
    console.log('📤 Sending state to:', socket.id)
    socket.emit('state-sync', {
      liveSong: sharedState.liveSong,
      liveVariation: sharedState.liveVariation,
      livePosition: sharedState.livePosition,
      backgroundVideo: sharedState.backgroundVideo,
      logoMedia: sharedState.logoMedia,
      displayMode: sharedState.displayMode,
      displaySettings: sharedState.displaySettings,
      confidenceMonitorSettings: sharedState.confidenceMonitorSettings
    })
  })

  // Update current slide (go live)
  socket.on('update-slide', (data) => {
    console.log('📝 Updating slide:', data.song?.title, 'position:', JSON.stringify(data.position))
    sharedState.liveSong = data.song
    sharedState.liveVariation = data.variation
    sharedState.livePosition = data.position
    io.emit('slide-updated', data)
  })

  // Update video background
  socket.on('update-video', (data) => {
    console.log('🎬 Updating video:', data.video)
    sharedState.backgroundVideo = data.video
    io.emit('video-updated', data)
  })

  // Update display mode (lyrics, logo, black, clear)
  socket.on('update-display-mode', (data) => {
    console.log('📺 Display mode:', data.mode)
    sharedState.displayMode = data.mode
    io.emit('display-mode-updated', data)
  })

  // Update logo media
  socket.on('update-logo', (data) => {
    console.log('🖼️ Logo updated:', data.logo)
    sharedState.logoMedia = data.logo
    io.emit('logo-updated', data)
  })

  // Update display settings (font, size, margins) - Main Screen
  socket.on('update-display-settings', (data) => {
    console.log('⚙️ Main screen display settings updated')
    sharedState.displaySettings = data.settings
    io.emit('display-settings-updated', data)
  })

  // Update confidence monitor settings
  socket.on('update-confidence-monitor-settings', (data) => {
    console.log('⚙️ Confidence monitor settings updated')
    sharedState.confidenceMonitorSettings = data.settings
    io.emit('confidence-monitor-settings-updated', data)
  })

  // Show/hide margin markers on projection screens
  socket.on('show-margin-markers', (data) => {
    io.emit('margin-markers', data)
  })
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
╚══════════════════════════════════════════════════════════╝
  `)
})
