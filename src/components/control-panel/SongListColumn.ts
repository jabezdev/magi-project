import { renderScheduleList, initScheduleListListeners } from './ScheduleList'
import { renderLibraryList, initLibraryListListeners } from './LibraryList'

import { state, saveLayoutSettings } from '../../state'

export function renderSongListColumn(): string {
  // We no longer rely on 'sets', we render Schedule + Library
  return `
    <div class="cp-column cp-songs">
      <div class="cp-column-body">
        ${renderScheduleList()}
        <div class="section-resizer" data-resize="schedule-library"></div>
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
  // This prevents blank spaces if window size changes or if total fixed heights < container height
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
    // We intentionally don't save library height as fixed, so it can flex
    librarySectionHeight: null,
    // backgroundsSectionHeight: backgroundsSection?.offsetHeight || null // moved
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
        resizer.classList.add('resizing')
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

      // We don't set sectionBelow height. Let it flex.
      // sectionBelow.style.height = `${newHeightBelow}px`
      sectionBelow.style.flex = '1'
    }

    const onMouseUp = () => {
      resizer.classList.remove('resizing')
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

  // Update both schedule and library lists
  document.querySelectorAll('.song-item').forEach(el => {
    const id = parseInt(el.getAttribute('data-song-id') || '0')
    if (id === selectedId) {
      el.classList.add('selected')
      // Ensure specific variation is highlighted if applicable (only for schedule items handling it strictly)
      // But mainly just highlighting the song is enough for now or matching specifically.
    } else {
      el.classList.remove('selected')
    }
  })
}

/**
 * Update the live state in the song lists without full re-render
 */
export function updateLiveStatusUI(): void {
  const liveId = state.liveSong?.id

  document.querySelectorAll('.song-item').forEach(el => {
    const id = parseInt(el.getAttribute('data-song-id') || '0')
    if (id === liveId) {
      el.classList.add('live')
    } else {
      el.classList.remove('live')
    }
  })
}
