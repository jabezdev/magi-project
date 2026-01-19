import { SongItem, SongPart } from '../types'

/**
 * Represents a single slide derived from splitting song parts by blank lines
 */
export interface FlattenedSlide {
    partId: string
    partLabel: string
    partType: string
    slideIndexInPart: number  // Index within the part (0-based)
    globalIndex: number       // Index across all slides (0-based)
    text: string
    backgroundOverrideId?: string
}

/**
 * Color mapping for part types
 */
export const PART_TYPE_COLORS: Record<string, string> = {
    'Intro': 'bg-emerald-600',
    'Verse': 'bg-blue-600',
    'Pre-Chorus': 'bg-violet-600',
    'Chorus': 'bg-rose-600',
    'Bridge': 'bg-amber-600',
    'Tag': 'bg-yellow-500',
    'Coda': 'bg-cyan-600',
    'Ending': 'bg-slate-600'
}

/**
 * Split lyrics into slides based on blank lines
 * A blank line is defined as a line containing only whitespace
 */
export function splitLyricsIntoSlides(lyrics: string): string[] {
    if (!lyrics || !lyrics.trim()) return []

    // Split on one or more blank lines (lines that are empty or whitespace-only)
    return lyrics
        .split(/\n\s*\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
}

/**
 * Flatten a song's parts into individual slides based on blank-line splitting.
 * Uses the arrangement if available, otherwise uses parts in order.
 */
export function flattenSongToSlides(song: SongItem, arrangementId?: string): FlattenedSlide[] {
    const slides: FlattenedSlide[] = []
    let globalIndex = 0

    // Determine which parts to use based on arrangement
    let orderedParts: SongPart[] = []

    if (arrangementId) {
        const arrangement = song.arrangements?.find(a => a.id === arrangementId)
        if (arrangement && arrangement.sequence.length > 0) {
            arrangement.sequence.forEach(partId => {
                const part = song.parts.find(p => p.id === partId)
                if (part) orderedParts.push(part)
            })
        }
    }

    // If no arrangement or empty, use default arrangement or all parts
    if (orderedParts.length === 0) {
        const defaultArr = song.arrangements?.find(a => a.is_default)
        if (defaultArr && defaultArr.sequence.length > 0) {
            defaultArr.sequence.forEach(partId => {
                const part = song.parts.find(p => p.id === partId)
                if (part) orderedParts.push(part)
            })
        } else {
            orderedParts = song.parts || []
        }
    }

    // Flatten each part into slides
    orderedParts.forEach(part => {
        const partSlides = splitLyricsIntoSlides(part.lyrics)

        // If no slides from splitting, create one slide with the entire lyrics (or empty)
        if (partSlides.length === 0) {
            slides.push({
                partId: part.id,
                partLabel: part.label,
                partType: part.type,
                slideIndexInPart: 0,
                globalIndex: globalIndex++,
                text: '',
                backgroundOverrideId: part.background_override_id
            })
        } else {
            partSlides.forEach((text, slideIndexInPart) => {
                // Suffix logic: .a, .b, .c if multiple slides
                const suffix = partSlides.length > 1
                    ? `.${String.fromCharCode(97 + slideIndexInPart)}`
                    : ''

                slides.push({
                    partId: part.id,
                    partLabel: `${part.label}${suffix}`,
                    partType: part.type,
                    slideIndexInPart,
                    globalIndex: globalIndex++,
                    text,
                    backgroundOverrideId: part.background_override_id
                })
            })
        }
    })

    return slides
}

/**
 * Get the color class for a part type
 */
export function getPartColor(partType: string): string {
    return PART_TYPE_COLORS[partType] || 'bg-zinc-600'
}
