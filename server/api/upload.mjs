import { Router } from 'express'
import multer from 'multer'
import { join } from 'path'
import fs from 'fs'
import { generateThumbnail } from './utils.mjs'
import { AssetStore } from '../lib/asset_store.mjs'

export function uploadRoutes(dataDir) {
    const router = Router()

    const assetStore = new AssetStore(join(dataDir, 'library'))

    // Multer now just dumps to a temp folder, we ingest immediately
    const uploadTemp = join(dataDir, 'temp_uploads')
    if (!fs.existsSync(uploadTemp)) fs.mkdirSync(uploadTemp, { recursive: true })

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadTemp)
        },
        filename: (req, file, cb) => {
            // Keep original name for temp to help debug
            cb(null, `${Date.now()}-${file.originalname}`)
        }
    })

    const upload = multer({ storage })

    router.post('/upload', upload.any(), async (req, res) => {
        const files = req.files || (req.file ? [req.file] : [])
        if (files.length === 0) return res.status(400).json({ error: 'No files uploaded' })

        console.log(`[UPLOAD] Uploaded ${files.length} files to ${req.body.target}`)

        // Ingest into CAS
        const uploadedFiles = []
        for (const file of files) {
            try {
                // Ingest moves the file from temp to library/assets/...
                const assetInfo = await assetStore.ingest(file.path, file.originalname)

                // Generate Thumbnails? 
                // We'd need to know the 'final' path in the CAS to generate a thumb.
                // AssetStore returns 'path' relative to DATA_ROOT (e.g. library/assets/xx/...)
                // We can construct absolute path for thumbnailer

                const absolutePath = join(dataDir, assetInfo.path)
                const isVideo = file.mimetype.startsWith('video/') || file.originalname.match(/\.(mp4|mov|avi|mkv|webm)$/i)

                // if (isVideo) {
                // TODO: Implement CAS-aware thumbnail storage
                // Ideally thumbnails also go into CAS or a parallel 'thumbnails' CAS
                // }

                uploadedFiles.push({
                    filename: file.originalname, // We show original name
                    originalName: file.originalname,
                    ...assetInfo,
                    // AssetInfo.path is "library/assets/xx/hash.ext"
                    // We map that to /assets/xx/hash.ext via getWebPath logic
                    path: getWebPath(assetInfo.path)
                })
            } catch (e) {
                console.error('Ingest failed', e)
            }
        }

        res.json({ success: true, count: files.length, files: uploadedFiles })
    })

    return router
}

function getWebPath(relativePath) {
    // relativePath is like "library/assets/a1/a1b2c3... .jpg"
    // Our server serves "data/library/assets" at "/assets"

    // So we need to strip "library/assets"
    // and prepend "/assets"

    // Normalize separaters
    const normalized = relativePath.replace(/\\/g, '/')

    if (normalized.includes('library/assets/')) {
        return normalized.replace('library/assets/', '/assets/')
    }

    // Fallback
    return '/' + normalized
}
