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
import { getAllSlides } from '../utils'
import { updateHTML } from '../utils'
import { fetchSongById } from '../services'

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
  return 1.5
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
    <div class="flex flex-col h-screen bg-bg-primary overflow-hidden relative mobile-screen" style="${mobileStyles} height: 100dvh;">
      ${buildMobileNavbar(currentSong, schedule, songs)}
      ${buildArrangementBar(currentSong, currentVariation, livePosition, isViewingLiveSong)}
      <div class="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scroll-smooth mobile-teleprompter" style="padding: var(--cm-margin-top, 0.5rem) var(--cm-margin-right, 0.5rem) var(--cm-margin-bottom, 0.5rem) var(--cm-margin-left, 0.5rem);">
        ${buildTeleprompterContent(currentSong, currentVariation, livePosition, displayMode, isViewingLiveSong)}
      </div>
      ${buildRealignButton(!isViewingLiveSong)}
      ${buildSettingsPanel(mobileFontSize)}
      <button class="fixed top-2 right-2 w-10 h-10 flex items-center justify-center text-text-muted bg-transparent border-none rounded-full cursor-pointer transition-all duration-200 z-[60] hover:text-text-primary hover:bg-bg-hover mobile-settings-btn" title="Settings">
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
      `< option value = "${s.id}" ${s.id === currentId ? 'selected' : ''}> ${s.title} </option>`
    ).join('')
    : '<option value="">No songs scheduled</option>'

  return `
    <nav class="flex justify-center items-center p-2 bg-bg-secondary border-b border-border-color shrink-0 mobile-navbar">
      <select class="flex-1 max-w-[400px] py-2 px-4 text-base font-medium text-text-primary bg-bg-primary border border-border-color rounded-md cursor-pointer appearance-none bg-no-repeat pr-10 focus:outline-none focus:border-accent-primary mobile-song-select" id="mobile-song-select" style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E&quot;); background-position: right 0.75rem center;">
        ${options}
      </select>
    </nav>
  `
}

function buildArrangementBar(song: Song | null, variation: number, position: SlidePosition, isViewingLiveSong: boolean): string {
  if (!song) {
    return '<div class="flex gap-1 p-2 bg-bg-tertiary border-b border-border-color shrink-0 overflow-x-auto mobile-arrangement" style="scrollbar-width: none;"></div>'
  }

  const arrangement = song.variations[variation]?.arrangement || []
  const currentPartIndex = isViewingLiveSong ? position.partIndex : -1

  const partsHTML = arrangement.map((partId, index) => {
    const part = song.parts.find(p => p.id === partId)
    const label = part?.label || partId
    const isActive = index === currentPartIndex

    return `
      <button class="shrink-0 py-[0.35rem] px-[0.65rem] text-[0.7rem] font-semibold uppercase tracking-[0.5px] border border-border-color rounded bg-clip-padding cursor-pointer transition-all duration-150 ${isActive ? 'bg-accent-primary text-white border-accent-primary' : 'text-text-muted bg-bg-secondary hover:bg-bg-hover hover:text-text-primary'} mobile-arrangement-item" 
              data-part-index="${index}"
              title="${label}">
        ${partId}
      </button>
    `
  }).join('')

  return `
    <div class="flex gap-1 p-2 bg-bg-tertiary border-b border-border-color shrink-0 overflow-x-auto mobile-arrangement" style="scrollbar-width: none;">
      ${partsHTML}
    </div>
  `
}

function buildTeleprompterContent(song: Song | null, variation: number, position: SlidePosition, displayMode: string, isViewingLiveSong: boolean): string {
  // Handle special display modes (only show for live song)
  if (isViewingLiveSong) {
    const overlayClass = "flex items-center justify-center w-full h-full mode-overlay";
    if (displayMode === 'black') {
      return `<div class="${overlayClass} bg-black text-[#333]"><span class="text-[2rem] font-bold tracking-[0.5rem]">BLACK</span></div>`
    }
    if (displayMode === 'clear') {
      return `<div class="${overlayClass} bg-transparent text-accent-primary"><span class="text-[2rem] font-bold tracking-[0.5rem]">CLEAR</span></div>`
    }
    if (displayMode === 'logo') {
      return `<div class="${overlayClass} bg-transparent text-accent-secondary"><span class="text-[2rem] font-bold tracking-[0.5rem]">LOGO</span></div>`
    }
  }

  if (!song) {
    return '<div class="flex items-center justify-center flex-1 text-xl text-text-muted cm-empty">No song loaded</div>'
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
    let style = `opacity: var(--cm-prev-next-opacity, 0.35);`
    let isCurrent = false;

    if (isViewingLiveSong) {
      if (index < currentFlatIndex) {
        slideClass += ' past'
      } else if (index === currentFlatIndex) {
        slideClass += ' current'
        style = `opacity: 1;`
        isCurrent = true;
      } else {
        slideClass += ' future'
      }
    }

    const textStyle = `font-size: var(--cm-font-size, 2.5rem); line-height: var(--cm-line-height, 1.4); font-family: var(--cm-font-family, system-ui);`

    return `
      <div class="flex items-stretch w-full transition-all duration-500 ease-in-out py-6 ${slideClass}" data-index="${index}" id="mobile-tp-slide-${index}" style="${style}">
        <div class="flex items-center justify-center w-10 shrink-0 relative tp-part-indicator">
          <span class="absolute whitespace-nowrap text-[0.7rem] font-bold uppercase tracking-[2px] rotate-[-90deg] ${isCurrent ? 'text-accent-primary' : 'text-text-muted'}">${slide.partLabel}</span>
        </div>
        <div class="flex-1 flex items-center pl-4 tp-content">
          <div class="tp-text ${isCurrent ? 'text-text-primary font-medium' : 'text-text-secondary'}" style="${textStyle}">${slide.text.replace(/\n/g, '<br>')}</div>
        </div>
      </div>
    `
  }).join('')

  return `
    <div class="flex flex-col items-stretch w-full teleprompter-scroll" data-current-index="${currentFlatIndex}" data-song-id="${song.id}">
      <div class="shrink-0 h-[35vh] tp-spacer-top"></div>
      ${slidesHTML}
      <div class="shrink-0 h-[35vh] tp-spacer-bottom"></div>
    </div>
  `
}

function buildRealignButton(show: boolean): string {
  return `
    <button class="fixed bottom-6 right-6 flex items-center gap-2 py-3 px-5 text-[0.9rem] font-semibold text-white bg-accent-primary border-none rounded-[50px] cursor-pointer transition-all duration-200 z-[50] ${show ? '' : 'hidden'} hover:-translate-y-[2px] active:translate-y-0" id="mobile-realign-btn" title="Realign with live" style="box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
      <span>Sync</span>
    </button>
  `
}

function buildSettingsPanel(fontSize: number): string {
  return `
    <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[320px] bg-bg-secondary border border-border-color rounded-xl z-[100] overflow-hidden hidden" id="mobile-settings-panel" style="box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
      <div class="flex justify-between items-center p-4 bg-bg-tertiary border-b border-border-color mobile-settings-header">
        <h3 class="m-0 text-base font-semibold text-text-primary">Settings</h3>
        <button class="w-8 h-8 flex items-center justify-center text-2xl text-text-muted bg-transparent border-none rounded-full cursor-pointer transition-all duration-200 hover:text-text-primary hover:bg-bg-hover mobile-settings-close" id="mobile-settings-close">&times;</button>
      </div>
      <div class="p-4 mobile-settings-content">
        <div class="flex justify-between items-center mb-4 mobile-setting-row">
          <label class="text-[0.9rem] font-medium text-text-primary" for="mobile-font-size">Font Size</label>
          <div class="flex items-center gap-2 mobile-font-size-controls">
            <button class="w-9 h-9 flex items-center justify-center text-xl font-semibold text-text-primary bg-bg-primary border border-border-color rounded-md cursor-pointer transition-all duration-150 hover:bg-bg-hover hover:border-accent-primary active:scale-95 mobile-font-btn" data-delta="-0.25">−</button>
            <span class="min-w-[50px] text-center text-[0.9rem] font-medium tabular-nums text-text-primary mobile-font-size-value" id="mobile-font-size-value">${fontSize.toFixed(2)}</span>
            <button class="w-9 h-9 flex items-center justify-center text-xl font-semibold text-text-primary bg-bg-primary border border-border-color rounded-md cursor-pointer transition-all duration-150 hover:bg-bg-hover hover:border-accent-primary active:scale-95 mobile-font-btn" data-delta="0.25">+</button>
          </div>
        </div>
        <p class="m-0 p-3 text-[0.75rem] text-text-muted bg-bg-primary rounded-md leading-[1.4] mobile-settings-note">Other settings are managed from the Control Panel's Confidence Monitor settings.</p>
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
          <button class="shrink-0 py-[0.35rem] px-[0.65rem] text-[0.7rem] font-semibold uppercase tracking-[0.5px] text-text-muted bg-bg-secondary border border-border-color rounded bg-clip-padding cursor-pointer transition-all duration-150 hover:bg-bg-hover hover:text-text-primary mobile-arrangement-item" 
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
    slide.classList.remove('past', 'current', 'future')
    const indicator = slide.querySelector('.tp-part-indicator span')
    const text = slide.querySelector('.tp-text')

    if (indicator) indicator.className = 'absolute whitespace-nowrap text-[0.7rem] font-bold uppercase tracking-[2px] rotate-[-90deg] text-text-muted';
    if (text) text.className = 'tp-text text-text-secondary';
    (slide as HTMLElement).style.opacity = 'var(--cm-prev-next-opacity, 0.35)';

    if (index < currentFlatIndex) {
      slide.classList.add('past')
    } else if (index === currentFlatIndex) {
      slide.classList.add('current')
      if (indicator) indicator.className = 'absolute whitespace-nowrap text-[0.7rem] font-bold uppercase tracking-[2px] rotate-[-90deg] text-accent-primary';
      if (text) text.className = 'tp-text text-text-primary font-medium';
      (slide as HTMLElement).style.opacity = '1';
    } else {
      slide.classList.add('future')
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
    const currentSlide = document.querySelector('.mobile-teleprompter .tp-slide.current')
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
