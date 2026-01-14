import { Router } from 'express'
import { Scanners } from '../scanners.mjs'

export function libraryRoutes(dataDir) {
    const router = Router()

    // Helper to get everything
    const getAllItems = () => {
        const songs = Scanners.scanSongs(dataDir)

        const mediaTypes = ['background_videos', 'content_videos', 'background_images', 'content_images']
        const media = mediaTypes.flatMap(type => Scanners.scanMedia(dataDir, type))

        const scriptures = Scanners.scanScriptures(dataDir)

        const slides = Scanners.scanSlides(dataDir)
        const audio = Scanners.scanAudio(dataDir)
        const youtube = Scanners.scanYouTube(dataDir)

        return [...songs, ...media, ...scriptures, ...slides, ...audio, ...youtube]
    }

    // List all
    router.get('/library', (req, res) => {
        try {
            const all = getAllItems()
            res.json(all)
        } catch (e) {
            console.error('Library scan failed', e)
            res.status(500).json({ error: 'Failed to load library' })
        }
    })

    // Search
    router.get('/library/search', (req, res) => {
        try {
            const q = (req.query.q || '').toLowerCase()
            if (!q) return res.json([])

            const all = getAllItems()

            const results = all.filter(item => {
                const titleMatch = item.title.toLowerCase().includes(q)
                const subtitleMatch = (item.subtitle || '').toLowerCase().includes(q)

                if (titleMatch || subtitleMatch) return true

                // Deep search for songs
                if (item.type === 'song' && item.data && item.data.searchContent) {
                    return item.data.searchContent.toLowerCase().includes(q)
                }
                return false
            })

            // Simple relevance sort
            results.sort((a, b) => {
                const aTitle = a.title.toLowerCase()
                const bTitle = b.title.toLowerCase()

                // Exact match priority
                if (aTitle === q && bTitle !== q) return -1
                if (aTitle !== q && bTitle === q) return 1

                // Starts with priority
                if (aTitle.startsWith(q) && !bTitle.startsWith(q)) return -1
                if (!aTitle.startsWith(q) && bTitle.startsWith(q)) return 1

                return 0
            })

            res.json(results.slice(0, 50))
        } catch (e) {
            console.error('Search failed:', e)
            res.status(500).json({ error: 'Search failed' })
        }
    })

    return router
}
