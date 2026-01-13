import { renderScheduleList, initScheduleListListeners } from './ScheduleList'
import { renderLibraryList, initLibraryListListeners } from './SongsTab'
import { renderMediaLibraryList, initMediaLibraryListeners } from './MediaTab'
import { renderScripturePicker, initScripturePickerListeners } from './BibleTab'
import { renderPresentationsTab, initPresentationsTabListeners } from './PresentationsTab'
import { ICONS } from '../../constants'

import { state, saveLayoutSettings } from '../../state'

// Track active tab
let activeTab = localStorage.getItem('magi_active_library_tab') || 'songs'

export function renderSongListColumn(): string {
  // Inline Tailwind Classes
  const columnClass = "flex flex-col bg-bg-primary overflow-hidden min-w-0 cp-songs"
  const columnBodyClass = "flex-1 overflow-y-auto p-0 flex flex-col"
  const resizerClass = "h-1 bg-[#2a2a32] cursor-row-resize transition-colors duration-200 z-10 hover:bg-accent-primary section-resizer"

  return `
    <div class="${columnClass}">
      <div class="${columnBodyClass}">
        ${renderScheduleList()}
        <div class="${resizerClass}" data-resize="schedule-library"></div>
        
        <div class="flex flex-col flex-1 min-h-0 library-wrapper" id="library-wrapper">
             ${renderTabsHeader()}
             <div class="flex-1 min-h-0 relative bg-bg-tertiary/30">
                <div class="absolute inset-0 ${activeTab === 'songs' ? '' : 'hidden'} tab-content" id="tab-songs">
                    ${renderLibraryList()}
                </div>
                <div class="absolute inset-0 ${activeTab === 'media' ? '' : 'hidden'} tab-content" id="tab-media">
                    ${renderMediaLibraryList()}
                </div>
                <div class="absolute inset-0 ${activeTab === 'presentations' ? '' : 'hidden'} tab-content" id="tab-presentations">
                    ${renderPresentationsTab()}
                </div>
                <div class="absolute inset-0 ${activeTab === 'bible' ? '' : 'hidden'} tab-content" id="tab-bible">
                    ${renderScripturePicker()}
                </div>
             </div>
        </div>
      </div>
    </div>
  `
}

function renderTabsHeader(): string {
  const tabs = [
    { id: 'songs', icon: ICONS.music, label: 'Songs' },
    { id: 'media', icon: ICONS.video, label: 'Media' },
    { id: 'presentations', icon: ICONS.screen, label: 'Presentations' },
    { id: 'bible', icon: ICONS.book, label: 'Bible' }
  ]

  const headerClass = "flex items-center justify-between bg-bg-secondary border-b border-border-color h-[40px] px-2 shrink-0 select-none gap-2"
  // Use button style like Display Controls (rounded, icon center)
  const tabClass = "flex-1 h-[28px] max-w-[60px] flex items-center justify-center rounded text-text-muted hover:bg-bg-hover hover:text-text-primary transition-all cursor-pointer border border-transparent"
  const activeClass = "bg-accent-primary text-white hover:bg-accent-primary hover:text-white border-accent-primary shadow-sm"

  return `
        <div class="${headerClass}">
            <div class="flex items-center justify-center gap-1 w-full">
            ${tabs.map(t => `
                <div class="${tabClass} ${activeTab === t.id ? activeClass : ''} library-tab" data-tab="${t.id}" title="${t.label}">
                    <span class="w-[16px] h-[16px]">${t.icon}</span>
                </div>
            `).join('')}
            </div>
        </div>
    `
}

export function initSongListListeners(): void {
  initScheduleListListeners()

  // Init all sub-components
  initLibraryListListeners()
  initMediaLibraryListeners()
  initScripturePickerListeners()
  initPresentationsTabListeners()

  // Tabs
  initTabsListeners()

  initSectionResizers()
  applySavedLayoutSettings()
}

function initTabsListeners(): void {
  const tabs = document.querySelectorAll('.library-tab')

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab') || 'songs'
      setActiveTab(tabId)
    })
  })
}

function setActiveTab(tabId: string): void {
  activeTab = tabId
  localStorage.setItem('magi_active_library_tab', tabId)

  // Update Header
  const activeClassTokens = ['bg-accent-primary', 'text-white', 'hover:bg-accent-primary', 'hover:text-white', 'border-accent-primary', 'shadow-sm']

  document.querySelectorAll('.library-tab').forEach(t => {
    const id = t.getAttribute('data-tab')
    if (id === tabId) {
      t.classList.add(...activeClassTokens)
    } else {
      t.classList.remove(...activeClassTokens)
    }
  })

  // Update Content
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.add('hidden')
  })
  document.getElementById(`tab-${tabId}`)?.classList.remove('hidden')
}

function applySavedLayoutSettings(): void {
  const layout = state.layoutSettings

  // Apply saved section heights
  const scheduleSection = document.querySelector('.schedule-section') as HTMLElement
  const libraryWrapper = document.querySelector('.library-wrapper') as HTMLElement

  if (scheduleSection && layout.scheduleSectionHeight) {
    scheduleSection.style.height = `${layout.scheduleSectionHeight}px`
    scheduleSection.style.flex = 'none'
  }

  // Library wrapper takes remaining space
  if (libraryWrapper) {
    libraryWrapper.style.height = ''
    libraryWrapper.style.flex = '1'
  }
}

function saveCurrentLayout(): void {
  const scheduleSection = document.querySelector('.schedule-section') as HTMLElement

  saveLayoutSettings({
    ...state.layoutSettings,
    scheduleSectionHeight: scheduleSection?.offsetHeight || null,
    // we don't save library height as it's flex-1
  })
}

function initSectionResizers(): void {
  const resizers = document.querySelectorAll('.section-resizer')

  resizers.forEach(resizer => {
    let startY = 0
    let startHeightAbove = 0
    let sectionAbove: HTMLElement | null = null
    let sectionBelow: HTMLElement | null = null

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      startY = e.clientY

      sectionAbove = resizer.previousElementSibling as HTMLElement
      // The sibling below might be the library wrapper now
      sectionBelow = resizer.nextElementSibling as HTMLElement

      if (sectionAbove && sectionBelow) {
        startHeightAbove = sectionAbove.offsetHeight
        resizer.classList.add('bg-accent-primary') // 'resizing' state
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!sectionAbove || !sectionBelow) return

      const deltaY = e.clientY - startY
      const newHeightAbove = Math.max(60, startHeightAbove + deltaY)

      sectionAbove.style.height = `${newHeightAbove}px`
      sectionAbove.style.flex = 'none'

      sectionBelow.style.flex = '1'
    }

    const onMouseUp = () => {
      resizer.classList.remove('bg-accent-primary')
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      // Save layout after resize is complete
      saveCurrentLayout()
    }

    resizer.addEventListener('mousedown', onMouseDown as EventListener)
  })
}

/**
 * Update the selection state in the song lists without full re-render
 */
export function updateSongSelectionUI(): void {
  const selectedId = state.previewSong?.id

  // Tailwind classes for selected state
  const selectedClasses = ['border-accent-primary', 'bg-indigo-500/10']

  document.querySelectorAll('.song-item').forEach(el => {
    const id = parseInt(el.getAttribute('data-song-id') || '0')
    if (id === selectedId) {
      el.classList.add('selected', ...selectedClasses)
    } else {
      el.classList.remove('selected', ...selectedClasses)
    }
  })
}

/**
 * Update the live state in the song lists without full re-render
 */
export function updateLiveStatusUI(): void {
  const liveId = state.liveSong?.id

  // Tailwind classes for live state
  const liveClasses = ['border-live-red', 'bg-red-600/10']

  document.querySelectorAll('.song-item').forEach(el => {
    const id = parseInt(el.getAttribute('data-song-id') || '0')
    if (id === liveId) {
      el.classList.add('live', ...liveClasses)
    } else {
      el.classList.remove('live', ...liveClasses)
    }
  })
}
