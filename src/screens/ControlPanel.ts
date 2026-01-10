/**
 * Control Panel Screen
 * 
 * Renders the main control interface for managing the projection.
 * Uses efficient DOM updates for slide selection changes.
 */

import type { SongSet } from '../types'
import { state, subscribeToState, StateChangeKey } from '../state'
import {
  goLive,
  setDisplayMode,
  prevSlide,
  nextSlide
} from '../actions/controlPanel'
import { initKeyboardHandlers, setupKeyboardListener, removeKeyboardListener } from '../utils/keyboard'

import {
  renderSongListColumn,
  renderPreviewColumn,
  renderLiveColumn,
  initSongListListeners,
  initPreviewListeners,
  initLiveListeners,
  updateVideoSelection,
  updatePreviewSlideSelection,
  updatePreviewNavButtons,
  updateLiveSlideSelection,
  updateLiveNavButtons,
  updateDisplayModeButtons
} from '../components/control-panel'

// Track initialization state
let isInitialized = false
let unsubscribe: (() => void) | null = null

/**
 * Cleanup control panel resources
 */
function cleanup(): void {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
  removeKeyboardListener()
  isInitialized = false
}

/**
 * Initialize keyboard handlers for control panel
 */
function initKeyboard(): void {
  initKeyboardHandlers({
    nextSlide,
    prevSlide,
    goLive,
    setDisplayMode
  })
  setupKeyboardListener()
}

/**
 * Setup efficient updates that don't require full re-render
 */
function setupEfficientUpdates(): void {
  unsubscribe = subscribeToState((changedKeys: StateChangeKey[]) => {
    if (!isInitialized) return

    // Handle preview changes efficiently
    if (changedKeys.includes('previewPosition')) {
      updatePreviewSlideSelection()
      updatePreviewNavButtons()
    }

    // Handle live changes efficiently
    if (changedKeys.includes('livePosition')) {
      updateLiveSlideSelection()
      updateLiveNavButtons()
    }

    // Handle display mode changes
    if (changedKeys.includes('displayMode')) {
      updateDisplayModeButtons()
    }

    // Handle video selection change
    if (changedKeys.includes('backgroundVideo')) {
      updateVideoSelection()
    }
  })
}

/**
 * Render the control panel UI
 */
export function renderControlPanel(): void {
  // Cleanup previous instance
  cleanup()

  document.body.setAttribute('data-theme', state.theme)

  const app = document.getElementById('app')
  if (!app) return

  const sets = state.lyricsData?.sets || []

  app.innerHTML = buildControlPanelHTML(sets)

  attachControlPanelListeners()
  initKeyboard()
  setupEfficientUpdates()
  isInitialized = true
}

/**
 * Build the control panel HTML structure
 */
function buildControlPanelHTML(sets: SongSet[]): string {
  return `
    <div class="control-panel no-navbar">
      <div class="cp-main">
        ${renderSongListColumn(sets)}
        ${renderPreviewColumn()}
        ${renderLiveColumn()}
      </div>
    </div>
  `
}

/**
 * Attach event listeners to the control panel
 */
function attachControlPanelListeners(): void {
  initSongListListeners()
  initPreviewListeners()
  initLiveListeners()
}
