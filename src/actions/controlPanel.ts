/**
 * Control Panel Actions
 * 
 * Functions for handling user interactions on the control panel.
 * Uses efficient state updates that skip full re-renders when possible.
 */

import type { Song, SlidePosition, DisplayMode } from '../types'
import { state, updateState } from '../state'
import { socketService } from '../services/socket'
import { fetchSongById } from '../services/api'
import { getNextPosition, getPrevPosition } from '../utils/slides'
import { saveSettings } from '../services/api'

/**
 * Select a song for preview
 * Requires full re-render since song content changes
 */
export function selectSongForPreview(song: Song, variationIndex = 0): void {
  const position = { partIndex: 0, slideIndex: 0 }
  updateState({
    previewSong: song,
    previewVariation: variationIndex,
    previewPosition: position
  }, true) // Skip full re-render

  // Sync preview to other screens (for Confidence Monitor look-ahead)
  socketService.emit('update-preview', {
    song,
    variation: variationIndex,
    position
  })
}

/**
 * Select a position in the preview
 * Uses efficient update - only slide selection changes
 */
export function selectPreviewPosition(position: SlidePosition): void {
  updateState({ previewPosition: position }, true) // Skip full re-render

  // Sync preview position to other screens (for Confidence Monitor look-ahead)
  socketService.emit('update-preview', {
    song: state.previewSong,
    variation: state.previewVariation,
    position
  })
}

/**
 * Select a variation for the preview song
 * Requires full re-render since arrangement changes
 */
export function selectPreviewVariation(index: number): void {
  updateState({
    previewVariation: index,
    previewPosition: { partIndex: 0, slideIndex: 0 }
  }, true) // Skip full re-render
}

/**
 * Send the current preview to live
 * Requires full re-render to update live column
 */
export async function goLive(): Promise<void> {
  if (!state.previewSong) return

  // Transition background video if they differ
  if (state.previewBackground && state.previewBackground !== state.backgroundVideo) {
    selectLiveVideo(state.previewBackground)
  }

  // Capture previous live state for transitions
  let previousState: Partial<typeof state> = {}
  if (state.liveSong) {
    previousState = {
      previousLiveSong: state.liveSong,
      previousLiveVariation: state.liveVariation,
      previousLivePosition: { ...state.livePosition }
    }
  }

  const newLiveState = {
    ...previousState,
    liveSong: state.previewSong,
    liveVariation: state.previewVariation,
    livePosition: { ...state.previewPosition },
  }

  socketService.updateSlide({
    song: newLiveState.liveSong,
    variation: newLiveState.liveVariation,
    position: newLiveState.livePosition
  })

  // Note: We do NOT force displayMode to 'lyrics' here anymore.
  // This allows Logo/Mode persistence as requested.

  updateState(newLiveState, true) // Skip full re-render

  // SCHEDULE PROGRESSION
  if (state.schedule && state.schedule.items) {
    // FIX: Get the actual variation ID from the current song and variation index
    const currentVariation = state.previewSong?.variations[state.previewVariation]
    const currentVariationId = currentVariation?.id

    console.log('[DEBUG] Autopilot - Song:', state.previewSong?.id, 'VarIndex:', state.previewVariation, 'VarID:', currentVariationId)
    console.log('[DEBUG] Schedule Items:', state.schedule.items)

    const currentIndex = state.schedule.items.findIndex(item => {
      const songMatch = item.songId === state.previewSong!.id

      let varMatch = false
      // 1. Direct ID match (loose equality for string/number)
      if (currentVariationId !== undefined && String(item.variationId) === String(currentVariationId)) {
        varMatch = true
      }
      // 2. Default fallback: If schedule says 'default' (or 0) and we are on the first variation (index 0)
      else if ((item.variationId === 'default' || item.variationId === 0) && state.previewVariation === 0) {
        varMatch = true
      }

      return songMatch && varMatch
    })

    if (currentIndex !== -1 && currentIndex < state.schedule.items.length - 1) {
      const nextItem = state.schedule.items[currentIndex + 1]
      try {
        const nextSong = await fetchSongById(nextItem.songId)
        if (nextSong) {
          let varIndex = 0
          if (nextItem.variationId) {
            const idx = nextSong.variations.findIndex(v => String(v.id) === String(nextItem.variationId))
            if (idx >= 0) varIndex = idx
          }
          selectSongForPreview(nextSong, varIndex)
        }
      } catch (e) {
        console.error("Failed to autopilot schedule", e)
      }
    }
  }
}

/**
 * Update the live position
 * Uses efficient update when song hasn't changed
 */
export function goLiveWithPosition(position: SlidePosition): void {
  if (!state.liveSong) return

  socketService.updateSlide({
    song: state.liveSong,
    variation: state.liveVariation,
    position: position
  })

  updateState({ livePosition: position }, true) // Skip full re-render
}

/**
 * Select a background video for PREVIEW
 * Uses efficient update
 */
export function selectPreviewVideo(path: string): void {
  updateState({ previewBackground: path }, true) // Skip full re-render
  saveSettings({ previewBackground: path }).catch(console.error)
}

/**
 * Select a background video for LIVE
 * Uses efficient update
 */
export function selectVideo(path: string): void {
  selectLiveVideo(path)
}

export function selectLiveVideo(path: string): void {
  socketService.updateVideo(path)
  updateState({ backgroundVideo: path }, true) // Skip full re-render
  // Save to server
  saveSettings({ backgroundVideo: path }).catch(console.error)
}

/**
 * Set the display mode
 * Uses efficient update
 */
export function setDisplayMode(mode: DisplayMode): void {
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
