import { state } from '../../state'
import { setupRangeInput, setupRangeInputWithPreview } from './utils'

export function renderMainScreenTab(): string {
    const ds = state.displaySettings

    return `
    <div class="settings-tab active" id="tab-main">
      <div class="settings-group">
        <h3>Typography</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label>Font Size</label>
            <div class="setting-control">
              <input type="range" id="main-font-size" min="1" max="12" step="0.5" value="${ds.fontSize}">
              <span class="setting-value" id="main-font-size-value">${ds.fontSize}rem</span>
            </div>
          </div>
          <div class="setting-item">
            <label>Font Family</label>
            <select id="main-font-family" class="setting-select">
              <option value="system-ui" ${ds.fontFamily === 'system-ui' ? 'selected' : ''}>System UI</option>
              <option value="Georgia, serif" ${ds.fontFamily === 'Georgia, serif' ? 'selected' : ''}>Georgia</option>
              <option value="Arial, sans-serif" ${ds.fontFamily === 'Arial, sans-serif' ? 'selected' : ''}>Arial</option>
              <option value="'Times New Roman', serif" ${ds.fontFamily === "'Times New Roman', serif" ? 'selected' : ''}>Times New Roman</option>
              <option value="Verdana, sans-serif" ${ds.fontFamily === 'Verdana, sans-serif' ? 'selected' : ''}>Verdana</option>
            </select>
          </div>
          <div class="setting-item">
            <label>Line Height</label>
            <div class="setting-control">
              <input type="range" id="main-line-height" min="1" max="2.5" step="0.1" value="${ds.lineHeight}">
              <span class="setting-value" id="main-line-height-value">${ds.lineHeight}</span>
            </div>
          </div>
          <div class="setting-item">
            <label>Text Color</label>
            <div class="setting-control color-control">
              <input type="color" id="main-text-color" value="${ds.textColor}">
              <span class="color-hex">${ds.textColor}</span>
            </div>
          </div>
          <div class="setting-item">
            <label>All Caps</label>
            <label class="toggle">
              <input type="checkbox" id="main-all-caps" ${ds.allCaps ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
      
      <div class="settings-group">
        <h3>Text Shadow</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label>Enable</label>
            <label class="toggle">
              <input type="checkbox" id="main-text-shadow" ${ds.textShadow ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <label>Blur</label>
            <div class="setting-control">
              <input type="range" id="main-shadow-blur" min="0" max="20" step="1" value="${ds.shadowBlur}">
              <span class="setting-value" id="main-shadow-blur-value">${ds.shadowBlur}px</span>
            </div>
          </div>
          <div class="setting-item">
            <label>Offset X</label>
            <div class="setting-control">
              <input type="range" id="main-shadow-x" min="-10" max="10" step="1" value="${ds.shadowOffsetX}">
              <span class="setting-value" id="main-shadow-x-value">${ds.shadowOffsetX}px</span>
            </div>
          </div>
          <div class="setting-item">
            <label>Offset Y</label>
            <div class="setting-control">
              <input type="range" id="main-shadow-y" min="-10" max="10" step="1" value="${ds.shadowOffsetY}">
              <span class="setting-value" id="main-shadow-y-value">${ds.shadowOffsetY}px</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="settings-group">
        <h3>Text Outline</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label>Enable</label>
            <label class="toggle">
              <input type="checkbox" id="main-text-outline" ${ds.textOutline ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <label>Width</label>
            <div class="setting-control">
              <input type="range" id="main-outline-width" min="1" max="5" step="0.5" value="${ds.outlineWidth}">
              <span class="setting-value" id="main-outline-width-value">${ds.outlineWidth}px</span>
            </div>
          </div>
          <div class="setting-item">
            <label>Color</label>
            <div class="setting-control color-control">
              <input type="color" id="main-outline-color" value="${ds.outlineColor}">
              <span class="color-hex">${ds.outlineColor}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="settings-group">
        <h3>Margins</h3>
        <div class="margin-preview">
          <div class="margin-box">
            <div class="margin-label top"><span id="margin-top-display">${ds.marginTop}%</span></div>
            <div class="margin-label bottom"><span id="margin-bottom-display">${ds.marginBottom}%</span></div>
            <div class="margin-label left"><span id="margin-left-display">${ds.marginLeft}%</span></div>
            <div class="margin-label right"><span id="margin-right-display">${ds.marginRight}%</span></div>
            <div class="margin-center">Content</div>
          </div>
        </div>
        <div class="settings-grid margin-grid">
          <div class="setting-item">
            <label>Top</label>
            <div class="setting-control">
              <input type="range" id="main-margin-top" min="0" max="30" step="1" value="${ds.marginTop}">
              <span class="setting-value" id="main-margin-top-value">${ds.marginTop}%</span>
            </div>
          </div>
          <div class="setting-item">
            <label>Bottom</label>
            <div class="setting-control">
              <input type="range" id="main-margin-bottom" min="0" max="30" step="1" value="${ds.marginBottom}">
              <span class="setting-value" id="main-margin-bottom-value">${ds.marginBottom}%</span>
            </div>
          </div>
          <div class="setting-item">
            <label>Left</label>
            <div class="setting-control">
              <input type="range" id="main-margin-left" min="0" max="20" step="1" value="${ds.marginLeft}">
              <span class="setting-value" id="main-margin-left-value">${ds.marginLeft}%</span>
            </div>
          </div>
          <div class="setting-item">
            <label>Right</label>
            <div class="setting-control">
              <input type="range" id="main-margin-right" min="0" max="20" step="1" value="${ds.marginRight}">
              <span class="setting-value" id="main-margin-right-value">${ds.marginRight}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

export function initMainScreenTabListeners(): void {
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
