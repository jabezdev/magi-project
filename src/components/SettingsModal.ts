/**
 * Settings Modal Component
 * 
 * Provides comprehensive settings for main screen and confidence monitor displays.
 * Uses a tabbed interface for better organization.
 */

import { state, saveTheme, saveDisplaySettings, saveConfidenceMonitorSettings, updateState } from '../state'
import { socketService } from '../services/socket'
import { setModalOpen } from '../utils/keyboard'
import type { DisplaySettings, ConfidenceMonitorSettings } from '../types'

let isOpen = false
let onCloseCallback: (() => void) | null = null
let activeTab = 'main'

/**
 * Open the settings modal
 */
export function openSettings(onClose?: () => void): void {
  isOpen = true
  onCloseCallback = onClose || null
  setModalOpen(true)
  render()
  showMarginMarkers()
}

/**
 * Close the settings modal
 */
export function closeSettings(): void {
  isOpen = false
  setModalOpen(false)
  hideMarginMarkers()
  const modal = document.getElementById('settings-modal')
  if (modal) modal.remove()
  if (onCloseCallback) onCloseCallback()
}

/**
 * Check if settings modal is open
 */
export function isSettingsOpen(): boolean {
  return isOpen
}

/**
 * Show margin markers on projection screens via socket
 */
function showMarginMarkers(): void {
  socketService.emit('show-margin-markers', { visible: true })
}

/**
 * Hide margin markers on projection screens
 */
function hideMarginMarkers(): void {
  socketService.emit('show-margin-markers', { visible: false })
}

/**
 * Render the settings modal
 */
function render(): void {
  const existingModal = document.getElementById('settings-modal')
  if (existingModal) existingModal.remove()

  const ds = state.displaySettings
  const cms = state.confidenceMonitorSettings

  const modal = document.createElement('div')
  modal.id = 'settings-modal'
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="settings-modal">
      <div class="settings-sidebar">
        <div class="settings-logo">
          <span class="settings-logo-icon">⚙</span>
          <span>Settings</span>
        </div>
        <nav class="settings-nav">
          <button class="settings-nav-item ${activeTab === 'main' ? 'active' : ''}" data-tab="main">
            <span class="nav-icon">🖥</span>
            <span>Main Screen</span>
          </button>
          <button class="settings-nav-item ${activeTab === 'confidence' ? 'active' : ''}" data-tab="confidence">
            <span class="nav-icon">📺</span>
            <span>Confidence Monitor</span>
          </button>
          <button class="settings-nav-item ${activeTab === 'media' ? 'active' : ''}" data-tab="media">
            <span class="nav-icon">🎬</span>
            <span>Media</span>
          </button>
          <button class="settings-nav-item ${activeTab === 'general' ? 'active' : ''}" data-tab="general">
            <span class="nav-icon">🎨</span>
            <span>General</span>
          </button>
        </nav>
      </div>
      
      <div class="settings-content">
        <div class="settings-header">
          <h2 id="settings-title">${getTabTitle(activeTab)}</h2>
          <button class="modal-close" id="close-settings">×</button>
        </div>
        
        <div class="settings-body">
          <!-- Main Screen Tab -->
          <div class="settings-tab ${activeTab === 'main' ? 'active' : ''}" id="tab-main">
            <div class="settings-group">
              <h3>Typography</h3>
              <div class="settings-grid">
                <div class="setting-item">
                  <label>Font Size</label>
                  <div class="setting-control">
                    <input type="range" id="main-font-size" min="1" max="8" step="0.5" value="${ds.fontSize}">
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
          
          <!-- Confidence Monitor Tab -->
          <div class="settings-tab ${activeTab === 'confidence' ? 'active' : ''}" id="tab-confidence">
            <div class="settings-group">
              <h3>Typography</h3>
              <div class="settings-grid">
                <div class="setting-item">
                  <label>Font Size</label>
                  <div class="setting-control">
                    <input type="range" id="cm-font-size" min="1" max="5" step="0.25" value="${cms.fontSize}">
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
          </div>
          
          <!-- Media Tab -->
          <div class="settings-tab ${activeTab === 'media' ? 'active' : ''}" id="tab-media">
            <div class="settings-group">
              <h3>Logo Media</h3>
              <p class="settings-desc">Select a video or image to display when Logo mode is active.</p>
              <div class="media-grid" id="logo-video-grid">
                ${state.availableVideos.map(video => `
                  <button class="media-card ${state.logoMedia === video.path ? 'selected' : ''}" data-video-path="${video.path}" title="${video.name}">
                    <div class="media-thumb">
                      <video src="${video.path}" muted preload="metadata"></video>
                    </div>
                    <span class="media-name">${video.name.replace(/\.[^.]+$/, '')}</span>
                  </button>
                `).join('')}
                ${state.availableVideos.length === 0 ? '<div class="empty-msg">No videos in public/videos folder</div>' : ''}
              </div>
              <input type="hidden" id="logo-url" value="${state.logoMedia}">
            </div>
          </div>
          
          <!-- General Tab -->
          <div class="settings-tab ${activeTab === 'general' ? 'active' : ''}" id="tab-general">
            <div class="settings-group">
              <h3>Appearance</h3>
              <div class="settings-grid">
                <div class="setting-item">
                  <label>Control Panel Theme</label>
                  <select id="theme-select" class="setting-select">
                    <option value="dark" ${state.theme === 'dark' ? 'selected' : ''}>Dark</option>
                    <option value="light" ${state.theme === 'light' ? 'selected' : ''}>Light</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="settings-footer">
          <button id="cancel-settings" class="btn-ghost">Cancel</button>
          <button id="apply-settings" class="btn-outline">Apply</button>
          <button id="save-settings" class="btn-primary">Save & Close</button>
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  attachListeners(modal)
}

function getTabTitle(tab: string): string {
  switch (tab) {
    case 'main': return 'Main Screen Display'
    case 'confidence': return 'Confidence Monitor'
    case 'media': return 'Media Library'
    case 'general': return 'General Settings'
    default: return 'Settings'
  }
}

/**
 * Attach event listeners to the modal
 */
function attachListeners(modal: HTMLElement): void {
  document.getElementById('close-settings')?.addEventListener('click', closeSettings)
  document.getElementById('cancel-settings')?.addEventListener('click', closeSettings)
  
  // Tab navigation
  document.querySelectorAll('.settings-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = (btn as HTMLElement).dataset.tab || 'main'
      activeTab = tab
      
      // Update nav
      document.querySelectorAll('.settings-nav-item').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      
      // Update tabs
      document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'))
      document.getElementById(`tab-${tab}`)?.classList.add('active')
      
      // Update title
      const title = document.getElementById('settings-title')
      if (title) title.textContent = getTabTitle(tab)
    })
  })
  
  // Main screen range input live updates
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

  // Confidence monitor range input live updates
  setupRangeInput('cm-font-size', 'cm-font-size-value', 'rem')
  setupRangeInput('cm-line-height', 'cm-line-height-value')
  setupRangeInput('cm-opacity', 'cm-opacity-value')
  
  // Logo video selection
  document.getElementById('logo-video-grid')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.media-card') as HTMLButtonElement
    if (btn) {
      const videoPath = btn.dataset.videoPath
      if (videoPath) {
        (document.getElementById('logo-url') as HTMLInputElement).value = videoPath
        // Update selection UI
        document.querySelectorAll('#logo-video-grid .media-card').forEach(el => el.classList.remove('selected'))
        btn.classList.add('selected')
      }
    }
  })

  // Apply button (save without closing)
  document.getElementById('apply-settings')?.addEventListener('click', () => {
    applySettings()
  })
  
  // Save button (save and close)
  document.getElementById('save-settings')?.addEventListener('click', () => {
    applySettings()
    closeSettings()
  })
  
  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSettings()
  })
}

/**
 * Helper to setup range input with value display
 */
function setupRangeInput(inputId: string, valueId: string, suffix: string = ''): void {
  const input = document.getElementById(inputId) as HTMLInputElement
  const valueEl = document.getElementById(valueId)
  if (input && valueEl) {
    input.addEventListener('input', () => {
      valueEl.textContent = input.value + suffix
    })
  }
}

/**
 * Helper to setup range input with value display and margin preview
 */
function setupRangeInputWithPreview(inputId: string, valueId: string, previewId: string, suffix: string = ''): void {
  const input = document.getElementById(inputId) as HTMLInputElement
  const valueEl = document.getElementById(valueId)
  const previewEl = document.getElementById(previewId)
  if (input && valueEl) {
    input.addEventListener('input', () => {
      valueEl.textContent = input.value + suffix
      if (previewEl) previewEl.textContent = input.value + suffix
    })
  }
}

/**
 * Collect current form values and apply settings
 */
function applySettings(): void {
  // Theme
  const theme = (document.getElementById('theme-select') as HTMLSelectElement).value as 'light' | 'dark'
  
  // Main screen settings
  const displaySettings: DisplaySettings = {
    fontSize: parseFloat((document.getElementById('main-font-size') as HTMLInputElement).value),
    fontFamily: (document.getElementById('main-font-family') as HTMLSelectElement).value,
    lineHeight: parseFloat((document.getElementById('main-line-height') as HTMLInputElement).value),
    textColor: (document.getElementById('main-text-color') as HTMLInputElement).value,
    allCaps: (document.getElementById('main-all-caps') as HTMLInputElement).checked,
    textShadow: (document.getElementById('main-text-shadow') as HTMLInputElement).checked,
    shadowBlur: parseInt((document.getElementById('main-shadow-blur') as HTMLInputElement).value),
    shadowOffsetX: parseInt((document.getElementById('main-shadow-x') as HTMLInputElement).value),
    shadowOffsetY: parseInt((document.getElementById('main-shadow-y') as HTMLInputElement).value),
    textOutline: (document.getElementById('main-text-outline') as HTMLInputElement).checked,
    outlineWidth: parseFloat((document.getElementById('main-outline-width') as HTMLInputElement).value),
    outlineColor: (document.getElementById('main-outline-color') as HTMLInputElement).value,
    marginTop: parseInt((document.getElementById('main-margin-top') as HTMLInputElement).value),
    marginBottom: parseInt((document.getElementById('main-margin-bottom') as HTMLInputElement).value),
    marginLeft: parseInt((document.getElementById('main-margin-left') as HTMLInputElement).value),
    marginRight: parseInt((document.getElementById('main-margin-right') as HTMLInputElement).value)
  }
  
  // Confidence monitor settings
  const confidenceMonitorSettings: ConfidenceMonitorSettings = {
    fontSize: parseFloat((document.getElementById('cm-font-size') as HTMLInputElement).value),
    fontFamily: (document.getElementById('cm-font-family') as HTMLSelectElement).value,
    lineHeight: parseFloat((document.getElementById('cm-line-height') as HTMLInputElement).value),
    prevNextOpacity: parseFloat((document.getElementById('cm-opacity') as HTMLInputElement).value)
  }
  
  // Logo
  const logoMedia = (document.getElementById('logo-url') as HTMLInputElement).value

  saveTheme(theme)
  saveDisplaySettings(displaySettings)
  saveConfidenceMonitorSettings(confidenceMonitorSettings)
  
  updateState({ logoMedia })
  socketService.updateLogo(logoMedia)
}
