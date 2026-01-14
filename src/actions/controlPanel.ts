/**
 * Control Panel Actions
 * 
 * Functions for handling user interactions on the control panel.
 * Uses efficient state updates that skip full re-renders when possible.
 */

import type { Song, DisplayMode, ScheduleItem, SongItem } from '../types'
import { state, updateState } from '../state'
import { socketService } from '../services/socket'
import { hydrateContent, flattenSongToSlides, getNextSlideIndex, getPrevSlideIndex } from '../utils/content'

/**
 * Select a specific item for preview (unified approach)
 */
export async function selectItemForPreview(item: ScheduleItem): Promise<void> {
  // Hydrate content for all item types
  const content = await hydrateContent(item)

  // Update state with unified content
  updateState({
    previewItem: item,
    previewContent: content,
    previewPosition: 0
  }, true)

  socketService.emit('update-preview', {
    item,
    content,
    position: 0
  })
}

/**
 * Select a song for preview (legacy compatibility + unified)
 */
export async function selectSongForPreview(song: Song, variationIndex = 0, sourceItem?: ScheduleItem): Promise<void> {
  const variationId = song.variations[variationIndex]?.id || 0

  // Create a transient item if not provided (e.g. from Library directly)
  const item: ScheduleItem = sourceItem || {
    id: `temp-${Date.now()}`,
    type: 'song',
    title: song.title,
    subtitle: song.artist,
    songId: song.id,
    variationId: variationId
  } as SongItem

  // Flatten song to content slides
  const content = flattenSongToSlides(song, variationId)

  updateState({
    previewItem: item,
    previewContent: content,
    previewPosition: 0
  }, true)

  socketService.emit('update-preview', {
    item,
    content,
    position: 0
  })
}


/**
 * Select a position in the preview (unified - uses simple index)
 */
export function selectPreviewPosition(position: number): void {
  updateState({ previewPosition: position }, true)

  socketService.emit('update-preview', {
    item: state.previewItem,
    content: state.previewContent,
    position
  })
}

/**
 * Select a variation for the preview song (re-hydrates content)
 */
export async function selectPreviewVariation(variationId: number): Promise<void> {
  const item = state.previewItem
  if (!item || item.type !== 'song') return

  const newItem = { ...item, variationId } as SongItem
  const content = await hydrateContent(newItem)

  updateState({
    previewItem: newItem,
    previewContent: content,
    previewPosition: 0
  }, true)

  socketService.emit('update-preview', {
    item: newItem,
    content,
    position: 0
  })
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
  const previousState = state.liveItem ? {
    previousItem: state.liveItem,
    previousContent: state.liveContent,
    previousPosition: state.livePosition
  } : {}

  const newLiveState = {
    ...previousState,
    // Unified state
    liveItem: state.previewItem,
    liveContent: state.previewContent,
    livePosition: state.previewPosition,
    // Reset media state for new item
    liveMediaState: {
      isPlaying: state.previewItem.type === 'video', // Auto-play videos
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
    content: newLiveState.liveContent,
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
 * Update the live position (unified - uses simple index)
 */
export function goLiveWithPosition(position: number): void {
  // Update local state FIRST to prevent race condition with socket response
  updateState({ livePosition: position }, true)

  // Then notify server
  socketService.updateSlide({
    item: state.liveItem,
    content: state.liveContent,
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
 * Go to next live slide (unified)
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

  // 2. Unified navigation using content array
  const nextIndex = getNextSlideIndex(state.liveContent, state.livePosition)
  if (nextIndex !== null) {
    goLiveWithPosition(nextIndex)
  }
}

/**
 * Go to previous live slide (unified)
 */
export function prevSlide(): void {
  const prevIndex = getPrevSlideIndex(state.liveContent, state.livePosition)
  if (prevIndex !== null) {
    goLiveWithPosition(prevIndex)
  }
}

/**
 * Go to next preview slide (unified)
 */
export function nextPreviewSlide(): void {
  const nextIndex = getNextSlideIndex(state.previewContent, state.previewPosition)
  if (nextIndex !== null) {
    selectPreviewPosition(nextIndex)
  }
}

/**
 * Go to previous preview slide (unified)
 */
export function prevPreviewSlide(): void {
  const prevIndex = getPrevSlideIndex(state.previewContent, state.previewPosition)
  if (prevIndex !== null) {
    selectPreviewPosition(prevIndex)
  }
}

/**
 * Set the display mode
 */
export function setDisplayMode(mode: DisplayMode): void {
  updateState({ displayMode: mode }, true)
  socketService.updateDisplayMode(mode)
}
