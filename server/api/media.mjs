import { Router } from 'express'
import fs from 'fs'
import { join } from 'path'
import https from 'https'
import { sharedState } from '../state.mjs'
import { Scanners } from '../scanners.mjs'
import { upload, sanitizeFilename, generateThumbnail } from './utils.mjs'

export function mediaRoutes(dataDir) {
    const router = Router()



    // --- GENERIC MEDIA ---
    // List Media (equivalent to refresh for now as we want latest state)
    router.get('/media/:type', (req, res) => {
        try {
            const type = req.params.type
            const validTypes = ['background_videos', 'content_videos', 'background_images', 'content_images']
            if (!validTypes.includes(type)) {
                return res.status(400).json({ error: 'Invalid media type' })
            }
            const items = Scanners.scanMedia(dataDir, type)
            // Update state while we are at it?
            // "Reading" shouldn't necessarily mutate state BUT in this file-system based app,
            // "getting" the list of files IS the source of truth for the state.
            const stateKey = type.replace(/_([a-z])/g, g => g[1].toUpperCase())
            if (sharedState.availableMedia[stateKey] !== undefined) {
                sharedState.availableMedia[stateKey] = items
            }
            if (type === 'background_videos') {
                sharedState.availableVideos = items
            }
            res.json(items)
        } catch (e) {
            res.status(500).json({ error: 'Failed to list media' })
        }
    })

    router.post('/media/refresh/:type', (req, res) => {
        try {
            const type = req.params.type
            const validTypes = ['background_videos', 'content_videos', 'background_images', 'content_images']

            if (!validTypes.includes(type)) {
                return res.status(400).json({ error: 'Invalid media type' })
            }

            const items = Scanners.scanMedia(dataDir, type)

            const stateKey = type.replace(/_([a-z])/g, g => g[1].toUpperCase())
            if (sharedState.availableMedia[stateKey] !== undefined) {
                sharedState.availableMedia[stateKey] = items
            }

            if (type === 'background_videos') {
                sharedState.availableVideos = items
            }

            res.json(items)
        } catch (e) {
            console.error(`Failed to refresh media ${req.params.type}:`, e)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    })

    // --- YOUTUBE SUPPORT ---
    router.post('/media/youtube', (req, res) => {
        try {
            const { url } = req.body
            if (!url) return res.status(400).json({ error: 'URL required' })

            // Simple validation
            if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
                return res.status(400).json({ error: 'Invalid YouTube URL' })
            }

            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`

            https.get(oembedUrl, (response) => {
                let data = ''
                response.on('data', chunk => data += chunk)
                response.on('end', () => {
                    try {
                        if (response.statusCode === 404) return res.status(404).json({ error: 'Video not found' })

                        const json = JSON.parse(data)
                        const id = Date.now().toString()
                        const entry = {
                            id,
                            title: json.title,
                            author: json.author_name,
                            url,
                            thumbnail: json.thumbnail_url,
                            addedAt: new Date().toISOString()
                        }

                        // Download Thumbnail
                        const thumbsDir = join(dataDir, 'media', 'youtube_thumbnails')
                        if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir, { recursive: true })

                        const thumbPath = join(thumbsDir, `${id}.jpg`)
                        if (json.thumbnail_url) {
                            const file = fs.createWriteStream(thumbPath)
                            https.get(json.thumbnail_url, response => {
                                response.pipe(file)
                                file.on('finish', () => {
                                    file.close()
                                    // Determine local path for frontend
                                    entry.localThumbnail = `/media/youtube_thumbnails/${id}.jpg`
                                    saveEntry(entry)
                                })
                            }).on('error', err => {
                                console.error('Thumbnail download failed', err)
                                // Save anyway without local thumb
                                saveEntry(entry)
                            })
                        } else {
                            saveEntry(entry)
                        }

                        function saveEntry(item) {
                            const dbPath = join(dataDir, 'media', 'youtube_links.json')
                            let links = []
                            if (fs.existsSync(dbPath)) {
                                try { links = JSON.parse(fs.readFileSync(dbPath, 'utf-8')) } catch (e) { }
                            }
                            links.push(item)
                            fs.writeFileSync(dbPath, JSON.stringify(links, null, 2))
                            res.json({ success: true, item })
                        }

                    } catch (e) {
                        console.error(e)
                        res.status(500).json({ error: 'Failed to parse YouTube metadata' })
                    }
                })
            }).on('error', (e) => {
                console.error(e)
                res.status(500).json({ error: 'Failed to fetch YouTube metadata' })
            })

        } catch (e) {
            console.error('YouTube handler error', e)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    })

    // --- MEDIA MANAGEMENT ---

    // Upload Media
    router.post('/media/upload/:type', upload.single('file'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' })
            }

            const type = req.params.type
            const isVideo = ['background_videos', 'content_videos'].includes(type)

            if (isVideo) {
                const dir = join(dataDir, 'media', type)
                const thumbnailsDir = join(dir, 'thumbnails')
                if (!fs.existsSync(thumbnailsDir)) {
                    fs.mkdirSync(thumbnailsDir, { recursive: true })
                }

                const thumbName = `${req.file.filename}.jpg`
                const thumbPath = join(thumbnailsDir, thumbName)

                // Generate thumbnail (import generateThumbnail first!)
                // We need to import it in the module imports above
                await generateThumbnail(req.file.path, thumbPath)
            }

            // Trigger refresh for this type to update state
            const items = Scanners.scanMedia(dataDir, type)

            // Update State
            const stateKey = type.replace(/_([a-z])/g, g => g[1].toUpperCase())
            if (sharedState.availableMedia[stateKey] !== undefined) {
                sharedState.availableMedia[stateKey] = items
            }
            if (type === 'background_videos') {
                sharedState.availableVideos = items
            }

            res.json({ success: true, file: req.file.filename })
        } catch (error) {
            console.error('Upload failed:', error)
            res.status(500).json({ error: 'Upload failed' })
        }
    })

    // Rename Media
    router.put('/media/:type/:filename', (req, res) => {
        try {
            const { type, filename } = req.params
            const { newName } = req.body

            if (!newName) return res.status(400).json({ error: 'New name required' })

            const dir = join(dataDir, 'media', type)
            const oldPath = join(dir, filename)

            // Sanitize new name but keep extension if not provided? 
            // Usually UI provides full name or we preserve extension.
            // Let's assume UI provides just the name part or full name.
            // Safest: strict sanitization of new name.
            // If newName has no extension, append old one.

            // However, assuming user might want to change extension is rare.
            // Let's protect extension.
            const ext = filename.split('.').pop()
            let safeNewName = sanitizeFilename(newName.replace(`.${ext}`, '')) + `.${ext}`

            const newPath = join(dir, safeNewName)

            if (fs.existsSync(newPath)) {
                return res.status(409).json({ error: 'File already exists' })
            }

            if (fs.existsSync(oldPath)) {
                fs.renameSync(oldPath, newPath)

                // Rename thumbnail if exists
                const thumbName = `${filename}.jpg`
                const thumbPath = join(dir, 'thumbnails', thumbName)
                if (fs.existsSync(thumbPath)) {
                    const newThumbName = `${safeNewName}.jpg`
                    const newThumbPath = join(dir, 'thumbnails', newThumbName)
                    fs.renameSync(thumbPath, newThumbPath)
                }

                // Refresh state
                const items = Scanners.scanMedia(dataDir, type)
                const stateKey = type.replace(/_([a-z])/g, g => g[1].toUpperCase())
                if (sharedState.availableMedia[stateKey] !== undefined) {
                    sharedState.availableMedia[stateKey] = items
                }
                if (type === 'background_videos') {
                    sharedState.availableVideos = items
                }

                res.json({ success: true, newName: safeNewName })
            } else {
                res.status(404).json({ error: 'File not found' })
            }
        } catch (error) {
            console.error('Rename failed:', error)
            res.status(500).json({ error: 'Rename failed' })
        }
    })

    // Delete Media
    router.delete('/media/:type/:filename', (req, res) => {
        try {
            const { type, filename } = req.params
            const dir = join(dataDir, 'media', type)
            const filePath = join(dir, filename)

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)

                // Delete thumbnail
                const thumbName = `${filename}.jpg`
                const thumbPath = join(dir, 'thumbnails', thumbName)
                if (fs.existsSync(thumbPath)) {
                    fs.unlinkSync(thumbPath)
                }

                // Refresh state
                const items = Scanners.scanMedia(dataDir, type)
                const stateKey = type.replace(/_([a-z])/g, g => g[1].toUpperCase())
                if (sharedState.availableMedia[stateKey] !== undefined) {
                    sharedState.availableMedia[stateKey] = items
                }
                if (type === 'background_videos') {
                    sharedState.availableVideos = items
                }

                res.json({ success: true })
            } else {
                res.status(404).json({ error: 'File not found' })
            }
        } catch (error) {
            console.error('Delete failed:', error)
            res.status(500).json({ error: 'Delete failed' })
        }
    })



    return router
}
