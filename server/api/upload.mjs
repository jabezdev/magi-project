import { Router } from 'express'
import multer from 'multer'
import { join } from 'path'
import fs from 'fs'
import { generateThumbnail } from './utils.mjs'

export function uploadRoutes(dataDir) {
    const router = Router()

    // Destinations mapping
    const targets = {
        'audio': join(dataDir, 'media/audio'),
        'video_bg': join(dataDir, 'media/background_videos'),
        'video_content': join(dataDir, 'media/content_videos'),
        'image_bg': join(dataDir, 'media/background_images'),
        'image_content': join(dataDir, 'media/content_images'),
        'image_slides': join(dataDir, 'slides/image_slides'),
        'canva_slides': join(dataDir, 'slides/canva_slides'),
        'bible': join(dataDir, 'scriptures')
    }

    // Ensure dirs exist
    Object.values(targets).forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    })

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const targetKey = req.body.target
            let dest = targets[targetKey] || join(dataDir, 'uploads')

            // Subfolder support
            if (req.body.subfolder) {
                const safeSub = req.body.subfolder.replace(/[^a-z0-9 _-]/gi, '').trim()
                if (safeSub) dest = join(dest, safeSub)
            }

            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
            cb(null, dest)
        },
        filename: (req, file, cb) => {
            cb(null, file.originalname)
        }
    })

    const upload = multer({ storage })

    router.post('/upload', upload.any(), async (req, res) => {
        const files = req.files || (req.file ? [req.file] : [])
        if (files.length === 0) return res.status(400).json({ error: 'No files uploaded' })

        console.log(`[UPLOAD] Uploaded ${files.length} files to ${req.body.target}`)

        // Generate Thumbnails for Videos
        const uploadedFiles = []
        for (const file of files) {
            const isVideo = file.mimetype.startsWith('video/') || file.originalname.match(/\.(mp4|mov|avi|mkv|webm)$/i)
            // Check if target implies video
            const target = req.body.target
            const isVideoTarget = target.includes('video')

            if ((isVideo || isVideoTarget) && !target.includes('audio')) {
                const thumbnailsDir = join(file.destination, 'thumbnails')
                if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir, { recursive: true })

                const thumbPath = join(thumbnailsDir, `${file.filename}.jpg`)
                try {
                    await generateThumbnail(file.path, thumbPath)
                } catch (e) {
                    console.error('Thumbnail generation failed', e)
                }
            }
            uploadedFiles.push({ filename: file.filename, originalName: file.originalname })
        }

        res.json({ success: true, count: files.length, files: uploadedFiles })
    })

    return router
}
