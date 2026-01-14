/**
 * Content Hydration Utilities
 * 
 * Converts any ProjectableItem into a flat array of ContentSlides
 * for unified rendering in Preview/Live panels and screens.
 */

import type {
    ProjectableItem,
    ContentSlide,
    Song,
    SongItem,
    SlideItem,
    ScriptureItem,
    VideoItem,
    ImageItem,
    AudioItem
} from '../types'
import { fetchSongById } from '../services/api'

/**
 * Hydrate a ProjectableItem into ContentSlide[]
 * This is the main entry point for content hydration.
 */
export async function hydrateContent(item: ProjectableItem): Promise<ContentSlide[]> {
    switch (item.type) {
        case 'song':
            return hydrateSong(item)

        case 'slide':
            return hydrateSlides(item)

        case 'scripture':
            return hydrateScripture(item)

        case 'video':
            return hydrateVideo(item)

        case 'image':
            return hydrateImage(item)

        case 'audio':
            return hydrateAudio(item)

        default:
            console.warn('Unknown item type for hydration:', (item as any).type)
            return []
    }
}

/**
 * Hydrate a SongItem by fetching full song data and flattening arrangement
 */
async function hydrateSong(item: SongItem): Promise<ContentSlide[]> {
    const song = await fetchSongById(item.songId)
    if (!song) {
        console.warn('Failed to fetch song:', item.songId)
        return []
    }

    return flattenSongToSlides(song, item.variationId)
}

/**
 * Flatten a Song's arrangement into ContentSlide[]
 */
export function flattenSongToSlides(song: Song, variationId: number): ContentSlide[] {
    const variation = song.variations.find(v => v.id === variationId) || song.variations[0]
    if (!variation) {
        console.warn('No variation found for song:', song.id)
        return []
    }

    const slides: ContentSlide[] = []
    let index = 0

    for (const partId of variation.arrangement) {
        const part = song.parts.find(p => p.id === partId)
        if (!part) continue

        for (let slideIdx = 0; slideIdx < part.slides.length; slideIdx++) {
            const slideText = part.slides[slideIdx]
            slides.push({
                id: `${song.id}-${partId}-${slideIdx}`,
                index,
                type: 'text',
                content: slideText,
                label: part.label,
                partId: partId
            })
            index++
        }
    }

    return slides
}

/**
 * Convert SlideItem's slides to ContentSlide[]
 */
function hydrateSlides(item: SlideItem): ContentSlide[] {
    return item.slides.map((slide, index) => ({
        id: slide.id || `slide-${index}`,
        index,
        type: slide.type,
        content: slide.type === 'image' ? (slide.path || slide.content) : slide.content,
        thumbnail: slide.type === 'image' ? (slide.path || slide.content) : undefined
    }))
}

/**
 * Convert ScriptureItem's verses to ContentSlide[]
 */
function hydrateScripture(item: ScriptureItem): ContentSlide[] {
    return item.verses.map((verse, index) => ({
        id: `${item.id}-verse-${verse.number}`,
        index,
        type: 'text',
        content: verse.text,
        label: `${item.reference}:${verse.number}`
    }))
}

/**
 * Video becomes a single ContentSlide
 */
function hydrateVideo(item: VideoItem): ContentSlide[] {
    return [{
        id: `${item.id}-main`,
        index: 0,
        type: 'video',
        content: item.url,
        thumbnail: item.thumbnail || undefined
    }]
}

/**
 * Image becomes a single ContentSlide
 */
function hydrateImage(item: ImageItem): ContentSlide[] {
    return [{
        id: `${item.id}-main`,
        index: 0,
        type: 'image',
        content: item.url,
        thumbnail: item.thumbnail || undefined
    }]
}

/**
 * Audio becomes a single ContentSlide
 */
function hydrateAudio(item: AudioItem): ContentSlide[] {
    return [{
        id: `${item.id}-main`,
        index: 0,
        type: 'audio',
        content: item.url
    }]
}

/**
 * Helper: Get content slide at a given index
 */
export function getContentSlide(content: ContentSlide[], index: number): ContentSlide | null {
    return content[index] || null
}

/**
 * Helper: Find the next slide index, respecting content bounds
 */
export function getNextSlideIndex(content: ContentSlide[], currentIndex: number): number | null {
    if (currentIndex < content.length - 1) {
        return currentIndex + 1
    }
    return null
}

/**
 * Helper: Find the previous slide index, respecting content bounds  
 */
export function getPrevSlideIndex(content: ContentSlide[], currentIndex: number): number | null {
    if (currentIndex > 0) {
        return currentIndex - 1
    }
    return null
}

/**
 * Helper: Group content slides by partId (for songs) or return ungrouped for other types
 */
export function groupSlidesByPart(content: ContentSlide[]): Map<string, ContentSlide[]> {
    const groups = new Map<string, ContentSlide[]>()

    for (const slide of content) {
        const key = slide.partId || '_ungrouped'
        if (!groups.has(key)) {
            groups.set(key, [])
        }
        groups.get(key)!.push(slide)
    }

    return groups
}
