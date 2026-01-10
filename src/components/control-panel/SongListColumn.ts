import { renderScheduleList, initScheduleListListeners } from './ScheduleList'
import { renderLibraryList, initLibraryListListeners } from './LibraryList'
import { renderBackgroundsSection, initBackgroundsListeners } from './BackgroundsSection'
import { renderStatusIndicator, initStatusIndicatorListener } from './StatusIndicator'
import { openSettings } from '../settings'
import { renderControlPanel } from '../../screens/ControlPanel'
import { ICONS } from '../../constants/icons'
import { state, saveLayoutSettings } from '../../state'

export function renderSongListColumn(): string {
  // We no longer rely on 'sets', we render Schedule + Library
  return `
    <div class="cp-column cp-songs">
      <div class="cp-column-body">
        ${renderScheduleList()}
        <div class="section-resizer" data-resize="schedule-library"></div>
        ${renderLibraryList()}
        <div class="section-resizer" data-resize="library-backgrounds"></div>
        ${renderBackgroundsSection()}
      </div>
      <div class="cp-column-footer" style="justify-content: space-between; align-items: center;">
        ${renderStatusIndicator()}
        <button class="icon-btn settings-footer-btn" id="settings-btn" title="Settings">${ICONS.settings}</button>
      </div>
    </div>
  `
}

export function initSongListListeners(): void {
  initScheduleListListeners()
  initLibraryListListeners()
  initBackgroundsListeners()
  initStatusIndicatorListener()
  initSectionResizers()
  applySavedLayoutSettings()

  // Settings button
  document.getElementById('settings-btn')?.addEventListener('click', () => {
    openSettings(() => renderControlPanel())
  })
}

function applySavedLayoutSettings(): void {
  const layout = state.layoutSettings
  
  // Apply saved section heights
  const scheduleSection = document.querySelector('.schedule-section') as HTMLElement
  const librarySection = document.querySelector('.library-section') as HTMLElement
  const backgroundsSection = document.querySelector('.video-section') as HTMLElement
  
  if (scheduleSection && layout.scheduleSectionHeight) {
    scheduleSection.style.height = `${layout.scheduleSectionHeight}px`
    scheduleSection.style.flex = 'none'
  }
  
  if (librarySection && layout.librarySectionHeight) {
    librarySection.style.height = `${layout.librarySectionHeight}px`
    librarySection.style.flex = 'none'
  }
  
  if (backgroundsSection && layout.backgroundsSectionHeight) {
    backgroundsSection.style.height = `${layout.backgroundsSectionHeight}px`
    backgroundsSection.style.flex = 'none'
  }
}

function saveCurrentLayout(): void {
  const scheduleSection = document.querySelector('.schedule-section') as HTMLElement
  const librarySection = document.querySelector('.library-section') as HTMLElement
  const backgroundsSection = document.querySelector('.video-section') as HTMLElement
  
  saveLayoutSettings({
    ...state.layoutSettings,
    scheduleSectionHeight: scheduleSection?.offsetHeight || null,
    librarySectionHeight: librarySection?.offsetHeight || null,
    backgroundsSectionHeight: backgroundsSection?.offsetHeight || null
  })
}

function initSectionResizers(): void {
  const resizers = document.querySelectorAll('.section-resizer')
  
  resizers.forEach(resizer => {
    let startY = 0
    let startHeightAbove = 0
    let startHeightBelow = 0
    let sectionAbove: HTMLElement | null = null
    let sectionBelow: HTMLElement | null = null
    
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      startY = e.clientY
      
      sectionAbove = resizer.previousElementSibling as HTMLElement
      sectionBelow = resizer.nextElementSibling as HTMLElement
      
      if (sectionAbove && sectionBelow) {
        startHeightAbove = sectionAbove.offsetHeight
        startHeightBelow = sectionBelow.offsetHeight
        resizer.classList.add('resizing')
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
      }
    }
    
    const onMouseMove = (e: MouseEvent) => {
      if (!sectionAbove || !sectionBelow) return
      
      const deltaY = e.clientY - startY
      const newHeightAbove = Math.max(60, startHeightAbove + deltaY)
      const newHeightBelow = Math.max(60, startHeightBelow - deltaY)
      
      sectionAbove.style.height = `${newHeightAbove}px`
      sectionAbove.style.flex = 'none'
      sectionBelow.style.height = `${newHeightBelow}px`
      sectionBelow.style.flex = 'none'
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
