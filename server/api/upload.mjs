import { Router } from 'express'
import multer from 'multer'
import { join } from 'path'
import fs from 'fs'

export function uploadRoutes(dataDir) {
    const router = Router()

    // Destinations mapping
    const targets = {
        'audio': join(dataDir, 'media/audio'),
        'video_bg': join(dataDir, 'media/background_videos'),
        'video_content': join(dataDir, 'media/content_videos'),
        'image_bg': join(dataDir, 'media/background_images'),
        'image_content': join(dataDir, 'media/content_images'),
        'bible': join(dataDir, 'scriptures') // Assuming direct upload for now
    }

    // Ensure dirs exist
    Object.values(targets).forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    })

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const targetKey = req.body.target
            const dest = targets[targetKey] || join(dataDir, 'uploads') // Fallback
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
            cb(null, dest)
        },
        filename: (req, file, cb) => {
            // Keep original name but sanitize?
            cb(null, file.originalname)
        }
    })

    const upload = multer({ storage })

    router.post('/upload', upload.single('file'), (req, res) => {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

        console.log(`[UPLOAD] Uploaded ${req.file.originalname} to ${req.body.target}`)
        res.json({ success: true, filename: req.file.originalname })
    })

    return router
}
