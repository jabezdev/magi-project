
import { renderPreviewColumn, initPreviewListeners } from './PreviewColumn'
import { renderLiveColumn, initLiveListeners } from './LiveColumn'
import { renderBackgroundsSection, initBackgroundsListeners } from './BackgroundsSection'
import { state, saveLayoutSettings } from '../../state'

export function renderProjectionControlColumn(): string {
  return `
    <div class="cp-column projection-control-column">
      <div class="projection-row">
        ${renderPreviewColumn()}
        ${renderLiveColumn()}
      </div>
      <div class="resizer" id="bg-panel-resizer" style="cursor: row-resize; height: 4px; width: 100%;"></div>
      <div class="backgrounds-row" style="${state.layoutSettings.backgroundsSectionHeight ? `height: ${state.layoutSettings.backgroundsSectionHeight}px` : ''}">
        ${renderBackgroundsSection()}
      </div>
    </div>
  `
}

export function initProjectionControlListeners(): void {
  initPreviewListeners()
  initLiveListeners()
  initBackgroundsListeners()
  initBackgroundsResizer()
}

function initBackgroundsResizer(): void {
  const resizer = document.getElementById('bg-panel-resizer')
  const backgroundsRow = document.querySelector('.backgrounds-row') as HTMLElement
  const projectionRow = document.querySelector('.projection-row') as HTMLElement

  if (!resizer || !backgroundsRow || !projectionRow) return

  let startY = 0
  let startHeight = 0
  let isResizing = false

  const onMouseDown = (e: MouseEvent) => {
    isResizing = true
    startY = e.clientY
    startHeight = backgroundsRow.offsetHeight
    resizer.classList.add('resizing')
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    // Moving down decreases height (if resizer is above, wait resizer is above bg row)
    // Resizer is top of bg row. Moving down decreases projection row, increases bg row?
    // Wait, typical layout: resizer is between.
    // If I move down, Top section grows, Bottom shrinks.
    // backgroundsRow is the bottom section.
    // So dy > 0 (down) -> Backgrounds shrinks. dy < 0 (up) -> Backgrounds grows.
    const deltaY = e.clientY - startY
    const newHeight = Math.max(100, Math.min(600, startHeight - deltaY))

    backgroundsRow.style.height = `${newHeight}px`
    // We don't touch projectionRow, it's flex: 1 so it auto adjusts
  }

  const onMouseUp = () => {
    isResizing = false
    resizer.classList.remove('resizing')
    document.body.style.cursor = ''
    document.body.style.userSelect = ''

    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)

    // Save
    const settings = { ...state.layoutSettings }
    settings.backgroundsSectionHeight = backgroundsRow.offsetHeight
    saveLayoutSettings(settings)
  }

  resizer.addEventListener('mousedown', onMouseDown)
}
