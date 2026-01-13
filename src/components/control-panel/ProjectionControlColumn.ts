
import { renderPreviewColumn, initPreviewListeners } from './PreviewColumn'
import { renderLiveColumn, initLiveListeners } from './LiveColumn'
import { renderBackgroundsSection, initBackgroundsListeners } from './BackgroundsSection'
import { state, saveLayoutSettings } from '../../state'

export function renderProjectionControlColumn(): string {
  // Inline Tailwind Classes
  const columnClass = "flex flex-col h-full projection-control-column"
  const projectionRowClass = "flex flex-1 min-h-0 gap-[1px] bg-border-color projection-row"
  const resizerClass = "bg-[#2a2a32] cursor-row-resize transition-colors duration-200 z-10 h-1 w-full hover:bg-accent-primary"
  const backgroundsRowClass = "h-[200px] border-t border-border-color bg-bg-primary overflow-hidden backgrounds-row"

  const bgHeight = state.layoutSettings.backgroundsSectionHeight
  const bgStyle = bgHeight ? `height: ${bgHeight}px;` : ''

  return `
    <div class="${columnClass}">
      <div class="${projectionRowClass}">
        ${renderPreviewColumn()}
        ${renderLiveColumn()}
      </div>
      <div class="${resizerClass}" id="bg-panel-resizer"></div>
      <div class="${backgroundsRowClass}" style="${bgStyle}">
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
    resizer.classList.add('bg-accent-primary') // 'resizing' state
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    const deltaY = e.clientY - startY
    const newHeight = Math.max(100, Math.min(600, startHeight - deltaY))

    backgroundsRow.style.height = `${newHeight}px`
  }

  const onMouseUp = () => {
    isResizing = false
    resizer.classList.remove('bg-accent-primary')
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
