import libraryRouter from './library.mjs'
import settingsRouter from './settings.mjs'
import youtubeRouter from './youtube.mjs'
import { uploadRoutes } from './upload.mjs'
import { join } from 'path'

export function setupRoutes(app, rootDir) {
    const dataDir = join(rootDir, 'data')

    // API Version 2 (New Architecture)
    app.use('/api/library', libraryRouter)
    app.use('/api/settings', settingsRouter)
    app.use('/api/youtube', youtubeRouter)

    // File uploads (uses multer for file handling)
    app.use('/api', uploadRoutes(dataDir))
}
