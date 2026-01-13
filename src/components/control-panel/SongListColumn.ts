import { renderScheduleList, initScheduleListListeners } from './ScheduleList'
import { renderLibraryList, initLibraryListListeners } from './LibraryList'

import { state, saveLayoutSettings } from '../../state'

export function renderSongListColumn(): string {
  // Inline Tailwind Classes
  const columnClass = "flex flex-col bg-bg-primary overflow-hidden min-w-0 cp-songs"
  const columnBodyClass = "flex-1 overflow-y-auto p-0 flex flex-col" // cp-column-body, but different layout for songs
  const resizerClass = "h-1 bg-[#2a2a32] cursor-row-resize transition-colors duration-200 z-10 hover:bg-accent-primary section-resizer"

  // Note: Schedule and Library sections have their own internal structure and should follow the cp-section pattern
  // I'm not modifying render functions here, just the column wrapper.

  return `
    <div class="${columnClass}">
      <div class="${columnBodyClass}">
        ${renderScheduleList()}
        <div class="${resizerClass}" data-resize="schedule-library"></div>
        ${renderLibraryList()}
      </div>
    </div>
  `
}

export function initSongListListeners(): void {
  initScheduleListListeners()
  initLibraryListListeners()
  initSectionResizers()
  applySavedLayoutSettings()
}

function applySavedLayoutSettings(): void {
  const layout = state.layoutSettings

  // Apply saved section heights
  const scheduleSection = document.querySelector('.schedule-section') as HTMLElement
  const librarySection = document.querySelector('.library-section') as HTMLElement
  if (scheduleSection && layout.scheduleSectionHeight) {
    scheduleSection.style.height = `${layout.scheduleSectionHeight}px`
    scheduleSection.style.flex = 'none'
  }

  // We DO NOT apply librarySection height. It should retain flex: 1 to fill remaining space
  if (librarySection) {
    librarySection.style.height = ''
    librarySection.style.flex = '1'
  }
}

function saveCurrentLayout(): void {
  const scheduleSection = document.querySelector('.schedule-section') as HTMLElement

  saveLayoutSettings({
    ...state.layoutSettings,
    scheduleSectionHeight: scheduleSection?.offsetHeight || null,
    librarySectionHeight: null,
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
