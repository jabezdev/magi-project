/**
 * Control Panel Actions
 * 
 * Functions for handling user interactions on the control panel.
 * Uses efficient state updates that skip full re-renders when possible.
 */

import type { Song, SlidePosition, DisplayMode, ScheduleItem } from '../types'
import { state, updateState } from '../state'
import { socketService } from '../services/socket'
import { fetchSongById } from '../services/api'
import { getNextPosition, getPrevPosition } from '../utils/slides'

/**
 * Select a specific item for preview
 */
export function selectItemForPreview(item: ScheduleItem): void {
  // If it's a song, we need to fetch/set the hydrated song data
  if (item.type === 'song') {
    fetchSongById(item.songId).then(song => {
      if (song) {
        let variationIndex = 0
        if (item.variationId && item.variationId !== 'default') {
          const idx = song.variations.findIndex(v => String(v.id) === String(item.variationId))
          if (idx >= 0) variationIndex = idx
        }
        selectSongForPreview(song, variationIndex, item)
      }
    })
    return
  }

  // Non-song items
  updateState({
    previewItem: item,
    previewSong: null,
    previewPosition: { index: 0 } // Simple position
  }, true)

  socketService.emit('update-preview', {
    item,
    song: null,
    position: { index: 0 }
  })
}

/**
 * Select a song for preview
 */
export function selectSongForPreview(song: Song, variationIndex = 0, sourceItem?: ScheduleItem): void {
  const position = { partIndex: 0, slideIndex: 0 }

  // Create a transient item if not provided (e.g. from Library directly)
  const item: ScheduleItem = sourceItem || {
    id: 'preview-temp',
    type: 'song',
    songId: song.id,
    variationId: song.variations[variationIndex]?.id || 'default'
  }

  updateState({
    previewItem: item,
    previewSong: song,
    previewVariation: variationIndex,
    previewPosition: position
  }, true)

  socketService.emit('update-preview', {
    item,
    song,
    variation: variationIndex,
    position
  })
}

/**
 * Select a position in the preview
 */
export function selectPreviewPosition(position: SlidePosition | { index: number }): void {
  updateState({ previewPosition: position }, true)

  socketService.emit('update-preview', {
    item: state.previewItem,
    song: state.previewSong,
    variation: state.previewVariation,
    position
  })
}

/**
 * Select a variation for the preview song
 */
export function selectPreviewVariation(index: number): void {
  if (!state.previewSong) return

  // Update the preview item's variation ID to match
  const newVarId = state.previewSong.variations[index].id
  const newItem = state.previewItem && state.previewItem.type === 'song'
    ? { ...state.previewItem, variationId: newVarId }
    : { id: 'preview-temp', type: 'song' as const, songId: state.previewSong.id, variationId: newVarId }

  updateState({
    previewItem: newItem,
    previewVariation: index,
    previewPosition: { partIndex: 0, slideIndex: 0 }
  }, true)
}

/**
 * Send the current preview to live
 */
export async function goLive(): Promise<void> {
  if (!state.previewItem) return

  // Transition background video if they differ
  if (state.previewBackground && state.previewBackground !== state.backgroundVideo) {
    selectLiveVideo(state.previewBackground)
  }

  // Capture previous live state for transitions
  let previousState: Partial<typeof state> = {}
  if (state.liveItem) {
    previousState = {
      previousLiveItem: state.liveItem,
      previousLiveSong: state.liveSong,
      previousLiveVariation: state.liveVariation,
      previousLivePosition: { ...state.livePosition }
    }
  }

  const newLiveState = {
    ...previousState,
    liveItem: state.previewItem,
    liveSong: state.previewSong,
    liveVariation: state.previewVariation,
    livePosition: { ...state.previewPosition },
    // Reset media state for new item
    liveMediaState: {
      isPlaying: state.previewItem.type === 'video', // Auto-play videos?
      currentTime: 0,
      duration: 0,
      isCanvaHolding: false
    }
  }

  // Update local state FIRST to prevent race condition with socket response
  updateState(newLiveState, true)

  // Then notify server (server will broadcast to other clients)
  socketService.updateSlide({
    item: newLiveState.liveItem,
    song: newLiveState.liveSong,
    variation: newLiveState.liveVariation,
    position: newLiveState.livePosition
  })


  // SCHEDULE PROGRESSION (Autopilot)
  if (state.schedule && state.schedule.items && state.previewItem) {
    const currentId = state.previewItem.id

    // Find index of current item in schedule
    // We use the ID now since items have unique IDs
    const currentIndex = state.schedule.items.findIndex(i => i.id === currentId)


    if (currentIndex !== -1 && currentIndex < state.schedule.items.length - 1) {
      const nextItem = state.schedule.items[currentIndex + 1]
      selectItemForPreview(nextItem)
    }
  }
}

/**
 * Update the live position
 */
export function goLiveWithPosition(position: SlidePosition | { index: number }): void {
  // Update local state FIRST to prevent race condition with socket response
  updateState({ livePosition: position }, true)

  // Then notify server
  socketService.updateSlide({
    item: state.liveItem,
    song: state.liveSong,
    variation: state.liveVariation,
    position: position
  })
}

/**
 * Select a video for live background
 */
export function selectLiveVideo(video: string): void {
  updateState({ backgroundVideo: video }, true)
  socketService.updateVideo(video)
}

/**
 * Select a video for preview background
 */
export function selectPreviewVideo(video: string): void {
  updateState({ previewBackground: video }, true)
  localStorage.setItem('magi_preview_background', video)
}

/**
 * Go to next live slide
 */
export function nextSlide(): void {
  // 1. Handle Canva Slide "Resume"
  if (state.liveItem?.type === 'video' && state.liveItem.settings?.isCanvaSlide) {
    if (state.liveMediaState.isCanvaHolding) {
      // Resume playback
      const newState = {
        ...state.liveMediaState,
        isPlaying: true,
        isCanvaHolding: false
      }
      updateState({ liveMediaState: newState }, true)
      socketService.updateMediaState(newState)
      return
    }
  }

  // 2. Standard Types
  if (state.liveItem?.type === 'song' && state.liveSong) {
    const next = getNextPosition(state.liveSong, state.liveVariation, state.livePosition as SlidePosition)
    if (next) goLiveWithPosition(next)
  } else if (state.liveItem?.type === 'presentation') {
    // Logic for presentation next
    const current = (state.livePosition as { index: number }).index
    const next = { index: current + 1 }
    // Check boundaries?
    const slides = state.liveItem.slides || []
    if (next.index < slides.length) {
      goLiveWithPosition(next)
    }
  }
}

/**
 * Go to previous live slide
 */
export function prevSlide(): void {
  if (state.liveItem?.type === 'song' && state.liveSong) {
    const prev = getPrevPosition(state.liveSong, state.liveVariation, state.livePosition as SlidePosition)
    if (prev) goLiveWithPosition(prev)
  }
}

/**
 * Go to next preview slide
 */
export function nextPreviewSlide(): void {
  if (state.previewItem?.type === 'song' && state.previewSong) {
    const next = getNextPosition(state.previewSong, state.previewVariation, state.previewPosition as SlidePosition)
    if (next) selectPreviewPosition(next)
  }
}

/**
 * Go to previous preview slide
 */
export function prevPreviewSlide(): void {
  if (state.previewItem?.type === 'song' && state.previewSong) {
    const prev = getPrevPosition(state.previewSong, state.previewVariation, state.previewPosition as SlidePosition)
    if (prev) selectPreviewPosition(prev)
  }
}

/**
 * Set the display mode
 */
export function setDisplayMode(mode: DisplayMode): void {
  updateState({ displayMode: mode }, true)
  socketService.updateDisplayMode(mode)
}
