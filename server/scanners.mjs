import fs from 'fs'
import { join, basename, extname } from 'path'
import { partial } from 'filesize'

const formatSize = partial({ standard: 'jedec' })

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
    // Returns: SongItem[]
    scanSongs(dataDir) {
        const dir = join(dataDir, 'songs')
        const files = getFiles(dir, ['.json'])

        return files.map(file => {
            try {
                const content = JSON.parse(fs.readFileSync(file.path, 'utf-8'))
                const defaultVariation = content.variations?.[0]?.id || 0

                // Build search content from parts
                const searchContent = [
                    content.artist || '',
                    ...(content.parts || []).map(p => p.slides.join(' '))
                ].join(' ')

                return {
                    // Base fields
                    id: String(content.id),
                    title: content.title,
                    subtitle: content.artist || '',
                    thumbnail: null,
                    // SongItem specific
                    type: 'song',
                    songId: content.id,
                    variationId: defaultVariation,
                    artist: content.artist || '',
                    searchContent: searchContent
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
    // Returns: (VideoItem | ImageItem)[]
    scanMedia(dataDir, subpath, mountPath = '/media') {
        const dir = join(dataDir, 'media', subpath)
        // Common extensions for images and videos
        const extensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.jpg', '.jpeg', '.png', '.webp', '.gif']

        const files = getFiles(dir, extensions)

        return files.map(file => {
            const isVideo = ['.mp4', '.webm', '.mov', '.avi', '.mkv'].some(ext => file.filename.toLowerCase().endsWith(ext))
            const urlPath = `${mountPath}/${subpath}/${file.filename}`

            let thumbnail = urlPath // Default to self for images

            if (isVideo) {
                // Check for thumbnail
                const thumbDir = join(dir, 'thumbnails')
                const thumbName = `${file.filename}.jpg`
                if (fs.existsSync(join(thumbDir, thumbName))) {
                    thumbnail = `${mountPath}/${subpath}/thumbnails/${thumbName}`
                } else {
                    thumbnail = null // No thumbnail for video
                }
            }

            let size = ''
            try {
                const stats = fs.statSync(file.path)
                size = formatSize(stats.size)
            } catch { }

            if (isVideo) {
                // VideoItem
                return {
                    id: urlPath,
                    type: 'video',
                    title: file.filename,
                    subtitle: size,
                    thumbnail: thumbnail,
                    url: urlPath,
                    duration: null, // Could be extracted with ffprobe
                    isYouTube: false,
                    loop: subpath.includes('background') // Background videos loop by default
                }
            } else {
                // ImageItem
                return {
                    id: urlPath,
                    type: 'image',
                    title: file.filename,
                    subtitle: size,
                    thumbnail: thumbnail,
                    url: urlPath
                }
            }
        })
    },

    // --- SLIDES ---
    // Returns: SlideItem[]
    scanSlides(dataDir) {
        const slidesDir = join(dataDir, 'slides')
        const typeMapping = {
            'local_slides': 'local',
            'image_slides': 'image',
            'canva_slides': 'canva'
        }
        const types = Object.keys(typeMapping)
        let allSlides = []

        types.forEach(type => {
            const typeDir = join(slidesDir, type)
            const sets = getSubdirectories(typeDir)

            sets.forEach(set => {
                const dataPath = join(set.path, 'data.json')
                if (fs.existsSync(dataPath)) {
                    try {
                        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

                        // Normalize slides array
                        const normalizedSlides = (data.slides || []).map((slide, idx) => ({
                            id: slide.id || `slide-${idx}`,
                            type: slide.type || 'text',
                            content: slide.content || slide.text || '',
                            path: slide.path || slide.content || null
                        }))

                        allSlides.push({
                            id: data.id || `slide-${set.name}`,
                            type: 'slide',
                            title: data.title || set.name,
                            subtitle: `${normalizedSlides.length} slides`,
                            thumbnail: normalizedSlides[0]?.type === 'image' ? normalizedSlides[0].path : null,
                            slides: normalizedSlides,
                            slideType: typeMapping[type]
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
    // Returns: ScriptureItem[]
    scanScriptures(dataDir) {
        const dir = join(dataDir, 'scriptures')
        const files = getFiles(dir, ['.json'])

        return files.map(file => {
            try {
                const content = JSON.parse(fs.readFileSync(file.path, 'utf-8'))
                return {
                    id: content.id || file.filename.replace('.json', ''),
                    type: 'scripture',
                    title: content.name || 'Scripture',
                    subtitle: content.abbreviation || 'Bible',
                    thumbnail: null,
                    reference: '', // Will be set when specific passage is selected
                    translation: content.name || 'Unknown',
                    verses: [] // Will be populated when passage is selected
                }
            } catch {
                return null
            }
        }).filter(Boolean)
    },

    // --- AUDIO ---
    // Returns: AudioItem[]
    scanAudio(dataDir) {
        const dir = join(dataDir, 'media', 'audio')
        const extensions = ['.mp3', '.wav', '.ogg', '.m4a']
        const files = getFiles(dir, extensions)

        return files.map(file => {
            const urlPath = `/media/audio/${file.filename}`

            let size = ''
            try {
                const stats = fs.statSync(file.path)
                size = formatSize(stats.size)
            } catch { }

            return {
                id: urlPath,
                type: 'audio',
                title: file.filename,
                subtitle: size || 'Audio',
                thumbnail: null,
                url: urlPath,
                duration: null // Could be extracted with audio metadata library
            }
        })
    },

    // --- YOUTUBE ---
    // Returns: VideoItem[]
    scanYouTube(dataDir) {
        const dbPath = join(dataDir, 'media', 'youtube_links.json')
        if (!fs.existsSync(dbPath)) return []

        try {
            const links = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
            return links.map(link => ({
                id: `youtube-${link.id}`,
                type: 'video',
                title: link.title || link.url,
                subtitle: 'YouTube',
                thumbnail: link.localThumbnail || link.thumbnail || null,
                url: link.url,
                duration: link.duration || null,
                isYouTube: true,
                loop: false
            }))
        } catch (e) {
            console.warn('Failed to scan YouTube links', e)
            return []
        }
    }
}
