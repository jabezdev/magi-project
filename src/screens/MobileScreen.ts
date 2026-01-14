import { state, subscribeToState, StateChangeKey } from '../state'
import type { ProjectableItem, ContentSlide, Schedule } from '../types'
import { updateHTML } from '../utils'
import { hydrateContent } from '../utils/content'

// Local storage key for mobile font size
const MOBILE_FONT_SIZE_KEY = 'magi-mobile-font-size'

// Track currently viewed item (may differ from live)
let viewedItem: ProjectableItem | null = null
let viewedContent: ContentSlide[] = []
let viewedPosition: number = 0

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
  const { displayMode, liveItem, liveContent, livePosition, confidenceMonitorSettings, schedule } = state
  const mobileFontSize = loadMobileFontSize()

  // Use live item by default
  const currentItem = viewedItem || liveItem
  const currentContent = viewedItem ? viewedContent : liveContent
  const currentPosition = viewedItem ? viewedPosition : livePosition
  const isViewingLiveItem = !viewedItem || !!(liveItem && viewedItem.id === liveItem.id)

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
      ${buildMobileNavbar(currentItem, schedule)}
      ${buildArrangementBar(currentItem, currentContent, currentPosition, isViewingLiveItem)}
      <div class="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scroll-smooth mobile-teleprompter" style="padding: var(--cm-margin-top, 0.5rem) var(--cm-margin-right, 0.5rem) var(--cm-margin-bottom, 0.5rem) var(--cm-margin-left, 0.5rem);">
        ${buildTeleprompterContent(currentItem, currentContent, currentPosition, displayMode, isViewingLiveItem)}
      </div>
      ${buildRealignButton(!isViewingLiveItem)}
      ${buildSettingsPanel(mobileFontSize)}
      <button class="fixed top-2 right-2 w-10 h-10 flex items-center justify-center text-text-muted bg-transparent border-none rounded-full cursor-pointer transition-all duration-200 z-[60] hover:text-text-primary hover:bg-bg-hover mobile-settings-btn" title="Settings">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </button>
    </div>
  `
}

function buildMobileNavbar(currentItem: ProjectableItem | null, schedule: Schedule): string {
  const currentId = currentItem?.id || ''

  const options = schedule.items.length > 0
    ? schedule.items.map(item =>
      `<option value="${item.id}" ${item.id === currentId ? 'selected' : ''}>${item.title}</option>`
    ).join('')
    : '<option value="">No items scheduled</option>'

  return `
    <nav class="flex justify-center items-center p-2 bg-bg-secondary border-b border-border-color shrink-0 mobile-navbar">
      <select class="flex-1 max-w-[400px] py-2 px-4 text-base font-medium text-text-primary bg-bg-primary border border-border-color rounded-md cursor-pointer appearance-none bg-no-repeat pr-10 focus:outline-none focus:border-accent-primary mobile-song-select" id="mobile-song-select" style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E&quot;); background-position: right 0.75rem center;">
        ${options}
      </select>
    </nav>
  `
}

function buildArrangementBar(item: ProjectableItem | null, content: ContentSlide[], position: number, isViewingLiveItem: boolean): string {
  if (!item || content.length <= 1) {
    return '<div class="flex gap-1 p-2 bg-bg-tertiary border-b border-border-color shrink-0 overflow-x-auto mobile-arrangement" style="scrollbar-width: none; display: none;"></div>'
  }

  // Find unique parts for navigation (mostly for songs)
  const parts: { id: string, label: string, index: number }[] = []
  content.forEach((slide, idx) => {
    if (slide.partId && !parts.find(p => p.id === slide.partId)) {
      parts.push({ id: slide.partId, label: slide.label || slide.partId, index: idx })
    }
  })

  // If no parts found, maybe it's a slide deck or scripture list, just show index markers?
  // For now, only show if we have explicit parts (like songs).
  if (parts.length === 0) return ''

  const currentSlide = content[position]
  const currentPartId = isViewingLiveItem ? currentSlide?.partId : ''

  const partsHTML = parts.map((part) => {
    const isActive = part.id === currentPartId

    return `
      <button class="shrink-0 py-[0.35rem] px-[0.65rem] text-[0.7rem] font-semibold uppercase tracking-[0.5px] border border-border-color rounded bg-clip-padding cursor-pointer transition-all duration-150 ${isActive ? 'bg-accent-primary text-white border-accent-primary' : 'text-text-muted bg-bg-secondary hover:bg-bg-hover hover:text-text-primary'} mobile-arrangement-item" 
              data-slide-index="${part.index}"
              title="${part.label}">
        ${part.id}
      </button>
    `
  }).join('')

  return `
    <div class="flex gap-1 p-2 bg-bg-tertiary border-b border-border-color shrink-0 overflow-x-auto mobile-arrangement" style="scrollbar-width: none;">
      ${partsHTML}
    </div>
  `
}

function buildTeleprompterContent(item: ProjectableItem | null, content: ContentSlide[], position: number, displayMode: string, isViewingLiveItem: boolean): string {
  // Handle special display modes (only show for live song)
  if (isViewingLiveItem) {
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

  if (content.length === 0) {
    return '<div class="flex items-center justify-center flex-1 text-xl text-text-muted cm-empty">No content loaded</div>'
  }

  const slidesHTML = content.map((slide, index) => {
    let slideClass = 'tp-slide'
    let style = `opacity: var(--cm-prev-next-opacity, 0.35);`
    let isCurrent = false;

    if (isViewingLiveItem) {
      if (index < position) {
        slideClass += ' past'
      } else if (index === position) {
        slideClass += ' current'
        style = `opacity: 1;`
        isCurrent = true;
      } else {
        slideClass += ' future'
      }
    } else {
      // When browsing, maybe don't dim existing slides? or just keep them normal?
      style = `opacity: 1;`
    }

    const textStyle = `font-size: var(--cm-font-size, 2.5rem); line-height: var(--cm-line-height, 1.4); font-family: var(--cm-font-family, system-ui);`

    if (slide.type === 'image') {
      return `
            <div class="flex flex-col items-center justify-center w-full py-6 ${slideClass}" data-index="${index}" id="mobile-tp-slide-${index}" style="${style}">
                 <img src="${slide.content}" class="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg" />
                 ${slide.label ? `<div class="mt-2 text-xs text-text-muted uppercase tracking-widest">${slide.label}</div>` : ''}
            </div>
        `
    }

    return `
      <div class="flex items-stretch w-full transition-all duration-500 ease-in-out py-6 ${slideClass}" data-index="${index}" id="mobile-tp-slide-${index}" style="${style}">
        <div class="flex items-center justify-center w-10 shrink-0 relative tp-part-indicator">
          <span class="absolute whitespace-nowrap text-[0.7rem] font-bold uppercase tracking-[2px] rotate-[-90deg] ${isCurrent ? 'text-accent-primary' : 'text-text-muted'}">${slide.label || ''}</span>
        </div>
        <div class="flex-1 flex items-center pl-4 tp-content">
          <div class="tp-text ${isCurrent ? 'text-text-primary font-medium' : 'text-text-secondary'}" style="${textStyle}">${(slide.content || '').replace(/\n/g, '<br>')}</div>
        </div>
      </div>
    `
  }).join('')

  return `
    <div class="flex flex-col items-stretch w-full teleprompter-scroll" data-current-index="${position}" data-item-id="${item?.id || ''}">
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
  const itemId = select.value

  if (!itemId) return

  // Find the item in schedule
  const scheduleItem = state.schedule.items.find(item => item.id === itemId)
  if (!scheduleItem) return

  // Hydrate content for this item
  const hydratedContent = await hydrateContent(scheduleItem)

  viewedItem = scheduleItem
  viewedContent = hydratedContent
  viewedPosition = 0

  // Show the sync button
  const realignBtn = document.getElementById('mobile-realign-btn')
  if (realignBtn) realignBtn.classList.remove('hidden')

  // Rebuild teleprompter
  const teleprompter = document.querySelector('.mobile-teleprompter')
  if (teleprompter) {
    updateHTML(teleprompter, buildTeleprompterContent(viewedItem, viewedContent, viewedPosition, state.displayMode, false))
  }

  // Rebuild arrangement bar
  const arrangementContainer = document.querySelector('.mobile-arrangement')
  if (arrangementContainer) {
    arrangementContainer.innerHTML = buildArrangementBar(viewedItem, viewedContent, viewedPosition, false)
    if (arrangementContainer instanceof HTMLElement) {
      arrangementContainer.style.display = viewedContent.length > 1 ? 'flex' : 'none'
    }

    // Re-attach event listeners
    document.querySelectorAll('.mobile-arrangement-item').forEach(item => {
      item.addEventListener('click', handleArrangementClick)
    })
  }

  scrollToSlideIndex(0)
}

function handleArrangementClick(e: Event): void {
  const btn = e.currentTarget as HTMLElement
  const slideIndex = parseInt(btn.dataset.slideIndex || '0', 10)

  if (viewedItem) viewedPosition = slideIndex
  scrollToSlideIndex(slideIndex)
}

function handleRealign(): void {
  viewedItem = null
  viewedContent = []
  viewedPosition = 0

  const realignBtn = document.getElementById('mobile-realign-btn')
  if (realignBtn) realignBtn.classList.add('hidden')

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

  const valueEl = document.getElementById('mobile-font-size-value')
  if (valueEl) valueEl.textContent = currentSize.toFixed(2)

  const screen = document.querySelector('.mobile-screen') as HTMLElement
  if (screen) screen.style.setProperty('--cm-font-size', `${currentSize}rem`)
}

function updateTeleprompterContent(): void {
  const { displayMode, liveItem, liveContent, livePosition } = state
  const teleprompter = document.querySelector('.mobile-teleprompter')
  const existingScroll = teleprompter?.querySelector('.teleprompter-scroll')

  if (!teleprompter) return

  const isViewingLiveItem = !viewedItem || (liveItem && viewedItem.id === liveItem.id)
  if (!isViewingLiveItem) return

  const currentItemId = existingScroll?.getAttribute('data-item-id')
  const newItemId = liveItem?.id?.toString() || ''
  const needsFullRebuild = !existingScroll || currentItemId !== newItemId || displayMode !== 'lyrics'

  if (needsFullRebuild) {
    updateHTML(teleprompter, buildTeleprompterContent(liveItem, liveContent, livePosition, displayMode, true))
    scrollToCurrentSlide()
  } else {
    updateSlideClasses(livePosition)
    scrollToCurrentSlide()
  }
}

function updateArrangementBar(): void {
  const { livePosition, liveItem, liveContent } = state
  const arrangementContainer = document.querySelector('.mobile-arrangement')

  if (!arrangementContainer) return

  const isViewingLiveItem = !viewedItem || (liveItem && viewedItem.id === liveItem.id)
  if (!isViewingLiveItem) return

  if (!liveItem || liveContent.length <= 1) {
    arrangementContainer.innerHTML = ''
    if (arrangementContainer instanceof HTMLElement) {
      arrangementContainer.style.display = 'none'
    }
    return
  }

  arrangementContainer.innerHTML = buildArrangementBar(liveItem, liveContent, livePosition, true)
  if (arrangementContainer instanceof HTMLElement) {
    arrangementContainer.style.display = 'flex'
  }

  document.querySelectorAll('.mobile-arrangement-item').forEach(item => {
    item.addEventListener('click', handleArrangementClick)
  })
}

function updateSlideClasses(position: number): void {
  const { liveContent } = state
  if (liveContent.length === 0) return

  document.querySelectorAll('.mobile-teleprompter .tp-slide').forEach((slide, index) => {
    slide.classList.remove('past', 'current', 'future')
    const indicator = slide.querySelector('.tp-part-indicator span')
    const text = slide.querySelector('.tp-text')

    if (indicator) indicator.className = 'absolute whitespace-nowrap text-[0.7rem] font-bold uppercase tracking-[2px] rotate-[-90deg] text-text-muted';
    if (text) text.className = 'tp-text text-text-secondary';
    (slide as HTMLElement).style.opacity = 'var(--cm-prev-next-opacity, 0.35)';

    if (index < position) {
      slide.classList.add('past')
    } else if (index === position) {
      slide.classList.add('current')
      if (indicator) indicator.className = 'absolute whitespace-nowrap text-[0.7rem] font-bold uppercase tracking-[2px] rotate-[-90deg] text-accent-primary';
      if (text) text.className = 'tp-text text-text-primary font-medium';
      (slide as HTMLElement).style.opacity = '1';
    } else {
      slide.classList.add('future')
    }
  })

  const scrollContainer = document.querySelector('.mobile-teleprompter .teleprompter-scroll')
  if (scrollContainer) scrollContainer.setAttribute('data-current-index', String(position))
}

function scrollToCurrentSlide(): void {
  requestAnimationFrame(() => {
    const currentSlide = document.querySelector('.mobile-teleprompter .tp-slide.current')
    if (currentSlide) currentSlide.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function scrollToSlideIndex(index: number): void {
  requestAnimationFrame(() => {
    const slide = document.getElementById(`mobile-tp-slide-${index}`)
    if (slide) slide.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
  const { schedule, liveItem } = state
  const songSelect = document.getElementById('mobile-song-select') as HTMLSelectElement

  if (!songSelect) return

  const currentItem = viewedItem || liveItem
  const currentId = currentItem?.id || ''

  const options = schedule.items.length > 0
    ? schedule.items.map(item =>
      `<option value="${item.id}" ${item.id === currentId ? 'selected' : ''}>${item.title}</option>`
    ).join('')
    : '<option value="">No items scheduled</option>'

  songSelect.innerHTML = options
}

export function resetMobileViewState(): void {
  viewedItem = null
  viewedContent = []
  viewedPosition = 0
}

export function renderMobileScreen(): void {
  const app = document.getElementById('app')
  if (!app) return

  cleanup()
  app.innerHTML = buildMobileScreenHTML()
  setupMobileEventListeners()
  setupMobileUpdates()
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

    if (changedKeys.includes('live' as any) || changedKeys.includes('livePosition') || changedKeys.includes('displayMode')) {
      updateTeleprompterContent()
      updateArrangementBar()
    }

    if (changedKeys.includes('data' as any) || changedKeys.includes('schedule')) {
      updateSongSelector()
    }

    if (changedKeys.includes('confidenceMonitorSettings')) {
      updateMobileScreenStyles()
    }
  })
}
