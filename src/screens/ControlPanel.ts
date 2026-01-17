import '../style.css'
import { UnifiedLibrary } from '../components/UnifiedLibrary'
import { PreviewPanel } from '../components/PreviewPanel'
import { LivePanel } from '../components/LivePanel'
import { SchedulePanel } from '../components/SchedulePanel'
import { OutputStatusPanel } from '../components/OutputStatusPanel'
import { AudioMixerPanel } from '../components/AudioMixerPanel'
import { UtilityPanelManager } from '../components/UtilityPanelManager'
import { openSettingsModal } from '../components/modals/SettingsModal'
import { KeyboardService } from '../services/KeyboardService'

export class ControlPanel {
  element: HTMLElement;

  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'layout-grid'
    this.render()
    this.initResizers()
  }

  render() {
    this.element.innerHTML = `
            <!-- COLUMN 1: Resources -->
            <div class="col-resources">
                <div id="panel-schedule" class="flex-1 overflow-hidden bg-gray-900 border-b border-gray-700" style="flex: none; height: 40%; min-height: 150px;"></div>
                <div class="resizer-row" id="resizer-resources"></div>
                <div id="panel-library" class="flex-1 overflow-hidden"></div>
            </div>

            <!-- RESIZER 1 -->
            <div class="resizer-col" id="resizer-col-1"></div>

            <!-- COLUMN 2: Operation (Grid) -->
            <div class="col-operation">
                
                <!-- LEFT COLUMN (Preview) -->
                <div class="op-col" id="op-col-left">
                     <!-- Preview Panel -->
                     <div id="panel-preview-mount" class="panel-mount" style="border-right: 1px solid #333; background: #222;"></div>
                     
                     <!-- Preview Utility Resizer -->
                     <div class="resizer-row" id="resizer-preview-utility"></div>
                     
                     <!-- Preview Utility -->
                     <div id="panel-utility-preview" class="utility-mount" style="height: var(--height-utility-preview, 30%); min-height: 0;"></div>
                </div>

                <!-- CENTER SPLIT RESIZER -->
                <div class="resizer-col" id="resizer-center-split"></div>

                <!-- RIGHT COLUMN (Live) -->
                <div class="op-col" id="op-col-right">
                     <!-- Live Panel -->
                     <div id="panel-live-mount" class="panel-mount" style="background: #222;"></div>
                     
                     <!-- Live Utility Resizer -->
                     <div class="resizer-row" id="resizer-live-utility"></div>
                     
                     <!-- Live Utility -->
                     <div id="panel-utility-live" class="utility-mount" style="height: var(--height-utility-live, 30%); min-height: 0;"></div>
                </div>

            </div>

            <!-- RESIZER 2 -->
            <div class="resizer-col" id="resizer-col-2"></div>

            <!-- COLUMN 3: Outputs -->
            <div class="col-outputs flex flex-col">
                <div id="panel-outputs" class="flex-1 overflow-hidden bg-gray-900 min-h-0"></div>
                
                <div class="resizer-row" id="resizer-outputs"></div>

                <!-- Audio Mixer -->
                 <div id="panel-audio" class="bg-gray-900 flex-none border-t border-gray-800 flex flex-col overflow-hidden" style="height: var(--height-audio, 180px); min-height: 180px;"></div>

                <!-- Settings Button -->
                <div class="border-t border-gray-800 bg-[#0a0a0a] flex justify-between items-center h-7 select-none px-2">
                    <div class="flex items-center gap-2" title="Server Connection: Active">
                        <div class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] "></div>
                    </div>
                    <button id="btn-settings" class="aspect-square h-full text-gray-500 hover:text-white hover:bg-gray-800  flex items-center justify-center border-l border-gray-800" title="Settings">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                </div>
            </div>
        `

    // Mount Sub-components
    const scheduleContainer = this.element.querySelector('#panel-schedule')
    if (scheduleContainer) scheduleContainer.appendChild(new SchedulePanel().element)

    const libraryContainer = this.element.querySelector('#panel-library')
    if (libraryContainer) libraryContainer.appendChild(new UnifiedLibrary().element)

    const previewContainer = this.element.querySelector('#panel-preview-mount')
    if (previewContainer) previewContainer.appendChild(new PreviewPanel().element)

    const liveContainer = this.element.querySelector('#panel-live-mount')
    if (liveContainer) liveContainer.appendChild(new LivePanel().element)

    const outputsContainer = this.element.querySelector('#panel-outputs')
    if (outputsContainer) outputsContainer.appendChild(new OutputStatusPanel().element)

    const audioContainer = this.element.querySelector('#panel-audio')
    if (audioContainer) audioContainer.appendChild(new AudioMixerPanel().element)

    // Mount Independent Utility Panels
    const previewUtilMount = this.element.querySelector('#panel-utility-preview') as HTMLElement
    const previewResizer = this.element.querySelector('#resizer-preview-utility') as HTMLElement
    new UtilityPanelManager(previewUtilMount, previewResizer, 'preview')

    const liveUtilMount = this.element.querySelector('#panel-utility-live') as HTMLElement
    const liveResizer = this.element.querySelector('#resizer-live-utility') as HTMLElement
    new UtilityPanelManager(liveUtilMount, liveResizer, 'live')

    // Initialize Shortcuts
    new KeyboardService()

    this.element.querySelector('#btn-settings')?.addEventListener('click', () => {
      openSettingsModal()
    })
  }

  initResizers() {
    const makeResizable = (resizer: HTMLElement, direction: 'horizontal' | 'vertical', onDrag: (delta: number) => void) => {
      let startX = 0
      let startY = 0
      let isDragging = false

      resizer.addEventListener('mousedown', (e) => {
        isDragging = true
        startX = e.clientX
        startY = e.clientY
        resizer.classList.add('resizing')
        e.preventDefault()
      })

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return
        const dx = e.clientX - startX
        const dy = e.clientY - startY
        onDrag(direction === 'horizontal' ? dx : dy)
        startX = e.clientX
        startY = e.clientY
      })

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false
          resizer.classList.remove('resizing')
        }
      })
    }

    // 1. Resources Width (Col 1)
    const resizer1 = this.element.querySelector('#resizer-col-1') as HTMLElement
    if (resizer1) {
      makeResizable(resizer1, 'horizontal', (dx) => {
        const root = document.documentElement
        const currentWidth = parseInt(getComputedStyle(root).getPropertyValue('--width-col-resources')) || 320
        const newWidth = Math.max(400, Math.min(800, currentWidth + dx))
        root.style.setProperty('--width-col-resources', `${newWidth}px`)
      })
    }

    // 2. Center Split (Between Preview & Live columns)
    // Actually, this is fixed 1fr 1fr usually, but if we want to allow resizing:
    // This would change the grid definition. For now, let's keep it 1fr 1fr and maybe just allow small adjustments?
    // Or ignore it if 50/50 is the golden standard.
    // The user didn't ask explicitly to resize the 50/50 split, but "different panel controls (resizing)" likely meant utility height.
    // So let's skip implementing logic for 'resizer-center-split' unless we change the grid to pixels.
    // Wait, grid-template-columns: var(--width-col-resources) 4px 1fr 4px var(--width-col-outputs);
    // 1fr takes remaining space. Splitting that 1fr into two columns needs 'subgrid' or nested grid.
    // Current CSS: .col-operation { display: grid; grid-template-columns: 1fr 4px 1fr; }
    // If I resize this, I need to change 1fr 1fr to something else. 
    // Since flexbox is easier for variable split, maybe switch back to flex row for col-operation?
    // But CSS is already GRID.
    // Let's Just keep it simple: 50/50 split is fine for now on the horizontal axis. 
    // Just implement vertical resizers for utility panels.

    // 3. Preview Utility Height
    const resizerPreviewUtil = this.element.querySelector('#resizer-preview-utility') as HTMLElement
    if (resizerPreviewUtil) {
      makeResizable(resizerPreviewUtil, 'vertical', (dy) => {
        const panel = this.element.querySelector('#panel-utility-preview') as HTMLElement
        if (panel) {
          const h = panel.clientHeight
          const newH = Math.max(0, h - dy) // Dragging UP increases height? No, resizer is ABOVE utility.
          // Resizer is between PreviewPanel (Top) and Utility (Bottom).
          // Dragging DOWN (+dy) -> Preview Panel Grows, Utility Shrinks.
          // So Utility New Height = Current Height - dy.
          panel.style.height = `${newH}px`
          document.documentElement.style.setProperty('--height-utility-preview', `${newH}px`)
        }
      })
    }

    // 4. Live Utility Height
    const resizerLiveUtil = this.element.querySelector('#resizer-live-utility') as HTMLElement
    if (resizerLiveUtil) {
      makeResizable(resizerLiveUtil, 'vertical', (dy) => {
        const panel = this.element.querySelector('#panel-utility-live') as HTMLElement
        if (panel) {
          const h = panel.clientHeight
          const newH = Math.max(0, h - dy) // Same logic
          panel.style.height = `${newH}px`
          document.documentElement.style.setProperty('--height-utility-live', `${newH}px`)
        }
      })
    }

    // 5. Output Column Width
    const resizer2 = this.element.querySelector('#resizer-col-2') as HTMLElement
    if (resizer2) {
      makeResizable(resizer2, 'horizontal', (dx) => {
        const root = document.documentElement
        const currentWidth = parseInt(getComputedStyle(root).getPropertyValue('--width-col-outputs')) || 340
        const newWidth = Math.max(200, Math.min(600, currentWidth - dx))
        root.style.setProperty('--width-col-outputs', `${newWidth}px`)
      })
    }

    // 6. Audio Mixer Height
    const resizerOutputs = this.element.querySelector('#resizer-outputs') as HTMLElement
    if (resizerOutputs) {
      makeResizable(resizerOutputs, 'vertical', (dy) => {
        const bottomPanel = this.element.querySelector('#panel-audio') as HTMLElement
        if (bottomPanel) {
          const h = bottomPanel.clientHeight
          const newH = Math.max(180, h - dy) // Resizer is ABOVE audio. Drag Down -> Shrinks.
          bottomPanel.style.height = `${newH}px`
          document.documentElement.style.setProperty('--height-audio', `${newH}px`)
        }
      })
    }

    // 7. Schedule Height
    const resizerResources = this.element.querySelector('#resizer-resources') as HTMLElement
    if (resizerResources) {
      makeResizable(resizerResources, 'vertical', (dy) => {
        const topPanel = this.element.querySelector('#panel-schedule') as HTMLElement
        if (topPanel) {
          const h = topPanel.clientHeight
          const newH = Math.max(100, h + dy)
          topPanel.style.height = `${newH}px`
        }
      })
    }
  }
}
