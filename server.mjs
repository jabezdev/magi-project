import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import { setupRoutes } from './server/routes.mjs'
import { setupSocket } from './server/socket.mjs'

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

// ============ SETUP MODULES ============
setupRoutes(app, __dirname)
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
╚══════════════════════════════════════════════════════════╝
  `)
})
