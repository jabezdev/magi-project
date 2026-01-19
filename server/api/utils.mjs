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
        // console.log('[FFMPEG] Running:', command)
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`[FFMPEG] Failed for ${videoPath}:`, error)
                resolve(false)
            } else {
                // Verify file existence and size
                if (fs.existsSync(thumbnailPath) && fs.statSync(thumbnailPath).size > 0) {
                    resolve(true)
                } else {
                    console.error('[FFMPEG] File missing or empty after generation:', thumbnailPath)
                    resolve(false)
                }
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


// Helper to Retroactively generate thumbnails
export async function scanAndGenerateThumbnails(dataDir, libraryStore) {
    console.log('[THUMBNAIL] Starting library scan for missing thumbnails...')
    try {
        // Fix: list('all') tries to find items with type === 'all'. Pass null to get everything.
        const items = libraryStore.list(null)
        const libraryRoot = join(dataDir, 'library')
        let generatedCount = 0

        console.log(`[THUMBNAIL] Found ${items.length} items in library.`)

        for (const item of items) {
            // console.log(`[THUMBNAIL] Inspecting ${item.id} (${item.type}): ${item.title}`)
            if (item.type !== 'video') continue

            // Resolve Paths
            const sourceUrl = (item).source_url
            if (!sourceUrl) {
                console.log(`[THUMBNAIL] Video ${item.title} has no source_url. Skipping.`)
                continue
            }

            // Determine Video FS Path - STRICTLY Unified Architecture
            let videoFsPath = null
            if (sourceUrl.startsWith('/assets/')) {
                const rel = sourceUrl.replace(/^\/assets\//, 'assets/')
                videoFsPath = join(libraryRoot, rel)
            } else {
                console.log(`[THUMBNAIL] Video ${item.title} has non-standard path: ${sourceUrl}. Skipping.`)
                continue
            }

            if (!fs.existsSync(videoFsPath)) {
                console.log(`[THUMBNAIL] Video file missing on disk: ${videoFsPath}`)
                continue
            }

            // Determine Desired Thumbnail Path
            const thumbFsPath = videoFsPath.replace(/\.[^/.]+$/, '.jpg')
            const thumbWebPath = sourceUrl.replace(/\.[^/.]+$/, '.jpg')

            // State Check
            const currentThumbPath = (item).thumbnail_path

            // Check if what looks like a stored thumbnail is actually valid (ends in .jpg)
            // Previously, some logic might have set it to the .mp4 path erroneously.
            const hasValidThumbLink = currentThumbPath && currentThumbPath.endsWith('.jpg') && currentThumbPath === thumbWebPath
            const hasThumbOnDisk = fs.existsSync(thumbFsPath) && fs.statSync(thumbFsPath).size > 0

            if (hasValidThumbLink && hasThumbOnDisk) {
                // All good
                continue
            }

            // Case: We have the file, but the link is missing or invalid (e.g. points to .mp4)
            if (hasThumbOnDisk && !hasValidThumbLink) {
                const newItem = { ...item, thumbnail_path: thumbWebPath }
                libraryStore.update(item.id, newItem, 'System', 'server', 'Link existing thumbnail (Correction)')
                console.log(`[THUMBNAIL] Linked existing thumbnail for "${item.title}" (Correction)`)
                generatedCount++
                continue
            }

            // Case: File missing -> Generate it
            if (!hasThumbOnDisk) {
                console.log(`[THUMBNAIL] Generating thumbnail for "${item.title}"...`)
                const success = await generateThumbnail(videoFsPath, thumbFsPath)
                if (success) {
                    if (!hasThumbInStore) {
                        const newItem = { ...item, thumbnail_path: thumbWebPath }
                        libraryStore.update(item.id, newItem, 'System', 'server', 'Generated Thumbnail')
                        console.log(`[THUMBNAIL] Generated & Linked for "${item.title}"`)
                    } else {
                        console.log(`[THUMBNAIL] Refreshed file for "${item.title}"`)
                    }
                    generatedCount++
                } else {
                    console.error(`[THUMBNAIL] Failed to generate for "${item.title}"`)
                }
            }
        }
        console.log(`[THUMBNAIL] Scan complete. Processed ${generatedCount} items.`)
    } catch (e) {
        console.error('[THUMBNAIL] Scan failed:', e)
    }
}
