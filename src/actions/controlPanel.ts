/**
 * Control Panel Actions
 * 
 * Functions for handling user interactions on the control panel.
 * Uses efficient state updates that skip full re-renders when possible.
 */

import type { Song, SlidePosition, DisplayMode } from '../types'
import { state, updateState } from '../state'
import { socketService } from '../services/socket'
import { getNextPosition, getPrevPosition } from '../utils/slides'

/**
 * Select a song for preview
 * Requires full re-render since song content changes
 */
export function selectSongForPreview(song: Song, variationIndex = 0): void {
  state.previewSong = song
  state.previewVariation = variationIndex
  state.previewPosition = { partIndex: 0, slideIndex: 0 }
  updateState({})
}

/**
 * Select a position in the preview
 * Uses efficient update - only slide selection changes
 */
export function selectPreviewPosition(position: SlidePosition): void {
  state.previewPosition = position
  updateState({ previewPosition: position }, true) // Skip full re-render
}

/**
 * Select a variation for the preview song
 * Requires full re-render since arrangement changes
 */
export function selectPreviewVariation(index: number): void {
  state.previewVariation = index
  state.previewPosition = { partIndex: 0, slideIndex: 0 }
  updateState({})
}

/**
 * Send the current preview to live
 * Requires full re-render to update live column
 */
export function goLive(): void {
  if (!state.previewSong) return

  state.liveSong = state.previewSong
  state.liveVariation = state.previewVariation
  state.livePosition = { ...state.previewPosition }
  state.displayMode = 'lyrics'

  socketService.updateSlide({
    song: state.liveSong,
    variation: state.liveVariation,
    position: state.livePosition
  })
  socketService.updateDisplayMode('lyrics')

  updateState({})
}

/**
 * Update the live position
 * Uses efficient update when song hasn't changed
 */
export function goLiveWithPosition(position: SlidePosition): void {
  if (!state.liveSong) return

  state.livePosition = position
  socketService.updateSlide({
    song: state.liveSong,
    variation: state.liveVariation,
    position: state.livePosition
  })

  updateState({ livePosition: position }, true) // Skip full re-render
}

/**
 * Select a background video
 * Uses efficient update
 */
export function selectVideo(path: string): void {
  state.backgroundVideo = path
  socketService.updateVideo(path)
  updateState({ backgroundVideo: path }, true) // Skip full re-render
}

/**
 * Set the display mode
 * Uses efficient update
 */
export function setDisplayMode(mode: DisplayMode): void {
  state.displayMode = mode
  socketService.updateDisplayMode(mode)
  updateState({ displayMode: mode }, true) // Skip full re-render
}

/**
 * Go to next live slide
 * Uses efficient update
 */
export function nextSlide(): void {
  if (!state.liveSong) return
  const next = getNextPosition(state.liveSong, state.liveVariation, state.livePosition)
  if (next) goLiveWithPosition(next)
}

/**
 * Go to previous live slide
 * Uses efficient update
 */
export function prevSlide(): void {
  if (!state.liveSong) return
  const prev = getPrevPosition(state.liveSong, state.liveVariation, state.livePosition)
  if (prev) goLiveWithPosition(prev)
}

/**
 * Go to next preview slide
 * Uses efficient update
 */
export function nextPreviewSlide(): void {
  if (!state.previewSong) return
  const next = getNextPosition(state.previewSong, state.previewVariation, state.previewPosition)
  if (next) selectPreviewPosition(next)
}

/**
 * Go to previous preview slide
 * Uses efficient update
 */
export function prevPreviewSlide(): void {
  if (!state.previewSong) return
  const prev = getPrevPosition(state.previewSong, state.previewVariation, state.previewPosition)
  if (prev) selectPreviewPosition(prev)
}

// Re-export findSongById for convenience
// export { findSongById } 
