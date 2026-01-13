import fs from 'fs'
import { join, basename, extname } from 'path'

// === HELPERS ===

function getFiles(dir, extensions) {
    if (!fs.existsSync(dir)) return []
    try {
        return fs.readdirSync(dir)
            .filter(file => extensions.some(ext => file.toLowerCase().endsWith(ext)))
            .map(file => ({
                name: file,
                path: join(dir, file),
                filename: file
            }))
    } catch (e) {
        console.error(`Failed to read dir ${dir}:`, e)
        return []
    }
}

function getSubdirectories(dir) {
    if (!fs.existsSync(dir)) return []
    try {
        return fs.readdirSync(dir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => ({
                name: dirent.name,
                path: join(dir, dirent.name)
            }))
    } catch (e) {
        console.error(`Failed to read subdirectories of ${dir}:`, e)
        return []
    }
}

// === SCANNERS ===

export const Scanners = {
    // --- SONGS ---
    scanSongs(dataDir) {
        const dir = join(dataDir, 'songs')
        const files = getFiles(dir, ['.json'])

        return files.map(file => {
            try {
                const content = JSON.parse(fs.readFileSync(file.path, 'utf-8'))
                return {
                    id: content.id,
                    title: content.title,
                    artist: content.artist,
                    variations: content.variations || [],
                    // Flatten lyrics for search optimization
                    searchContent: [
                        content.artist || '',
                        ...(content.parts || []).map(p => p.slides.join(' '))
                    ].join(' '),
                    _filename: file.filename
                }
            } catch (e) {
                console.warn(`Failed to parse song ${file.filename}`, e)
                return null
            }
        }).filter(Boolean).sort((a, b) => a.title.localeCompare(b.title))
    },

    // --- SCHEDULES ---
    scanSchedules(dataDir) {
        const dir = join(dataDir, 'schedules')
        const files = getFiles(dir, ['.json'])

        return files.map(file => {
            try {
                const content = JSON.parse(fs.readFileSync(file.path, 'utf-8'))
                return {
                    name: file.filename.replace('.json', ''),
                    filename: file.filename,
                    date: content.date || null,
                    itemCount: content.items?.length || 0
                }
            } catch {
                return null
            }
        }).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))
    },

    // --- MEDIA (Generic) ---
    scanMedia(dataDir, subpath, mountPath = '/media') {
        const dir = join(dataDir, 'media', subpath)
        // Common extensions for images and videos
        const extensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.jpg', '.jpeg', '.png', '.webp', '.gif']

        const files = getFiles(dir, extensions)

        return files.map(file => {
            const isVideo = ['.mp4', '.webm', '.mov', '.avi', '.mkv'].some(ext => file.filename.toLowerCase().endsWith(ext))
            const urlPath = `${mountPath}/${subpath}/${file.filename}`

            let thumbnail = urlPath // Default to self

            if (isVideo) {
                // Check for thumb
                const thumbDir = join(dir, 'thumbnails')
                const thumbName = `${file.filename}.jpg`
                if (fs.existsSync(join(thumbDir, thumbName))) {
                    thumbnail = `${mountPath}/${subpath}/thumbnails/${thumbName}`
                }
            }

            return {
                name: file.filename,
                path: urlPath, // Web-accessible path
                thumbnail,
                type: isVideo ? 'video' : 'image'
            }
        })
    },

    // --- SLIDES ---
    scanSlides(dataDir) {
        const slidesDir = join(dataDir, 'slides')
        const types = ['local_slides', 'image_slides', 'canva_slides']
        let allSlides = []

        types.forEach(type => {
            const typeDir = join(slidesDir, type)
            const sets = getSubdirectories(typeDir)

            sets.forEach(set => {
                const dataPath = join(set.path, 'data.json')
                if (fs.existsSync(dataPath)) {
                    try {
                        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
                        allSlides.push({
                            ...data,
                            _path: set.path, // Internal server path
                            _typeSubfolder: type // e.g. 'local_slides'
                        })
                    } catch (e) {
                        console.warn(`Failed to parse slide meta for ${set.name}`, e)
                    }
                }
            })
        })

        return allSlides
    },

    // --- SCRIPTURES ---
    scanScriptures(dataDir) {
        const dir = join(dataDir, 'scriptures')
        const files = getFiles(dir, ['.json'])

        return files.map(file => {
            try {
                const content = JSON.parse(fs.readFileSync(file.path, 'utf-8'))
                return {
                    id: content.id || file.filename.replace('.json', ''),
                    name: content.name,
                    // Don't load full content into list, just metadata
                    _filename: file.filename
                }
            } catch {
                return null
            }
        }).filter(Boolean)
    }
}
