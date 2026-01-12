/**
 * Control Panel Screen
 * 
 * Renders the main control interface for managing the projection.
 * Uses efficient DOM updates for slide selection changes, schedule updates, and library changes.
 */

import { state, subscribeToState, StateChangeKey, saveLayoutSettings } from '../state'
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
  renderOutputMonitorColumn,
  renderPreviewColumn,
  renderLiveColumn,
  // Specific component renders & inits for granular updates
  renderScheduleList,
  initScheduleListListeners,
  renderLibraryList,
  initLibraryListListeners,

  initSongListListeners,
  initProjectionControlListeners,
  initOutputMonitorListeners,
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
let activeSongListWidth = state.layoutSettings.songsColumnWidth || 350
let activeMonitorColumnWidth = state.layoutSettings.monitorColumnWidth || 300

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

    // Handle data changes efficiently
    if (changedKeys.includes('schedule')) {
      handleScheduleChange()
    }

    if (changedKeys.includes('songs')) {
      handleDataChange()
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
 * Handle schedule changes efficiently
 */
function handleScheduleChange(): void {
  // Update schedule section
  const scheduleContainer = document.querySelector('.schedule-section')
  if (scheduleContainer && scheduleContainer.parentElement) {
    const tempContainer = document.createElement('div')
    tempContainer.innerHTML = renderScheduleList()
    const newSchedule = tempContainer.firstElementChild

    if (newSchedule) {
      // Preserve height if manually resized
      const currentHeight = (scheduleContainer as HTMLElement).style.height
      const currentFlex = (scheduleContainer as HTMLElement).style.flex

      if (currentHeight) {
        (newSchedule as HTMLElement).style.height = currentHeight
      }
      if (currentFlex) {
        (newSchedule as HTMLElement).style.flex = currentFlex
      }

      scheduleContainer.replaceWith(newSchedule)
      initScheduleListListeners()

      // Restore selection state
      updateSongSelectionUI()
      updateLiveStatusUI()
    }
  }
}

/**
 * Handle data/library changes efficiently
 */
function handleDataChange(): void {
  // 1. Update library section
  const libraryContainer = document.querySelector('.library-section')
  if (libraryContainer) {
    const tempContainer = document.createElement('div')
    tempContainer.innerHTML = renderLibraryList()
    const newLibrary = tempContainer.firstElementChild

    if (newLibrary) {
      // Preserve layout styles
      const currentHeight = (libraryContainer as HTMLElement).style.height
      const currentFlex = (libraryContainer as HTMLElement).style.flex

      if (currentHeight) (newLibrary as HTMLElement).style.height = currentHeight
      if (currentFlex) (newLibrary as HTMLElement).style.flex = currentFlex

      libraryContainer.replaceWith(newLibrary)
      initLibraryListListeners()
    }
  }

  // 2. Also update schedule as song details might have changed
  handleScheduleChange()

  // 3. Selection states might need re-check if IDs changed
  updateSongSelectionUI()
  updateLiveStatusUI()
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
    if (state.layoutSettings.songsColumnWidth) {
      activeSongListWidth = state.layoutSettings.songsColumnWidth
    }
    if (state.layoutSettings.monitorColumnWidth) {
      activeMonitorColumnWidth = state.layoutSettings.monitorColumnWidth
    }
    cpMain.style.setProperty('--song-list-width', `${activeSongListWidth}px`)
    cpMain.style.setProperty('--monitor-column-width', `${activeMonitorColumnWidth}px`)
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
        <div class="resizer" id="cp-resizer-monitors"></div>
        ${renderOutputMonitorColumn()}
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
  initMonitorResizer()
  initOutputMonitorListeners()
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
    // Max width is 50% of window width to ensure space for other columns
    const max = window.innerWidth * 0.5
    const newWidth = Math.max(200, Math.min(max, e.clientX))
    activeSongListWidth = newWidth
    cpMain.style.setProperty('--song-list-width', `${newWidth}px`)
  })

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false
      resizer.classList.remove('resizing')
      document.body.style.cursor = ''
      document.body.style.userSelect = ''

      // Save the new width
      saveLayoutSettings({
        ...state.layoutSettings,
        songsColumnWidth: activeSongListWidth
      })
    }
  })
}


function initMonitorResizer(): void {
  const resizer = document.getElementById('cp-resizer-monitors')
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

    // Monitor column is on the right. Width = WindowWidth - MouseX
    // Calculate max width based on viewport height to prevent overflow
    // Total height = height(16:9) + height(4:3) + height(16:9) + gaps
    // H = W*(9/16) + W*(3/4) + W*(9/16) = W*(1.875)
    // H_vp > H + Fixed (approx 200px for headers/padding)
    // W < (H_vp - 200) / 1.875
    const FIXED_V_SPACE = 120
    const availHeight = window.innerHeight - FIXED_V_SPACE
    const calcMaxWidth = Math.floor(Math.max(200, availHeight / 1.875))

    // Also limit by window width (allow up to 50% of screen)
    const maxWidth = Math.min(calcMaxWidth, window.innerWidth * 0.5)

    const newWidth = Math.max(200, Math.min(maxWidth, window.innerWidth - e.clientX))

    activeMonitorColumnWidth = newWidth
    cpMain.style.setProperty('--monitor-column-width', `${newWidth}px`)
  })

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false
      resizer.classList.remove('resizing')
      document.body.style.cursor = ''
      document.body.style.userSelect = ''

      // Save the new width
      saveLayoutSettings({
        ...state.layoutSettings,
        monitorColumnWidth: activeMonitorColumnWidth
      })

      // Trigger resize for iframes in OutputMonitorColumn
      initOutputMonitorListeners()
    }
  })
}
