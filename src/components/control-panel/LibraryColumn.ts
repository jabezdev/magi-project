import { renderScheduleList, initScheduleListListeners } from './ScheduleList'
import { renderUnifiedLibrary, initUnifiedLibraryListeners } from './UnifiedLibrary'
import { state, saveLayoutSettings } from '../../state'

export function renderLibraryColumn(): string {
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
             <div class="flex-1 min-h-0 relative library-content-area">
                ${renderUnifiedLibrary()}
             </div>
        </div>
      </div>
    </div>
  `
}

export function initLibraryColumnListeners(): void {
  initScheduleListListeners()
  initUnifiedLibraryListeners()
  initSectionResizers()
  applySavedLayoutSettings()
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

// UI Helpers (Legacy stub or updated?)
// The UnifiedLibrary handles its own selection UI classes if needed. 
// But if global state changes selection, we might need these.
// For now, let's keep them as no-ops or simple compat.

export function updateSongSelectionUI(): void {
  // TODO: Implement for unified library
}

export function updateLiveStatusUI(): void {
  // TODO: Implement for unified library
}

