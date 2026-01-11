/**
 * Mobile Screen for Congregation
 * 
 * Like confidence monitor but for the people:
 * - Same teleprompter style
 * - Shows song arrangement above
 * - User can scroll, button appears to realign with live sync
 * - Can jump through scheduled songs (even ones not on Live Panel)
 * - Font size stored locally in localStorage
 */

import { state, subscribeToState, StateChangeKey } from '../state'
import type { Song, SlidePosition, Schedule, SongSummary } from '../types'
import { getAllSlides } from '../utils/slides'
import { updateHTML } from '../utils/dom'
import { fetchSongById } from '../services/api'

// Local storage key for mobile font size
const MOBILE_FONT_SIZE_KEY = 'magi-mobile-font-size'

// Track currently viewed song (may differ from live)
let viewedSong: Song | null = null
let viewedVariation: number = 0

// State subscription cleanup
let unsubscribe: (() => void) | null = null
let isInitialized = false

// Load font size from localStorage
function loadMobileFontSize(): number {
  const saved = localStorage.getItem(MOBILE_FONT_SIZE_KEY)
  if (saved) {
    const parsed = parseFloat(saved)
    if (!isNaN(parsed) && parsed > 0) {
      return parsed
    }
  }
  return state.confidenceMonitorSettings.fontSize
}

// Save font size to localStorage
function saveMobileFontSize(size: number): void {
  localStorage.setItem(MOBILE_FONT_SIZE_KEY, String(size))
}

export function getMobileFontSize(): number {
  return loadMobileFontSize()
}

export function buildMobileScreenHTML(): string {
  const { displayMode, liveSong, liveVariation, livePosition, confidenceMonitorSettings, schedule, songs } = state
  const mobileFontSize = loadMobileFontSize()

  // Use live song by default
  const currentSong = viewedSong || liveSong
  const currentVariation = viewedSong ? viewedVariation : liveVariation
  const isViewingLiveSong = !viewedSong || !!(liveSong && viewedSong.id === liveSong.id)

  // Build inline styles from settings (borrowing from confidence monitor)
  const mobileStyles = `
    --cm-font-size: ${mobileFontSize}rem;
    --cm-font-family: ${confidenceMonitorSettings.fontFamily};
    --cm-line-height: ${confidenceMonitorSettings.lineHeight};
    --cm-prev-next-opacity: ${confidenceMonitorSettings.prevNextOpacity};
    --cm-margin-top: ${confidenceMonitorSettings.marginTop}rem;
    --cm-margin-bottom: ${confidenceMonitorSettings.marginBottom}rem;
    --cm-margin-left: ${confidenceMonitorSettings.marginLeft}rem;
    --cm-margin-right: ${confidenceMonitorSettings.marginRight}rem;
  `

  return `
    <div class="mobile-screen" style="${mobileStyles}">
      ${buildMobileNavbar(currentSong, schedule, songs)}
      ${buildArrangementBar(currentSong, currentVariation, livePosition, isViewingLiveSong)}
      <div class="mobile-teleprompter">
        ${buildTeleprompterContent(currentSong, currentVariation, livePosition, displayMode, isViewingLiveSong)}
      </div>
      ${buildRealignButton(!isViewingLiveSong)}
      ${buildSettingsPanel(mobileFontSize)}
      <button class="mobile-settings-btn" title="Settings">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </button>
    </div>
  `
}

function buildMobileNavbar(currentSong: Song | null, schedule: Schedule, songs: SongSummary[]): string {
  const scheduledSongs = schedule.items.map(item => {
    const song = songs.find(s => s.id === item.songId)
    return song ? { id: song.id, title: song.title, variationId: item.variationId } : null
  }).filter(Boolean) as { id: number; title: string; variationId: number | string }[]

  const currentId = currentSong?.id || 0

  const options = scheduledSongs.length > 0
    ? scheduledSongs.map(s => 
        `<option value="${s.id}" ${s.id === currentId ? 'selected' : ''}>${s.title}</option>`
      ).join('')
    : '<option value="">No songs scheduled</option>'

  return `
    <nav class="mobile-navbar">
      <select class="mobile-song-select" id="mobile-song-select">
        ${options}
      </select>
    </nav>
  `
}

function buildArrangementBar(song: Song | null, variation: number, position: SlidePosition, isViewingLiveSong: boolean): string {
  if (!song) {
    return '<div class="mobile-arrangement"></div>'
  }

  const arrangement = song.variations[variation]?.arrangement || []
  const currentPartIndex = isViewingLiveSong ? position.partIndex : -1

  const partsHTML = arrangement.map((partId, index) => {
    const part = song.parts.find(p => p.id === partId)
    const label = part?.label || partId
    const isActive = index === currentPartIndex
    
    return `
      <button class="mobile-arrangement-item ${isActive ? 'active' : ''}" 
              data-part-index="${index}"
              title="${label}">
        ${partId}
      </button>
    `
  }).join('')

  return `
    <div class="mobile-arrangement">
      ${partsHTML}
    </div>
  `
}

function buildTeleprompterContent(song: Song | null, variation: number, position: SlidePosition, displayMode: string, isViewingLiveSong: boolean): string {
  // Handle special display modes (only show for live song)
  if (isViewingLiveSong) {
    if (displayMode === 'black') {
      return '<div class="mode-overlay black"><span>BLACK</span></div>'
    }
    if (displayMode === 'clear') {
      return '<div class="mode-overlay clear"><span>CLEAR</span></div>'
    }
    if (displayMode === 'logo') {
      return '<div class="mode-overlay logo"><span>LOGO</span></div>'
    }
  }

  if (!song) {
    return '<div class="cm-empty">No song loaded</div>'
  }

  const allSlides = getAllSlides(song, variation)

  // Find current slide index in flat list (only highlight for live song)
  let currentFlatIndex = isViewingLiveSong ? 0 : -1
  if (isViewingLiveSong) {
    for (let i = 0; i < allSlides.length; i++) {
      if (allSlides[i].position.partIndex === position.partIndex &&
          allSlides[i].position.slideIndex === position.slideIndex) {
        currentFlatIndex = i
        break
      }
    }
  }

  const slidesHTML = allSlides.map((slide, index) => {
    let slideClass = 'tp-slide'
    if (isViewingLiveSong) {
      if (index < currentFlatIndex) {
        slideClass += ' tp-past'
      } else if (index === currentFlatIndex) {
        slideClass += ' tp-current'
      } else {
        slideClass += ' tp-future'
      }
    }

    return `
      <div class="${slideClass}" data-index="${index}" id="mobile-tp-slide-${index}">
        <div class="tp-part-indicator"><span>${slide.partLabel}</span></div>
        <div class="tp-content">
          <div class="tp-text">${slide.text.replace(/\n/g, '<br>')}</div>
        </div>
      </div>
    `
  }).join('')

  return `
    <div class="teleprompter-scroll" data-current-index="${currentFlatIndex}" data-song-id="${song.id}">
      <div class="tp-spacer-top"></div>
      ${slidesHTML}
      <div class="tp-spacer-bottom"></div>
    </div>
  `
}

function buildRealignButton(show: boolean): string {
  return `
    <button class="mobile-realign-btn ${show ? '' : 'hidden'}" id="mobile-realign-btn" title="Realign with live">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
      <span>Sync</span>
    </button>
  `
}

function buildSettingsPanel(fontSize: number): string {
  return `
    <div class="mobile-settings-panel hidden" id="mobile-settings-panel">
      <div class="mobile-settings-header">
        <h3>Settings</h3>
        <button class="mobile-settings-close" id="mobile-settings-close">&times;</button>
      </div>
      <div class="mobile-settings-content">
        <div class="mobile-setting-row">
          <label for="mobile-font-size">Font Size</label>
          <div class="mobile-font-size-controls">
            <button class="mobile-font-btn" data-delta="-0.25">−</button>
            <span class="mobile-font-size-value" id="mobile-font-size-value">${fontSize.toFixed(2)}</span>
            <button class="mobile-font-btn" data-delta="0.25">+</button>
          </div>
        </div>
        <p class="mobile-settings-note">Other settings are managed from the Control Panel's Confidence Monitor settings.</p>
      </div>
    </div>
  `
}

// ========== Event Handlers ==========

function setupMobileEventListeners(): void {
  // Song selector
  const songSelect = document.getElementById('mobile-song-select') as HTMLSelectElement
  if (songSelect) {
    songSelect.addEventListener('change', handleSongChange)
  }

  // Arrangement items
  document.querySelectorAll('.mobile-arrangement-item').forEach(item => {
    item.addEventListener('click', handleArrangementClick)
  })

  // Realign button
  const realignBtn = document.getElementById('mobile-realign-btn')
  if (realignBtn) {
    realignBtn.addEventListener('click', handleRealign)
  }

  // Settings button
  const settingsBtn = document.querySelector('.mobile-settings-btn')
  if (settingsBtn) {
    settingsBtn.addEventListener('click', toggleSettingsPanel)
  }

  // Settings close button
  const closeBtn = document.getElementById('mobile-settings-close')
  if (closeBtn) {
    closeBtn.addEventListener('click', closeSettingsPanel)
  }

  // Font size controls
  document.querySelectorAll('.mobile-font-btn').forEach(btn => {
    btn.addEventListener('click', handleFontSizeChange)
  })
}

async function handleSongChange(e: Event): Promise<void> {
  const select = e.target as HTMLSelectElement
  const songId = parseInt(select.value, 10)
  
  if (isNaN(songId)) return

  // Fetch the full song data
  const song = await fetchSongById(songId)
  if (song) {
    // Find the variation from schedule
    const scheduleItem = state.schedule.items.find(item => item.songId === songId)
    const variationId = scheduleItem?.variationId || 0
    const variationIndex = typeof variationId === 'number' 
      ? variationId 
      : song.variations.findIndex(v => v.name === variationId) || 0

    viewedSong = song
    viewedVariation = variationIndex

    // Show the sync button since we're viewing a different song
    const realignBtn = document.getElementById('mobile-realign-btn')
    if (realignBtn) {
      realignBtn.classList.remove('hidden')
    }

    // Rebuild teleprompter content for this song
    const teleprompter = document.querySelector('.mobile-teleprompter')
    if (teleprompter) {
      updateHTML(teleprompter, buildTeleprompterContent(song, variationIndex, state.livePosition, state.displayMode, false))
    }

    // Rebuild arrangement bar
    const arrangementContainer = document.querySelector('.mobile-arrangement')
    if (arrangementContainer) {
      const arrangement = song.variations[variationIndex]?.arrangement || []
      const partsHTML = arrangement.map((partId, index) => {
        const part = song.parts.find(p => p.id === partId)
        const label = part?.label || partId
        return `
          <button class="mobile-arrangement-item" 
                  data-part-index="${index}"
                  title="${label}">
            ${partId}
          </button>
        `
      }).join('')
      arrangementContainer.innerHTML = partsHTML
      
      // Re-attach event listeners for arrangement items
      document.querySelectorAll('.mobile-arrangement-item').forEach(item => {
        item.addEventListener('click', handleArrangementClick)
      })
    }

    // Scroll to top
    scrollToSlideIndex(0)
  }
}

function handleArrangementClick(e: Event): void {
  const btn = e.currentTarget as HTMLElement
  const partIndex = parseInt(btn.dataset.partIndex || '0', 10)
  
  const currentSong = viewedSong || state.liveSong
  if (!currentSong) return

  const allSlides = getAllSlides(currentSong, viewedSong ? viewedVariation : state.liveVariation)
  
  // Find the first slide with this part index
  const slideIndex = allSlides.findIndex(s => s.position.partIndex === partIndex)
  if (slideIndex >= 0) {
    scrollToSlideIndex(slideIndex)
  }
}

function handleRealign(): void {
  // Reset to live song
  viewedSong = null
  viewedVariation = 0

  // Hide the sync button
  const realignBtn = document.getElementById('mobile-realign-btn')
  if (realignBtn) {
    realignBtn.classList.add('hidden')
  }

  // Trigger an update to rebuild with live song
  updateTeleprompterContent()
  updateArrangementBar()
  updateSongSelector()
}

function toggleSettingsPanel(): void {
  const panel = document.getElementById('mobile-settings-panel')
  if (panel) {
    panel.classList.toggle('hidden')
  }
}

function closeSettingsPanel(): void {
  const panel = document.getElementById('mobile-settings-panel')
  if (panel) {
    panel.classList.add('hidden')
  }
}

function handleFontSizeChange(e: Event): void {
  const btn = e.currentTarget as HTMLElement
  const delta = parseFloat(btn.dataset.delta || '0')
  
  let currentSize = loadMobileFontSize()
  currentSize = Math.max(0.5, Math.min(8, currentSize + delta))
  
  saveMobileFontSize(currentSize)
  
  // Update the display
  const valueEl = document.getElementById('mobile-font-size-value')
  if (valueEl) {
    valueEl.textContent = currentSize.toFixed(2)
  }

  // Update the CSS variable
  const screen = document.querySelector('.mobile-screen') as HTMLElement
  if (screen) {
    screen.style.setProperty('--cm-font-size', `${currentSize}rem`)
  }
}

// ========== Update Functions (called from state subscription) ==========

function updateTeleprompterContent(): void {
  const { displayMode, liveSong, liveVariation, livePosition } = state
  const teleprompter = document.querySelector('.mobile-teleprompter')
  const existingScroll = teleprompter?.querySelector('.teleprompter-scroll')

  if (!teleprompter) return

  // Only update if viewing live song
  const isViewingLiveSong = !viewedSong || (liveSong && viewedSong.id === liveSong.id)
  if (!isViewingLiveSong) return

  // Check if song changed - need full rebuild
  const currentSongId = existingScroll?.getAttribute('data-song-id')
  const newSongId = liveSong?.id?.toString() || ''
  const needsFullRebuild = !existingScroll || currentSongId !== newSongId || displayMode !== 'lyrics'

  if (needsFullRebuild) {
    updateHTML(teleprompter, buildTeleprompterContent(liveSong, liveVariation, livePosition, displayMode, true))
    scrollToCurrentSlide()
  } else {
    // Just update slide classes and scroll
    updateSlideClasses(livePosition)
    scrollToCurrentSlide()
  }
}

function updateArrangementBar(): void {
  const { livePosition, liveSong, liveVariation } = state
  const arrangementContainer = document.querySelector('.mobile-arrangement')
  
  if (!arrangementContainer) return

  // Only update if viewing live song
  const isViewingLiveSong = !viewedSong || (liveSong && viewedSong.id === liveSong.id)
  if (!isViewingLiveSong) return

  if (!liveSong) {
    arrangementContainer.innerHTML = ''
    return
  }

  const arrangement = liveSong.variations[liveVariation]?.arrangement || []

  const partsHTML = arrangement.map((partId, index) => {
    const part = liveSong.parts.find(p => p.id === partId)
    const label = part?.label || partId
    const isActive = index === livePosition.partIndex
    
    return `
      <button class="mobile-arrangement-item ${isActive ? 'active' : ''}" 
              data-part-index="${index}"
              title="${label}">
        ${partId}
      </button>
    `
  }).join('')

  arrangementContainer.innerHTML = partsHTML

  // Re-attach event listeners
  document.querySelectorAll('.mobile-arrangement-item').forEach(item => {
    item.addEventListener('click', handleArrangementClick)
  })
}

function updateSlideClasses(position: SlidePosition): void {
  const { liveSong, liveVariation } = state
  if (!liveSong) return

  const allSlides = getAllSlides(liveSong, liveVariation)
  
  // Find current slide index
  let currentFlatIndex = 0
  for (let i = 0; i < allSlides.length; i++) {
    if (allSlides[i].position.partIndex === position.partIndex &&
        allSlides[i].position.slideIndex === position.slideIndex) {
      currentFlatIndex = i
      break
    }
  }

  // Update all slide classes
  document.querySelectorAll('.mobile-teleprompter .tp-slide').forEach((slide, index) => {
    slide.classList.remove('tp-past', 'tp-current', 'tp-future')
    if (index < currentFlatIndex) {
      slide.classList.add('tp-past')
    } else if (index === currentFlatIndex) {
      slide.classList.add('tp-current')
    } else {
      slide.classList.add('tp-future')
    }
  })

  // Update data attribute
  const scrollContainer = document.querySelector('.mobile-teleprompter .teleprompter-scroll')
  if (scrollContainer) {
    scrollContainer.setAttribute('data-current-index', String(currentFlatIndex))
  }
}

function scrollToCurrentSlide(): void {
  requestAnimationFrame(() => {
    const currentSlide = document.querySelector('.mobile-teleprompter .tp-slide.tp-current')
    const teleprompter = document.querySelector('.mobile-teleprompter')
    
    if (currentSlide && teleprompter) {
      currentSlide.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  })
}

function scrollToSlideIndex(index: number): void {
  requestAnimationFrame(() => {
    const slide = document.getElementById(`mobile-tp-slide-${index}`)
    if (slide) {
      slide.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  })
}

function updateMobileScreenStyles(): void {
  const { confidenceMonitorSettings } = state
  const mobileFontSize = loadMobileFontSize()
  const screen = document.querySelector('.mobile-screen') as HTMLElement

  if (screen) {
    screen.style.setProperty('--cm-font-size', `${mobileFontSize}rem`)
    screen.style.setProperty('--cm-font-family', confidenceMonitorSettings.fontFamily)
    screen.style.setProperty('--cm-line-height', String(confidenceMonitorSettings.lineHeight))
    screen.style.setProperty('--cm-prev-next-opacity', String(confidenceMonitorSettings.prevNextOpacity))
    screen.style.setProperty('--cm-margin-top', `${confidenceMonitorSettings.marginTop}rem`)
    screen.style.setProperty('--cm-margin-bottom', `${confidenceMonitorSettings.marginBottom}rem`)
    screen.style.setProperty('--cm-margin-left', `${confidenceMonitorSettings.marginLeft}rem`)
    screen.style.setProperty('--cm-margin-right', `${confidenceMonitorSettings.marginRight}rem`)
  }
}

function updateSongSelector(): void {
  const { schedule, songs, liveSong } = state
  const songSelect = document.getElementById('mobile-song-select') as HTMLSelectElement
  
  if (!songSelect) return

  const currentSong = viewedSong || liveSong
  const currentId = currentSong?.id || 0

  const scheduledSongs = schedule.items.map(item => {
    const song = songs.find(s => s.id === item.songId)
    return song ? { id: song.id, title: song.title } : null
  }).filter(Boolean) as { id: number; title: string }[]

  const options = scheduledSongs.length > 0
    ? scheduledSongs.map(s => 
        `<option value="${s.id}" ${s.id === currentId ? 'selected' : ''}>${s.title}</option>`
      ).join('')
    : '<option value="">No songs scheduled</option>'

  songSelect.innerHTML = options
}

// Reset state
export function resetMobileViewState(): void {
  viewedSong = null
  viewedVariation = 0
}

// ========== Main Render Function ==========

export function renderMobileScreen(): void {
  const app = document.getElementById('app')
  if (!app) return

  // Clean up previous subscriptions
  cleanup()

  // Initial render
  app.innerHTML = buildMobileScreenHTML()
  
  // Setup event listeners
  setupMobileEventListeners()

  // Setup state subscriptions for live updates
  setupMobileUpdates()

  // Initial scroll to current slide
  scrollToCurrentSlide()

  isInitialized = true
}

function cleanup(): void {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
  isInitialized = false
}

function setupMobileUpdates(): void {
  unsubscribe = subscribeToState((changedKeys: StateChangeKey[]) => {
    if (!isInitialized) return

    // Update teleprompter content when live state changes
    if (changedKeys.includes('live') || changedKeys.includes('displayMode')) {
      updateTeleprompterContent()
      updateArrangementBar()
    }

    // Update song selector when schedule changes
    if (changedKeys.includes('data')) {
      updateSongSelector()
    }

    // Update styles when confidence monitor settings change
    if (changedKeys.includes('confidenceMonitorSettings')) {
      updateMobileScreenStyles()
    }
  })
}
