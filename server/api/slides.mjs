import { Router } from 'express'
import fs from 'fs'
import { join } from 'path'
import { sharedState } from '../state.mjs'
import { Scanners } from '../scanners.mjs'
import { upload, sanitizeFilename } from './utils.mjs'

export function slidesRoutes(dataDir) {
    const router = Router()
    const slidesDir = join(dataDir, 'slides')

    // Helper to refresh state
    const refreshSlides = () => {
        try {
            const items = Scanners.scanSlides(dataDir)
            sharedState.availableSlides = items
            return items
        } catch (e) {
            console.error('Failed to refresh slides:', e)
            return []
        }
    }

    // List Slides
    router.get('/', (req, res) => {
        const items = refreshSlides()
        res.json(items)
    })

    // Refresh Slides
    router.post('/refresh', (req, res) => {
        const items = refreshSlides()
        res.json(items)
    })

    // Create Slide Group (Folder)
    router.post('/groups', (req, res) => {
        try {
            const { name, type = 'local_slides' } = req.body
            if (!name) return res.status(400).json({ error: 'Name required' })

            const safeName = sanitizeFilename(name)
            const targetDir = join(slidesDir, type, safeName)

            if (fs.existsSync(targetDir)) {
                return res.status(409).json({ error: 'Group already exists' })
            }

            fs.mkdirSync(targetDir, { recursive: true })
            // Initialize data.json for the group
            const initialData = {
                title: name,
                slides: []
            }
            fs.writeFileSync(join(targetDir, 'data.json'), JSON.stringify(initialData, null, 2))

            refreshSlides()
            res.json({ success: true, name: safeName, path: `/slides/${type}/${safeName}` })
        } catch (error) {
            console.error('Failed to create slide group:', error)
            res.status(500).json({ error: 'Failed to create slide group' })
        }
    })

    // Rename Slide Group
    router.put('/groups/:type/:name', (req, res) => {
        try {
            const { type, name } = req.params
            const { newName } = req.body
            if (!newName) return res.status(400).json({ error: 'New name required' })

            const safeNewName = sanitizeFilename(newName)
            const oldPath = join(slidesDir, type, name)
            const newPath = join(slidesDir, type, safeNewName)

            if (fs.existsSync(newPath)) {
                return res.status(409).json({ error: 'Target name already exists' })
            }

            if (fs.existsSync(oldPath)) {
                fs.renameSync(oldPath, newPath)

                // Update data.json title too
                const dataPath = join(newPath, 'data.json')
                if (fs.existsSync(dataPath)) {
                    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
                    data.title = newName
                    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
                }

                refreshSlides()
                res.json({ success: true, newName: safeNewName })
            } else {
                res.status(404).json({ error: 'Group not found' })
            }
        } catch (error) {
            console.error('Failed to rename slide group:', error)
            res.status(500).json({ error: 'Failed to rename slide group' })
        }
    })

    // Delete Slide Group
    router.delete('/groups/:type/:name', (req, res) => {
        try {
            const { type, name } = req.params
            const targetDir = join(slidesDir, type, name)

            if (fs.existsSync(targetDir)) {
                fs.rmSync(targetDir, { recursive: true, force: true })
                refreshSlides()
                res.json({ success: true })
            } else {
                res.status(404).json({ error: 'Group not found' })
            }
        } catch (error) {
            console.error('Failed to delete slide group:', error)
            res.status(500).json({ error: 'Failed to delete slide group' })
        }
    })

    // Upload Slide (Image) to Group
    // Route: /api/slides/:type/:group/upload
    // Note: 'upload' middleware destination needs to be dynamic or we move file here.
    // Our utils.mjs handles generic types, but for slides it has a placeholder.
    // Let's rely on moving the file from temp or just use a specific middleware instance here if we want?
    // Actually, utils.mjs middleware is simple. It uses req.params.
    // If we define route as /:type/:group/upload, req.params.group is available.
    // Let's modify utils.mjs middleware to support this or just update it now?
    // I can stick to a simpler pattern: upload to temp, then move. 
    // OR: Update utils.mjs to handle this specific structure. 
    // The previous utils.mjs edit had a placeholder: `if (req.params.group) { ... }`.
    // I will update utils.mjs to map `req.params.group` and `req.params.type` correctly for slides.

    router.post('/:type/:group/upload', upload.single('file'), (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' })
            }

            // File is uploaded to data/media/temp or similar per utils.mjs logic?
            // Actually utils.mjs needs to act correctly. 
            // If utils.mjs didn't put it in the right place, we need to move it.
            // Let's assume for now utils.mjs puts it in `data/slides/{type}/{group}` 
            // OR we move it from `data/temp`.
            // I'll check utils.mjs logic again. 
            // Better yet, I'll update utils.mjs right after this to support this route accurately.

            // After upload, we need to update data.json of the group to include this slide?
            // OR the scanner just picks it up?
            // "image_slides" usually imply a folder of images.
            // "local_slides" use data.json for explicit ordering/text.
            // If it's image_slides, adding file is enough.
            // If it's local_slides, we might need to add it to data.json slides array.

            const { type, group } = req.params
            const filename = req.file.filename // Generic UUID name from multer

            const groupDir = join(slidesDir, type, group)
            const dataPath = join(groupDir, 'data.json')

            if (fs.existsSync(dataPath)) {
                const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
                // For image_slides, we assume the scanner just reads files. 
                // BUT the scanner logic provided earlier for 'image_slides' reads subdirectories and data.json.
                // It doesn't seem to list images individually in scanner?
                // Let's check scanner logic... 
                // Scanner just returns the set metadata. Client likely fetches images via static serve?
                // The client probably lists files in that directory? No, API usually returns items.
                // The scanner `scanSlides` returns generic objects.

                // If it's a slide deck of images, we probably should add it to the 'slides' array in data.json
                // with type 'image' and path.

                data.slides.push({
                    type: 'image',
                    path: `/slides/${type}/${group}/${filename}`, // URL path
                    id: filename.split('-')[0] // UUID prefix
                })
                fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
            }

            refreshSlides()
            res.json({ success: true, file: filename })
        } catch (error) {
            console.error('Slide upload failed:', error)
            res.status(500).json({ error: 'Slide upload failed' })
        }
    })

    // Delete Slide from Group
    router.delete('/:type/:group/:filename', (req, res) => {
        try {
            const { type, group, filename } = req.params
            const filePath = join(slidesDir, type, group, filename)

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)

                // Remove from data.json
                const dataPath = join(slidesDir, type, group, 'data.json')
                if (fs.existsSync(dataPath)) {
                    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
                    data.slides = data.slides.filter(s => !s.path.includes(filename))
                    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
                }

                refreshSlides()
                res.json({ success: true })
            } else {
                res.status(404).json({ error: 'File not found' })
            }
        } catch (error) {
            console.error('Delete slide failed:', error)
            res.status(500).json({ error: 'Delete slide failed' })
        }
    })

    // Update Slide Group Data (Slides, Title, Settings)
    router.put('/:type/:name', (req, res) => {
        try {
            const { type, name } = req.params
            const { slides, title } = req.body

            const targetDir = join(slidesDir, type, name)
            const dataPath = join(targetDir, 'data.json')

            if (!fs.existsSync(dataPath)) {
                return res.status(404).json({ error: 'Slide deck not found' })
            }

            const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

            if (title) data.title = title
            if (slides) data.slides = slides

            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))

            refreshSlides()
            res.json({ success: true })
        } catch (error) {
            console.error('Failed to update slide deck:', error)
            res.status(500).json({ error: 'Failed to update slide deck' })
        }
    })

    return router
}
