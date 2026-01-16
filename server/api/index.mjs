import libraryRouter from './library.mjs'
import settingsRouter from './settings.mjs'
import { uploadRoutes } from './upload.mjs'
import { join } from 'path'

export function setupRoutes(app, rootDir) {
    const dataDir = join(rootDir, 'data')

    // API Version 2 (New Architecture)
    app.use('/api/library', libraryRouter)
    app.use('/api/settings', settingsRouter)

    // Legacy support (Uploads still file-based for now)
    app.use('/api', uploadRoutes(dataDir))
}
