import { state } from '../../state'
import { setupRangeInput, setupRangeInputWithPreview } from './utils'

// Reusable Tailwind class constants for Settings UI
const groupClass = "mb-8 last:mb-0 settings-group"
const groupTitleClass = "text-xs font-semibold uppercase tracking-[0.5px] text-text-muted mb-4 pb-2 border-b border-border-color"
const gridClass = "grid grid-cols-2 gap-4"
const itemClass = "flex flex-col gap-2 setting-item"
const itemLabelClass = "text-[0.8rem] font-medium text-text-primary"
const controlClass = "flex items-center gap-3"
const selectClass = "w-full px-3 py-2 bg-bg-tertiary border border-border-color rounded-sm text-text-primary text-[0.8rem] cursor-pointer focus:outline-none focus:border-accent-primary"
const rangeClass = "flex-1 h-[6px] accent-accent-primary"
const valueClass = "min-w-[50px] text-[0.75rem] text-text-muted text-right tabular-nums"
const colorInputClass = "w-[36px] h-[28px] p-[2px] border border-border-color rounded-sm bg-bg-tertiary cursor-pointer"
const colorHexClass = "text-[0.75rem] text-text-muted font-mono"
const toggleClass = "relative inline-block w-[44px] h-[24px] toggle"
const toggleInputClass = "opacity-0 w-0 h-0"
const toggleSliderClass = "absolute cursor-pointer inset-0 bg-bg-tertiary border border-border-color rounded-sm transition-[0.2s] toggle-slider before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[2px] before:bottom-[2px] before:bg-white before:rounded-sm before:transition-[0.2s]"

// Margin Preview classes
const marginPreviewClass = "mb-4"
const marginBoxClass = "relative w-full h-[120px] bg-bg-tertiary border-2 border-dashed border-border-color rounded-sm flex items-center justify-center"
const marginLabelBase = "absolute text-[0.65rem] text-accent-primary font-semibold"
const marginCenterClass = "px-8 py-4 bg-bg-secondary border border-border-color rounded-sm text-[0.75rem] text-text-muted"

export function renderMainScreenTab(): string {
  const ds = state.displaySettings
  const transitions = ds.transitions || { type: 'crossfade', duration: 0.5 }

  return `
    <div class="hidden settings-tab" id="tab-main" style="display: none;">
      <div class="${groupClass}">
        <h3 class="${groupTitleClass}">Transitions</h3>
        <div class="${gridClass}">
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Type</label>
            <select id="main-transition-type" class="${selectClass}">
              <option value="none" ${transitions.type === 'none' ? 'selected' : ''}>None</option>
              <option value="crossfade" ${transitions.type === 'crossfade' ? 'selected' : ''}>Crossfade</option>
            </select>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Duration / Speed</label>
            <div class="${controlClass}">
              <input type="range" id="main-transition-duration" min="0.1" max="2.0" step="0.1" value="${transitions.duration}" class="${rangeClass}">
              <span class="${valueClass}" id="main-transition-duration-value">${transitions.duration}s</span>
            </div>
          </div>
        </div>
      </div>

      <div class="${groupClass}">
        <h3 class="${groupTitleClass}">Typography</h3>
        <div class="${gridClass}">
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Font Size</label>
            <div class="${controlClass}">
              <input type="range" id="main-font-size" min="1" max="12" step="0.5" value="${ds.fontSize}" class="${rangeClass}">
              <span class="${valueClass}" id="main-font-size-value">${ds.fontSize}rem</span>
            </div>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Font Family</label>
            <select id="main-font-family" class="${selectClass}">
              <option value="system-ui" ${ds.fontFamily === 'system-ui' ? 'selected' : ''}>System UI</option>
              <option value="Georgia, serif" ${ds.fontFamily === 'Georgia, serif' ? 'selected' : ''}>Georgia</option>
              <option value="Arial, sans-serif" ${ds.fontFamily === 'Arial, sans-serif' ? 'selected' : ''}>Arial</option>
              <option value="'Times New Roman', serif" ${ds.fontFamily === "'Times New Roman', serif" ? 'selected' : ''}>Times New Roman</option>
              <option value="Verdana, sans-serif" ${ds.fontFamily === 'Verdana, sans-serif' ? 'selected' : ''}>Verdana</option>
            </select>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Line Height</label>
            <div class="${controlClass}">
              <input type="range" id="main-line-height" min="1" max="2.5" step="0.1" value="${ds.lineHeight}" class="${rangeClass}">
              <span class="${valueClass}" id="main-line-height-value">${ds.lineHeight}</span>
            </div>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Text Color</label>
            <div class="${controlClass} gap-2">
              <input type="color" id="main-text-color" value="${ds.textColor}" class="${colorInputClass}">
              <span class="${colorHexClass}">${ds.textColor}</span>
            </div>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">All Caps</label>
            <label class="${toggleClass}">
              <input type="checkbox" id="main-all-caps" ${ds.allCaps ? 'checked' : ''} class="${toggleInputClass}">
              <span class="${toggleSliderClass}"></span>
            </label>
          </div>
        </div>
      </div>
      
      <div class="${groupClass}">
        <h3 class="${groupTitleClass}">Text Shadow</h3>
        <div class="${gridClass}">
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Enable</label>
            <label class="${toggleClass}">
              <input type="checkbox" id="main-text-shadow" ${ds.textShadow ? 'checked' : ''} class="${toggleInputClass}">
              <span class="${toggleSliderClass}"></span>
            </label>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Blur</label>
            <div class="${controlClass}">
              <input type="range" id="main-shadow-blur" min="0" max="20" step="1" value="${ds.shadowBlur}" class="${rangeClass}">
              <span class="${valueClass}" id="main-shadow-blur-value">${ds.shadowBlur}px</span>
            </div>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Offset X</label>
            <div class="${controlClass}">
              <input type="range" id="main-shadow-x" min="-10" max="10" step="1" value="${ds.shadowOffsetX}" class="${rangeClass}">
              <span class="${valueClass}" id="main-shadow-x-value">${ds.shadowOffsetX}px</span>
            </div>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Offset Y</label>
            <div class="${controlClass}">
              <input type="range" id="main-shadow-y" min="-10" max="10" step="1" value="${ds.shadowOffsetY}" class="${rangeClass}">
              <span class="${valueClass}" id="main-shadow-y-value">${ds.shadowOffsetY}px</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="${groupClass}">
        <h3 class="${groupTitleClass}">Text Outline</h3>
        <div class="${gridClass}">
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Enable</label>
            <label class="${toggleClass}">
              <input type="checkbox" id="main-text-outline" ${ds.textOutline ? 'checked' : ''} class="${toggleInputClass}">
              <span class="${toggleSliderClass}"></span>
            </label>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Width</label>
            <div class="${controlClass}">
              <input type="range" id="main-outline-width" min="1" max="5" step="0.5" value="${ds.outlineWidth}" class="${rangeClass}">
              <span class="${valueClass}" id="main-outline-width-value">${ds.outlineWidth}px</span>
            </div>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Color</label>
            <div class="${controlClass} gap-2">
              <input type="color" id="main-outline-color" value="${ds.outlineColor}" class="${colorInputClass}">
              <span class="${colorHexClass}">${ds.outlineColor}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="${groupClass}">
        <h3 class="${groupTitleClass}">Margins</h3>
        <div class="${marginPreviewClass}">
          <div class="${marginBoxClass}">
            <div class="${marginLabelBase} top-2 left-1/2 -translate-x-1/2"><span id="margin-top-display">${ds.marginTop}%</span></div>
            <div class="${marginLabelBase} bottom-2 left-1/2 -translate-x-1/2"><span id="margin-bottom-display">${ds.marginBottom}%</span></div>
            <div class="${marginLabelBase} left-2 top-1/2 -translate-y-1/2"><span id="margin-left-display">${ds.marginLeft}%</span></div>
            <div class="${marginLabelBase} right-2 top-1/2 -translate-y-1/2"><span id="margin-right-display">${ds.marginRight}%</span></div>
            <div class="${marginCenterClass}">Content</div>
          </div>
        </div>
        <div class="${gridClass} grid-cols-2">
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Top</label>
            <div class="${controlClass}">
              <input type="range" id="main-margin-top" min="0" max="30" step="1" value="${ds.marginTop}" class="${rangeClass}">
              <span class="${valueClass}" id="main-margin-top-value">${ds.marginTop}%</span>
            </div>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Bottom</label>
            <div class="${controlClass}">
              <input type="range" id="main-margin-bottom" min="0" max="30" step="1" value="${ds.marginBottom}" class="${rangeClass}">
              <span class="${valueClass}" id="main-margin-bottom-value">${ds.marginBottom}%</span>
            </div>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Left</label>
            <div class="${controlClass}">
              <input type="range" id="main-margin-left" min="0" max="20" step="1" value="${ds.marginLeft}" class="${rangeClass}">
              <span class="${valueClass}" id="main-margin-left-value">${ds.marginLeft}%</span>
            </div>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Right</label>
            <div class="${controlClass}">
              <input type="range" id="main-margin-right" min="0" max="20" step="1" value="${ds.marginRight}" class="${rangeClass}">
              <span class="${valueClass}" id="main-margin-right-value">${ds.marginRight}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

export function initMainScreenTabListeners(): void {
  const typeSelect = document.getElementById('main-transition-type') as HTMLSelectElement
  const durationInput = document.getElementById('main-transition-duration') as HTMLInputElement

  if (typeSelect && durationInput) {
    typeSelect.addEventListener('change', () => {
      durationInput.disabled = typeSelect.value === 'none'
    })
    // Initial state
    durationInput.disabled = typeSelect.value === 'none'
  }

  setupRangeInput('main-transition-duration', 'main-transition-duration-value', 's')
  setupRangeInput('main-font-size', 'main-font-size-value', 'rem')
  setupRangeInput('main-line-height', 'main-line-height-value')
  setupRangeInput('main-shadow-blur', 'main-shadow-blur-value', 'px')
  setupRangeInput('main-shadow-x', 'main-shadow-x-value', 'px')
  setupRangeInput('main-shadow-y', 'main-shadow-y-value', 'px')
  setupRangeInput('main-outline-width', 'main-outline-width-value', 'px')
  setupRangeInputWithPreview('main-margin-top', 'main-margin-top-value', 'margin-top-display', '%')
  setupRangeInputWithPreview('main-margin-bottom', 'main-margin-bottom-value', 'margin-bottom-display', '%')
  setupRangeInputWithPreview('main-margin-left', 'main-margin-left-value', 'margin-left-display', '%')
  setupRangeInputWithPreview('main-margin-right', 'main-margin-right-value', 'margin-right-display', '%')
}
