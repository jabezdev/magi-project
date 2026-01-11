/**
 * Control Panel Screen
 * 
 * Renders the main control interface for managing the projection.
 * Uses efficient DOM updates for slide selection changes.
 */

import { state, subscribeToState, StateChangeKey } from '../state'
import {
  goLive,
  setDisplayMode,
  prevSlide,
  nextSlide
} from '../actions/controlPanel'
import { initKeyboardHandlers, setupKeyboardListener, removeKeyboardListener } from '../utils/keyboard'
import { toggleShortcutsModal } from '../components/ShortcutsModal'


import {
  renderSongListColumn,
  renderProjectionControlColumn,
  renderPreviewColumn,
  renderLiveColumn, // Keep these if needed by internal updates, but we use ProjectionControl used generally
  initSongListListeners,
  initProjectionControlListeners,
  initPreviewListeners,
  initLiveListeners,
  updateVideoSelection,
  updatePreviewSlideSelection,
  updatePreviewNavButtons,
  updateLiveSlideSelection,
  updateLiveNavButtons,
  updateDisplayModeButtons,
  updateSongSelectionUI,
  updateLiveStatusUI
} from '../components/control-panel'

// Track initialization state
let isInitialized = false
let unsubscribe: (() => void) | null = null
// Track layout state
let activeSongListWidth = 280

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
    setDisplayMode,
    toggleHelp: toggleShortcutsModal
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

    if (changedKeys.includes('previewSong') || changedKeys.includes('previewVariation')) {
      handlePreviewChange()
    }

    // Handle live changes efficiently
    if (changedKeys.includes('livePosition')) {
      updateLiveSlideSelection()
      updateLiveNavButtons()
    }

    if (changedKeys.includes('liveSong') || changedKeys.includes('liveVariation')) {
      handleLiveChange()
    }

    // Handle display mode changes
    if (changedKeys.includes('displayMode')) {
      updateDisplayModeButtons()
    }

    // Handle video selection change
    if (changedKeys.includes('backgroundVideo') || changedKeys.includes('previewBackground')) {
      updateVideoSelection()
    }
  })
}

function handlePreviewChange(): void {
  // 1. Update selection in song lists (schedule & library)
  updateSongSelectionUI()

  // 2. Re-render ONLY the preview column
  const previewContainer = document.querySelector('.cp-preview')
  if (previewContainer) {
    const tempContainer = document.createElement('div')
    tempContainer.innerHTML = renderPreviewColumn()
    const newPreview = tempContainer.firstElementChild

    if (newPreview) {
      previewContainer.replaceWith(newPreview)
      // Re-attach listeners for the new DOM
      initPreviewListeners()
      // We need to make sure we also update the "Live" badges in the new preview if it matches live song
      updatePreviewSlideSelection()
    }
  }
}

function handleLiveChange(): void {
  // 1. Update live status in song lists
  updateLiveStatusUI()

  // 2. Update live status in preview column (if matching)
  updatePreviewSlideSelection()

  // 3. Re-render live column if needed (usually live column just shows static text or current slide)
  // For now, simpler to just re-render live column content if we had one, but currently LiveColumn is simple.
  // Let's assume RenderLiveColumn is cheap or we can just update it.
  // Actually, LiveColumn usually needs re-render if the song changes to show the new song title/etc.
  const liveContainer = document.querySelector('.cp-live')
  if (liveContainer) {
    const tempContainer = document.createElement('div')
    tempContainer.innerHTML = renderLiveColumn()
    const newLive = tempContainer.firstElementChild

    if (newLive) {
      liveContainer.replaceWith(newLive)
      initLiveListeners()
      // Restore proper slide selection
      updateLiveSlideSelection()
    }
  }
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

  // const sets = state.lyricsData?.sets || [] // Deprecated

  app.innerHTML = buildControlPanelHTML()

  attachControlPanelListeners()
  initKeyboard()
  setupEfficientUpdates()

  // Restore layout
  const cpMain = document.querySelector('.cp-main') as HTMLElement
  if (cpMain) {
    cpMain.style.setProperty('--song-list-width', `${activeSongListWidth}px`)
  }

  isInitialized = true
}

function buildControlPanelHTML(): string {
  return `
    <div class="control-panel no-navbar">
      <div class="cp-main">
        ${renderSongListColumn()}
        <div class="resizer" id="cp-resizer"></div>
        ${renderProjectionControlColumn()}
      </div>
    </div>
  `
}

/**
 * Attach event listeners to the control panel
 */
function attachControlPanelListeners(): void {
  initSongListListeners()
  initProjectionControlListeners()

  // Settings button listener removed as it's now in SongListColumn
  initResizer()
}

function initResizer(): void {
  const resizer = document.getElementById('cp-resizer')
  const cpMain = document.querySelector('.cp-main') as HTMLElement

  if (!resizer || !cpMain) return

  let isResizing = false

  resizer.addEventListener('mousedown', () => {
    isResizing = true
    resizer.classList.add('resizing')
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  })

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return

    // Calculate new width relative to cpMain left edge
    // But simpler: just use e.clientX if sidebar is at left edge.
    // Let's assume CP is full width.
    const newWidth = Math.max(200, Math.min(600, e.clientX))
    activeSongListWidth = newWidth
    cpMain.style.setProperty('--song-list-width', `${newWidth}px`)
  })

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false
      resizer.classList.remove('resizing')
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  })
}
