import { state } from '../../state'
import { setupRangeInput } from './utils'

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

export function renderConfidenceMonitorTab(): string {
  const cms = state.confidenceMonitorSettings
  const transitions = cms.transitions || { type: 'crossfade', duration: 0.5 }

  return `
    <div class="hidden settings-tab" id="tab-confidence" style="display: none;">
      <div class="${groupClass}">
        <h3 class="${groupTitleClass}">Transitions</h3>
        <div class="${gridClass}">
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Type</label>
            <select id="cm-transition-type" class="${selectClass}">
              <option value="none" ${transitions.type === 'none' ? 'selected' : ''}>None</option>
              <option value="crossfade" ${transitions.type === 'crossfade' ? 'selected' : ''}>Crossfade (Song/Mode)</option>
            </select>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Duration</label>
            <div class="${controlClass}">
              <input type="range" id="cm-transition-duration" min="0.1" max="2.0" step="0.1" value="${transitions.duration}" class="${rangeClass}">
              <span class="${valueClass}" id="cm-transition-duration-value">${transitions.duration}s</span>
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
              <input type="range" id="cm-font-size" min="1" max="10" step="0.25" value="${cms.fontSize}" class="${rangeClass}">
              <span class="${valueClass}" id="cm-font-size-value">${cms.fontSize}rem</span>
            </div>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Font Family</label>
            <select id="cm-font-family" class="${selectClass}">
              <option value="system-ui" ${cms.fontFamily === 'system-ui' ? 'selected' : ''}>System UI</option>
              <option value="Georgia, serif" ${cms.fontFamily === 'Georgia, serif' ? 'selected' : ''}>Georgia</option>
              <option value="Arial, sans-serif" ${cms.fontFamily === 'Arial, sans-serif' ? 'selected' : ''}>Arial</option>
            </select>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Line Height</label>
            <div class="${controlClass}">
              <input type="range" id="cm-line-height" min="0.8" max="2.5" step="0.1" value="${cms.lineHeight}" class="${rangeClass}">
              <span class="${valueClass}" id="cm-line-height-value">${cms.lineHeight}</span>
            </div>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Part Spacing</label>
            <div class="${controlClass}">
              <input type="range" id="cm-part-gap" min="0" max="5" step="0.5" value="${cms.partGap ?? 2.0}" class="${rangeClass}">
              <span class="${valueClass}" id="cm-part-gap-value">${cms.partGap ?? 2.0}rem</span>
            </div>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Slide Gap</label>
            <div class="${controlClass}">
              <input type="range" id="cm-slide-gap" min="0" max="5" step="0.5" value="${cms.slideGap ?? 0}" class="${rangeClass}">
              <span class="${valueClass}" id="cm-slide-gap-value">${cms.slideGap ?? 0}rem</span>
            </div>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Prev/Next Opacity</label>
            <div class="${controlClass}">
              <input type="range" id="cm-opacity" min="0.1" max="0.8" step="0.05" value="${cms.prevNextOpacity}" class="${rangeClass}">
              <span class="${valueClass}" id="cm-opacity-value">${cms.prevNextOpacity}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="${groupClass}">
        <h3 class="${groupTitleClass}">Clock</h3>
        <div class="${gridClass}">
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Clock Size</label>
            <div class="${controlClass}">
              <input type="range" id="cm-clock-size" min="0.75" max="3" step="0.25" value="${cms.clockSize}" class="${rangeClass}">
              <span class="${valueClass}" id="cm-clock-size-value">${cms.clockSize}rem</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="${groupClass}">
        <h3 class="${groupTitleClass}">Margins</h3>
        <div class="${gridClass}">
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Top Margin</label>
            <div class="${controlClass}">
              <input type="range" id="cm-margin-top" min="0" max="10" step="0.5" value="${cms.marginTop}" class="${rangeClass}">
              <span class="${valueClass}" id="cm-margin-top-value">${cms.marginTop}rem</span>
            </div>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Bottom Margin</label>
            <div class="${controlClass}">
              <input type="range" id="cm-margin-bottom" min="0" max="10" step="0.5" value="${cms.marginBottom}" class="${rangeClass}">
              <span class="${valueClass}" id="cm-margin-bottom-value">${cms.marginBottom}rem</span>
            </div>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Left Margin</label>
            <div class="${controlClass}">
              <input type="range" id="cm-margin-left" min="0" max="10" step="0.5" value="${cms.marginLeft}" class="${rangeClass}">
              <span class="${valueClass}" id="cm-margin-left-value">${cms.marginLeft}rem</span>
            </div>
          </div>
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Right Margin</label>
            <div class="${controlClass}">
              <input type="range" id="cm-margin-right" min="0" max="10" step="0.5" value="${cms.marginRight}" class="${rangeClass}">
              <span class="${valueClass}" id="cm-margin-right-value">${cms.marginRight}rem</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

export function initConfidenceMonitorTabListeners(): void {
  const typeSelect = document.getElementById('cm-transition-type') as HTMLSelectElement
  const durationInput = document.getElementById('cm-transition-duration') as HTMLInputElement

  if (typeSelect && durationInput) {
    typeSelect.addEventListener('change', () => {
      durationInput.disabled = typeSelect.value === 'none'
    })
    // Initial state
    durationInput.disabled = typeSelect.value === 'none'
  }

  setupRangeInput('cm-transition-duration', 'cm-transition-duration-value', 's')
  setupRangeInput('cm-font-size', 'cm-font-size-value', 'rem')
  setupRangeInput('cm-line-height', 'cm-line-height-value')
  setupRangeInput('cm-part-gap', 'cm-part-gap-value', 'rem')
  setupRangeInput('cm-slide-gap', 'cm-slide-gap-value', 'rem')
  setupRangeInput('cm-opacity', 'cm-opacity-value')
  setupRangeInput('cm-clock-size', 'cm-clock-size-value', 'rem')
  setupRangeInput('cm-margin-top', 'cm-margin-top-value', 'rem')
  setupRangeInput('cm-margin-bottom', 'cm-margin-bottom-value', 'rem')
  setupRangeInput('cm-margin-left', 'cm-margin-left-value', 'rem')
  setupRangeInput('cm-margin-right', 'cm-margin-right-value', 'rem')
}
