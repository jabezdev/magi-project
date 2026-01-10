/**
 * Slide Navigation and Helper Utilities
 */

import type { Song, SlidePosition, PartType } from '../types'

export interface FlatSlide {
  position: SlidePosition
  partId: PartType
  partLabel: string
  text: string
  isFirstInPart: boolean
}

/**
 * Get the text content of a specific slide
 */
export function getSlideText(song: Song, variation: number, position: SlidePosition): string | null {
  const v = song.variations[variation]
  if (!v) return null
  
  const partId = v.arrangement[position.partIndex]
  if (!partId) return null
  
  const part = song.parts.find(p => p.id === partId)
  if (!part) return null
  
  return part.slides[position.slideIndex] || null
}

/**
 * Get the label for a part at a given index
 */
export function getPartLabel(song: Song, variation: number, partIndex: number): string {
  const v = song.variations[variation]
  if (!v) return ''
  
  const partId = v.arrangement[partIndex]
  const part = song.parts.find(p => p.id === partId)
  
  return part?.label || partId?.toUpperCase() || ''
}

/**
 * Get the total number of slides in a variation
 */
export function getTotalSlides(song: Song, variation: number): number {
  const v = song.variations[variation]
  if (!v) return 0
  
  let total = 0
  for (const partId of v.arrangement) {
    const part = song.parts.find(p => p.id === partId)
    if (part) total += part.slides.length
  }
  
  return total
}

/**
 * Get the current slide number (1-indexed)
 */
export function getCurrentSlideNumber(song: Song, variation: number, position: SlidePosition): number {
  const v = song.variations[variation]
  if (!v) return 0
  
  let count = 0
  for (let i = 0; i < position.partIndex; i++) {
    const partId = v.arrangement[i]
    const part = song.parts.find(p => p.id === partId)
    if (part) count += part.slides.length
  }
  
  return count + position.slideIndex + 1
}

/**
 * Get the next slide position, or null if at the end
 */
export function getNextPosition(song: Song, variation: number, position: SlidePosition): SlidePosition | null {
  const v = song.variations[variation]
  if (!v) return null
  
  const partId = v.arrangement[position.partIndex]
  const part = song.parts.find(p => p.id === partId)
  if (!part) return null
  
  // Next slide in same part
  if (position.slideIndex < part.slides.length - 1) {
    return { partIndex: position.partIndex, slideIndex: position.slideIndex + 1 }
  }
  
  // First slide in next part
  if (position.partIndex < v.arrangement.length - 1) {
    return { partIndex: position.partIndex + 1, slideIndex: 0 }
  }
  
  return null
}

/**
 * Get the previous slide position, or null if at the beginning
 */
export function getPrevPosition(song: Song, variation: number, position: SlidePosition): SlidePosition | null {
  const v = song.variations[variation]
  if (!v) return null
  
  // Previous slide in same part
  if (position.slideIndex > 0) {
    return { partIndex: position.partIndex, slideIndex: position.slideIndex - 1 }
  }
  
  // Last slide in previous part
  if (position.partIndex > 0) {
    const prevPartId = v.arrangement[position.partIndex - 1]
    const prevPart = song.parts.find(p => p.id === prevPartId)
    if (prevPart) {
      return { partIndex: position.partIndex - 1, slideIndex: prevPart.slides.length - 1 }
    }
  }
  
  return null
}

/**
 * Get all slides as a flat list with their positions and metadata
 */
export function getAllSlides(song: Song, variation: number): FlatSlide[] {
  const v = song.variations[variation]
  if (!v) return []
  
  const slides: FlatSlide[] = []
  
  v.arrangement.forEach((partId, partIndex) => {
    const part = song.parts.find(p => p.id === partId)
    if (part) {
      part.slides.forEach((text, slideIndex) => {
        slides.push({
          position: { partIndex, slideIndex },
          partId,
          partLabel: part.label,
          text,
          isFirstInPart: slideIndex === 0
        })
      })
    }
  })
  
  return slides
}
