import { Router } from 'express'
// fetch is global in Node 18+
// Wait, this is running with `node server.mjs`, so global `fetch` is available in Node 18+

const router = Router()

router.get('/meta', async (req, res) => {
    const { url } = req.query
    if (!url) return res.status(400).json({ error: 'Missing URL' })

    try {
        // 1. Fetch Basic Info via oEmbed (Reliable for Title)
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
        const oembedRes = await fetch(oembedUrl)

        if (!oembedRes.ok) throw new Error('Failed to fetch video metadata')

        const oembedData = await oembedRes.json()

        let duration = 0

        // 2. Attempt to fetch duration by scraping page (Brittle, best effort)
        try {
            const pageRes = await fetch(url)
            const html = await pageRes.text()

            // Regex for approxDurationMs
            // "approxDurationMs":"123456"
            const match = html.match(/"approxDurationMs":"(\d+)"/)
            if (match && match[1]) {
                duration = Math.round(parseInt(match[1]) / 1000)
            } else {
                // Fallback regex for meta tag duration (ISO 8601)
                // <meta itemprop="duration" content="PT5M30S">
                const metaMatch = html.match(/itemprop="duration" content="([^"]+)"/)
                if (metaMatch) {
                    duration = parseDuration(metaMatch[1])
                }
            }
        } catch (e) {
            console.warn('Failed to scrape duration', e)
        }

        res.json({
            title: oembedData.title,
            author: oembedData.author_name,
            thumbnail: oembedData.thumbnail_url,
            duration: duration || 300 // Default 5m if failed
        })

    } catch (e) {
        console.error('YouTube Fetch Error', e)
        res.status(500).json({ error: e.message })
    }
})

function parseDuration(duration) {
    // PT5M30S -> seconds
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!match) return 0

    const hours = (parseInt(match[1] || '0'))
    const minutes = (parseInt(match[2] || '0'))
    const seconds = (parseInt(match[3] || '0'))

    return (hours * 3600) + (minutes * 60) + seconds
}

export default router
