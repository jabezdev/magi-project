import { v4 as uuidv4 } from 'uuid'
import multer from 'multer'
import { join, extname } from 'path'
import fs from 'fs'

export function sanitizeFilename(str) {
    return str.replace(/[^a-z0-9]/gi, '-').toLowerCase()
}

import { exec } from 'child_process'

export function generateId() {
    return uuidv4()
}

export function generateThumbnail(videoPath, thumbnailPath) {
    return new Promise((resolve, reject) => {
        // Generate a thumbnail at 1 second mark, size 320x?
        const command = `ffmpeg -i "${videoPath}" -ss 00:00:01.000 -vframes 1 -vf scale=320:-1 "${thumbnailPath}" -y`
        exec(command, (error) => {
            if (error) {
                console.error(`Failed to generate thumbnail for ${videoPath}:`, error)
                // Resolve anyway to not block response, just no thumb
                resolve(false)
            } else {
                resolve(true)
            }
        })
    })
}

// Dynamic storage engine based on 'type' param
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const type = req.params.type
        let folder = 'temp'

        // Media types
        if (['background_videos', 'content_videos', 'background_images', 'content_images'].includes(type)) {
            folder = `media/${type}`
        }

        // Slide uploads (param might be 'group' or 'set' but route is /slides/:group/upload)
        // If the route is /api/slides/:group/upload, req.params.group is available
        // Slide uploads
        if (req.params.group && req.params.type) {
            const { type, group } = req.params
            folder = `slides/${type}/${group}`
        }

        const uploadPath = join(process.cwd(), 'data', folder)
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true })
        }
        cb(null, uploadPath)
    },
    filename: function (req, file, cb) {
        const uniquePrefix = uuidv4()
        const ext = extname(file.originalname)
        const nameBody = file.originalname.replace(ext, '')
        const safeName = sanitizeFilename(nameBody)
        cb(null, `${uniquePrefix}-${safeName}${ext}`)
    }
})

export const upload = multer({ storage: storage })

