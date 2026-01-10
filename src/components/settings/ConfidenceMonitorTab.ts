import { state } from '../../state'
import { setupRangeInput } from './utils'

export function renderConfidenceMonitorTab(): string {
    const cms = state.confidenceMonitorSettings

    return `
    <div class="settings-tab" id="tab-confidence">
      <div class="settings-group">
        <h3>Typography</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label>Font Size</label>
            <div class="setting-control">
              <input type="range" id="cm-font-size" min="1" max="10" step="0.25" value="${cms.fontSize}">
              <span class="setting-value" id="cm-font-size-value">${cms.fontSize}rem</span>
            </div>
          </div>
          <div class="setting-item">
            <label>Font Family</label>
            <select id="cm-font-family" class="setting-select">
              <option value="system-ui" ${cms.fontFamily === 'system-ui' ? 'selected' : ''}>System UI</option>
              <option value="Georgia, serif" ${cms.fontFamily === 'Georgia, serif' ? 'selected' : ''}>Georgia</option>
              <option value="Arial, sans-serif" ${cms.fontFamily === 'Arial, sans-serif' ? 'selected' : ''}>Arial</option>
            </select>
          </div>
          <div class="setting-item">
            <label>Line Height</label>
            <div class="setting-control">
              <input type="range" id="cm-line-height" min="1" max="2.5" step="0.1" value="${cms.lineHeight}">
              <span class="setting-value" id="cm-line-height-value">${cms.lineHeight}</span>
            </div>
          </div>
          <div class="setting-item">
            <label>Prev/Next Opacity</label>
            <div class="setting-control">
              <input type="range" id="cm-opacity" min="0.1" max="0.8" step="0.05" value="${cms.prevNextOpacity}">
              <span class="setting-value" id="cm-opacity-value">${cms.prevNextOpacity}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="settings-group">
        <h3>Clock</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label>Clock Size</label>
            <div class="setting-control">
              <input type="range" id="cm-clock-size" min="0.75" max="3" step="0.25" value="${cms.clockSize}">
              <span class="setting-value" id="cm-clock-size-value">${cms.clockSize}rem</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="settings-group">
        <h3>Margins</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label>Top Margin</label>
            <div class="setting-control">
              <input type="range" id="cm-margin-top" min="0" max="10" step="0.5" value="${cms.marginTop}">
              <span class="setting-value" id="cm-margin-top-value">${cms.marginTop}rem</span>
            </div>
          </div>
          <div class="setting-item">
            <label>Bottom Margin</label>
            <div class="setting-control">
              <input type="range" id="cm-margin-bottom" min="0" max="10" step="0.5" value="${cms.marginBottom}">
              <span class="setting-value" id="cm-margin-bottom-value">${cms.marginBottom}rem</span>
            </div>
          </div>
          <div class="setting-item">
            <label>Left Margin</label>
            <div class="setting-control">
              <input type="range" id="cm-margin-left" min="0" max="10" step="0.5" value="${cms.marginLeft}">
              <span class="setting-value" id="cm-margin-left-value">${cms.marginLeft}rem</span>
            </div>
          </div>
          <div class="setting-item">
            <label>Right Margin</label>
            <div class="setting-control">
              <input type="range" id="cm-margin-right" min="0" max="10" step="0.5" value="${cms.marginRight}">
              <span class="setting-value" id="cm-margin-right-value">${cms.marginRight}rem</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

export function initConfidenceMonitorTabListeners(): void {
    setupRangeInput('cm-font-size', 'cm-font-size-value', 'rem')
    setupRangeInput('cm-line-height', 'cm-line-height-value')
    setupRangeInput('cm-opacity', 'cm-opacity-value')
    setupRangeInput('cm-clock-size', 'cm-clock-size-value', 'rem')
    setupRangeInput('cm-margin-top', 'cm-margin-top-value', 'rem')
    setupRangeInput('cm-margin-bottom', 'cm-margin-bottom-value', 'rem')
    setupRangeInput('cm-margin-left', 'cm-margin-left-value', 'rem')
    setupRangeInput('cm-margin-right', 'cm-margin-right-value', 'rem')
}
