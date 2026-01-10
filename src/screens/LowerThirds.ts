/**
 * Lower Thirds Screen
 * 
 * A screen for displaying lower third graphics with chroma key background.
 * Syncs with live lyrics from the control panel via Socket.io.
 * Settings are stored locally in the browser's localStorage.
 */

import type { LowerThirdsSettings, Song, SlidePosition } from '../types'
import { DEFAULT_LOWER_THIRDS_SETTINGS, STORAGE_KEYS } from '../constants/defaults'
import { socketService } from '../services/socket'
import { getSlideText } from '../utils/slides'

// Local state for lower thirds
let settings: LowerThirdsSettings = loadSettings()
let isSettingsPanelOpen = false

// Live lyrics state (synced from server)
let liveSong: Song | null = null
let liveVariation: number = 0
let livePosition: SlidePosition = { partIndex: 0, slideIndex: 0 }

/**
 * Load settings from localStorage
 */
function loadSettings(): LowerThirdsSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LOWER_THIRDS_SETTINGS)
    if (stored) {
      return { ...DEFAULT_LOWER_THIRDS_SETTINGS, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.warn('Failed to load lower thirds settings:', e)
  }
  return { ...DEFAULT_LOWER_THIRDS_SETTINGS }
}

/**
 * Save settings to localStorage
 */
function saveSettings(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOWER_THIRDS_SETTINGS, JSON.stringify(settings))
  } catch (e) {
    console.warn('Failed to save lower thirds settings:', e)
  }
}

/**
 * Update a setting and re-render
 */
function updateSetting<K extends keyof LowerThirdsSettings>(key: K, value: LowerThirdsSettings[K]): void {
  settings[key] = value
  saveSettings()
  updateLowerThirdDisplay()
}

/**
 * Reset settings to defaults
 */
function resetSettings(): void {
  settings = { ...DEFAULT_LOWER_THIRDS_SETTINGS }
  saveSettings()
  renderLowerThirdsScreen()
}

/**
 * Toggle visibility of the lower third
 */
function toggleVisibility(): void {
  settings.visible = !settings.visible
  saveSettings()
  updateLowerThirdDisplay()
  updateVisibilityButton()
}

/**
 * Toggle settings panel
 */
function toggleSettingsPanel(): void {
  isSettingsPanelOpen = !isSettingsPanelOpen
  const panel = document.querySelector('.lower-thirds-settings-panel')
  if (panel) {
    panel.classList.toggle('open', isSettingsPanelOpen)
  }
  const toggleBtn = document.querySelector('.settings-toggle-btn')
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', isSettingsPanelOpen)
  }
}

/**
 * Get the current lyrics text from live state
 */
function getCurrentLyricsText(): string {
  if (!liveSong) return ''
  return getSlideText(liveSong, liveVariation, livePosition) || ''
}

/**
 * Build the lower third element HTML
 */
function buildLowerThirdHTML(): string {
  const {
    backgroundColor,
    backgroundOpacity,
    fontFamily,
    fontSize,
    fontWeight,
    textColor,
    textAlign,
    allCaps,
    position,
    marginBottom,
    marginTop,
    marginLeft,
    marginRight,
    paddingVertical,
    paddingHorizontal,
    visible,
    animationDuration
  } = settings

  const lyricsText = getCurrentLyricsText()

  const positionStyle = position === 'bottom' 
    ? `bottom: ${marginBottom}%; top: auto;` 
    : `top: ${marginTop}%; bottom: auto;`

  const containerStyle = `
    ${positionStyle}
    left: ${marginLeft}%;
    right: ${marginRight}%;
    padding: ${paddingVertical}px ${paddingHorizontal}px;
    background-color: ${backgroundColor};
    opacity: ${visible && lyricsText ? backgroundOpacity : 0};
    transform: translateX(${visible && lyricsText ? '0' : '-100%'});
    transition: opacity ${animationDuration}s ease, transform ${animationDuration}s ease;
    text-align: ${textAlign};
  `

  const textStyle = `
    font-family: ${fontFamily}, sans-serif;
    font-size: ${fontSize}px;
    font-weight: ${fontWeight};
    color: ${textColor};
    line-height: 1.3;
    text-transform: ${allCaps ? 'uppercase' : 'none'};
  `

  // Format lyrics text - replace newlines with <br>
  const formattedText = lyricsText
    .split('\n')
    .map(line => `<span class="lyric-line">${escapeHtml(line)}</span>`)
    .join('<br>')

  return `
    <div class="lower-third-container" style="${containerStyle}">
      <div class="lower-third-text" style="${textStyle}">${formattedText}</div>
    </div>
  `
}

/**
 * Build the settings panel HTML
 */
function buildSettingsPanelHTML(): string {
  const {
    backgroundColor,
    backgroundOpacity,
    fontFamily,
    fontSize,
    fontWeight,
    textColor,
    textAlign,
    allCaps,
    position,
    marginBottom,
    marginTop,
    marginLeft,
    marginRight,
    paddingVertical,
    paddingHorizontal,
    animationDuration
  } = settings

  return `
    <div class="lower-thirds-settings-panel ${isSettingsPanelOpen ? 'open' : ''}">
      <div class="settings-panel-header">
        <h2>Lower Thirds Settings</h2>
        <button class="settings-close-btn" title="Close Settings">×</button>
      </div>
      
      <div class="settings-panel-content">
        <!-- Info Section -->
        <section class="settings-section">
          <div class="settings-info">
            <p>📡 Text syncs automatically with live lyrics from the Control Panel.</p>
          </div>
        </section>

        <!-- Typography Section -->
        <section class="settings-section">
          <h3>Typography</h3>
          <div class="setting-row">
            <label for="lt-font-family">Font Family</label>
            <select id="lt-font-family">
              <option value="Arial" ${fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
              <option value="Helvetica" ${fontFamily === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
              <option value="Georgia" ${fontFamily === 'Georgia' ? 'selected' : ''}>Georgia</option>
              <option value="Times New Roman" ${fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
              <option value="Verdana" ${fontFamily === 'Verdana' ? 'selected' : ''}>Verdana</option>
              <option value="Roboto" ${fontFamily === 'Roboto' ? 'selected' : ''}>Roboto</option>
              <option value="Open Sans" ${fontFamily === 'Open Sans' ? 'selected' : ''}>Open Sans</option>
              <option value="Montserrat" ${fontFamily === 'Montserrat' ? 'selected' : ''}>Montserrat</option>
              <option value="system-ui" ${fontFamily === 'system-ui' ? 'selected' : ''}>System UI</option>
            </select>
          </div>
          <div class="setting-row">
            <label for="lt-font-size">Font Size</label>
            <div class="range-with-value">
              <input type="range" id="lt-font-size" min="16" max="120" step="1" value="${fontSize}" />
              <span class="range-value">${fontSize}px</span>
            </div>
          </div>
          <div class="setting-row">
            <label for="lt-font-weight">Font Weight</label>
            <select id="lt-font-weight">
              <option value="normal" ${fontWeight === 'normal' ? 'selected' : ''}>Normal</option>
              <option value="bold" ${fontWeight === 'bold' ? 'selected' : ''}>Bold</option>
              <option value="lighter" ${fontWeight === 'lighter' ? 'selected' : ''}>Lighter</option>
              <option value="100" ${fontWeight === '100' ? 'selected' : ''}>100</option>
              <option value="200" ${fontWeight === '200' ? 'selected' : ''}>200</option>
              <option value="300" ${fontWeight === '300' ? 'selected' : ''}>300</option>
              <option value="400" ${fontWeight === '400' ? 'selected' : ''}>400</option>
              <option value="500" ${fontWeight === '500' ? 'selected' : ''}>500</option>
              <option value="600" ${fontWeight === '600' ? 'selected' : ''}>600</option>
              <option value="700" ${fontWeight === '700' ? 'selected' : ''}>700</option>
              <option value="800" ${fontWeight === '800' ? 'selected' : ''}>800</option>
              <option value="900" ${fontWeight === '900' ? 'selected' : ''}>900</option>
            </select>
          </div>
          <div class="setting-row">
            <label for="lt-text-color">Text Color</label>
            <input type="color" id="lt-text-color" value="${textColor}" />
          </div>
          <div class="setting-row">
            <label for="lt-text-align">Text Alignment</label>
            <select id="lt-text-align">
              <option value="left" ${textAlign === 'left' ? 'selected' : ''}>Left</option>
              <option value="center" ${textAlign === 'center' ? 'selected' : ''}>Center</option>
              <option value="right" ${textAlign === 'right' ? 'selected' : ''}>Right</option>
            </select>
          </div>
          <div class="setting-row setting-row-inline">
            <label for="lt-all-caps">All Caps</label>
            <input type="checkbox" id="lt-all-caps" ${allCaps ? 'checked' : ''} />
          </div>
        </section>

        <!-- Background Section -->
        <section class="settings-section">
          <h3>Background</h3>
          <div class="setting-row">
            <label for="lt-bg-color">Background Color</label>
            <div class="color-with-presets">
              <input type="color" id="lt-bg-color" value="${backgroundColor}" />
              <button class="preset-btn" data-color="#00FF00" title="Chroma Green">🟢</button>
              <button class="preset-btn" data-color="#0000FF" title="Chroma Blue">🔵</button>
              <button class="preset-btn" data-color="#000000" title="Black">⚫</button>
              <button class="preset-btn" data-color="#FFFFFF" title="White">⚪</button>
            </div>
          </div>
          <div class="setting-row">
            <label for="lt-bg-opacity">Background Opacity</label>
            <div class="range-with-value">
              <input type="range" id="lt-bg-opacity" min="0" max="1" step="0.05" value="${backgroundOpacity}" />
              <span class="range-value">${Math.round(backgroundOpacity * 100)}%</span>
            </div>
          </div>
        </section>

        <!-- Position & Sizing Section -->
        <section class="settings-section">
          <h3>Position & Sizing</h3>
          <div class="setting-row">
            <label for="lt-position">Position</label>
            <select id="lt-position">
              <option value="bottom" ${position === 'bottom' ? 'selected' : ''}>Bottom</option>
              <option value="top" ${position === 'top' ? 'selected' : ''}>Top</option>
            </select>
          </div>
          <div class="setting-row">
            <label for="lt-margin-top">Margin Top (%)</label>
            <div class="range-with-value">
              <input type="range" id="lt-margin-top" min="0" max="50" step="1" value="${marginTop}" />
              <span class="range-value">${marginTop}%</span>
            </div>
          </div>
          <div class="setting-row">
            <label for="lt-margin-bottom">Margin Bottom (%)</label>
            <div class="range-with-value">
              <input type="range" id="lt-margin-bottom" min="0" max="50" step="1" value="${marginBottom}" />
              <span class="range-value">${marginBottom}%</span>
            </div>
          </div>
          <div class="setting-row">
            <label for="lt-margin-left">Margin Left (%)</label>
            <div class="range-with-value">
              <input type="range" id="lt-margin-left" min="0" max="50" step="1" value="${marginLeft}" />
              <span class="range-value">${marginLeft}%</span>
            </div>
          </div>
          <div class="setting-row">
            <label for="lt-margin-right">Margin Right (%)</label>
            <div class="range-with-value">
              <input type="range" id="lt-margin-right" min="0" max="50" step="1" value="${marginRight}" />
              <span class="range-value">${marginRight}%</span>
            </div>
          </div>
          <div class="setting-row">
            <label for="lt-padding-v">Padding Vertical (px)</label>
            <div class="range-with-value">
              <input type="range" id="lt-padding-v" min="0" max="100" step="1" value="${paddingVertical}" />
              <span class="range-value">${paddingVertical}px</span>
            </div>
          </div>
          <div class="setting-row">
            <label for="lt-padding-h">Padding Horizontal (px)</label>
            <div class="range-with-value">
              <input type="range" id="lt-padding-h" min="0" max="200" step="1" value="${paddingHorizontal}" />
              <span class="range-value">${paddingHorizontal}px</span>
            </div>
          </div>
        </section>

        <!-- Animation Section -->
        <section class="settings-section">
          <h3>Animation</h3>
          <div class="setting-row">
            <label for="lt-animation-duration">Animation Duration (s)</label>
            <div class="range-with-value">
              <input type="range" id="lt-animation-duration" min="0" max="2" step="0.1" value="${animationDuration}" />
              <span class="range-value">${animationDuration}s</span>
            </div>
          </div>
        </section>

        <!-- Actions Section -->
        <section class="settings-section settings-actions">
          <button class="btn btn-secondary reset-btn" id="lt-reset">Reset to Defaults</button>
        </section>
      </div>
    </div>
  `
}

/**
 * Build the main screen HTML
 */
function buildScreenHTML(): string {
  return `
    <div class="lower-thirds-screen">
      <!-- Chroma Key Background -->
      <div class="lower-thirds-background" style="background-color: ${settings.backgroundColor}"></div>
      
      <!-- Lower Third Element -->
      ${buildLowerThirdHTML()}
      
      <!-- Controls Overlay (hidden in fullscreen/production) -->
      <div class="lower-thirds-controls">
        <button class="visibility-toggle-btn ${settings.visible ? 'visible' : 'hidden'}" title="Toggle Lower Third">
          ${settings.visible ? '👁️ Hide' : '👁️‍🗨️ Show'}
        </button>
        <button class="settings-toggle-btn ${isSettingsPanelOpen ? 'active' : ''}" title="Open Settings">
          ⚙️ Settings
        </button>
        <button class="fullscreen-btn" title="Toggle Fullscreen">
          ⛶ Fullscreen
        </button>
      </div>

      <!-- Settings Panel -->
      ${buildSettingsPanelHTML()}
    </div>
  `
}

/**
 * Escape HTML for safe rendering
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Update just the lower third display (efficient update)
 */
function updateLowerThirdDisplay(): void {
  const container = document.querySelector('.lower-third-container') as HTMLElement
  if (!container) return

  const {
    backgroundColor,
    backgroundOpacity,
    fontFamily,
    fontSize,
    fontWeight,
    textColor,
    textAlign,
    allCaps,
    position,
    marginBottom,
    marginTop,
    marginLeft,
    marginRight,
    paddingVertical,
    paddingHorizontal,
    visible,
    animationDuration
  } = settings

  const lyricsText = getCurrentLyricsText()

  // Update container styles
  const positionStyle = position === 'bottom'
    ? `bottom: ${marginBottom}%; top: auto;`
    : `top: ${marginTop}%; bottom: auto;`

  container.style.cssText = `
    ${positionStyle}
    left: ${marginLeft}%;
    right: ${marginRight}%;
    padding: ${paddingVertical}px ${paddingHorizontal}px;
    background-color: ${backgroundColor};
    opacity: ${visible && lyricsText ? backgroundOpacity : 0};
    transform: translateX(${visible && lyricsText ? '0' : '-100%'});
    transition: opacity ${animationDuration}s ease, transform ${animationDuration}s ease;
    text-align: ${textAlign};
  `

  // Update text
  const textEl = container.querySelector('.lower-third-text') as HTMLElement
  if (textEl) {
    // Format lyrics text - replace newlines with <br>
    const formattedText = lyricsText
      .split('\n')
      .map(line => `<span class="lyric-line">${escapeHtml(line)}</span>`)
      .join('<br>')
    
    textEl.innerHTML = formattedText
    textEl.style.cssText = `
      font-family: ${fontFamily}, sans-serif;
      font-size: ${fontSize}px;
      font-weight: ${fontWeight};
      color: ${textColor};
      line-height: 1.3;
      text-transform: ${allCaps ? 'uppercase' : 'none'};
    `
  }

  // Update background
  const bg = document.querySelector('.lower-thirds-background') as HTMLElement
  if (bg) {
    bg.style.backgroundColor = backgroundColor
  }
}

/**
 * Update visibility button state
 */
function updateVisibilityButton(): void {
  const btn = document.querySelector('.visibility-toggle-btn')
  if (btn) {
    btn.className = `visibility-toggle-btn ${settings.visible ? 'visible' : 'hidden'}`
    btn.innerHTML = settings.visible ? '👁️ Hide' : '👁️‍🗨️ Show'
  }
}

/**
 * Setup socket listeners for live lyrics updates
 */
function setupSocketListeners(): void {
  socketService.onStateUpdate((state) => {
    let needsUpdate = false

    if (state.liveSong !== undefined) {
      liveSong = state.liveSong
      needsUpdate = true
    }
    if (state.liveVariation !== undefined) {
      liveVariation = state.liveVariation
      needsUpdate = true
    }
    if (state.livePosition !== undefined) {
      livePosition = state.livePosition
      needsUpdate = true
    }

    if (needsUpdate) {
      updateLowerThirdDisplay()
    }
  })
}

/**
 * Setup event listeners
 */
function setupEventListeners(): void {
  // Settings toggle
  document.querySelector('.settings-toggle-btn')?.addEventListener('click', toggleSettingsPanel)
  document.querySelector('.settings-close-btn')?.addEventListener('click', toggleSettingsPanel)

  // Visibility toggle
  document.querySelector('.visibility-toggle-btn')?.addEventListener('click', toggleVisibility)

  // Fullscreen toggle
  document.querySelector('.fullscreen-btn')?.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  })

  // Reset button
  document.getElementById('lt-reset')?.addEventListener('click', resetSettings)

  // Select inputs
  document.getElementById('lt-font-family')?.addEventListener('change', (e) => {
    updateSetting('fontFamily', (e.target as HTMLSelectElement).value)
  })
  document.getElementById('lt-font-weight')?.addEventListener('change', (e) => {
    updateSetting('fontWeight', (e.target as HTMLSelectElement).value)
  })
  document.getElementById('lt-text-align')?.addEventListener('change', (e) => {
    updateSetting('textAlign', (e.target as HTMLSelectElement).value as 'left' | 'center' | 'right')
  })
  document.getElementById('lt-all-caps')?.addEventListener('change', (e) => {
    updateSetting('allCaps', (e.target as HTMLInputElement).checked)
  })
  document.getElementById('lt-position')?.addEventListener('change', (e) => {
    updateSetting('position', (e.target as HTMLSelectElement).value as 'bottom' | 'top')
  })

  // Color inputs
  document.getElementById('lt-text-color')?.addEventListener('input', (e) => {
    updateSetting('textColor', (e.target as HTMLInputElement).value)
  })
  document.getElementById('lt-bg-color')?.addEventListener('input', (e) => {
    updateSetting('backgroundColor', (e.target as HTMLInputElement).value)
  })

  // Color presets
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = (btn as HTMLElement).dataset.color
      if (color) {
        updateSetting('backgroundColor', color)
        const colorInput = document.getElementById('lt-bg-color') as HTMLInputElement
        if (colorInput) colorInput.value = color
      }
    })
  })

  // Range inputs with live updates
  setupRangeInput('lt-font-size', 'fontSize', 'px')
  setupRangeInput('lt-bg-opacity', 'backgroundOpacity', '%', (v) => Math.round(v * 100))
  setupRangeInput('lt-margin-top', 'marginTop', '%')
  setupRangeInput('lt-margin-bottom', 'marginBottom', '%')
  setupRangeInput('lt-margin-left', 'marginLeft', '%')
  setupRangeInput('lt-margin-right', 'marginRight', '%')
  setupRangeInput('lt-padding-v', 'paddingVertical', 'px')
  setupRangeInput('lt-padding-h', 'paddingHorizontal', 'px')
  setupRangeInput('lt-animation-duration', 'animationDuration', 's')

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Toggle visibility with Space (when not in input)
    if (e.code === 'Space' && !(e.target as HTMLElement).matches('input, textarea, select')) {
      e.preventDefault()
      toggleVisibility()
    }
    // Toggle settings with Escape
    if (e.code === 'Escape' && isSettingsPanelOpen) {
      toggleSettingsPanel()
    }
    // Fullscreen with F
    if (e.code === 'KeyF' && !(e.target as HTMLElement).matches('input, textarea, select')) {
      e.preventDefault()
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        document.documentElement.requestFullscreen()
      }
    }
  })
}

/**
 * Helper to setup range inputs with value display
 */
function setupRangeInput(
  id: string, 
  key: keyof LowerThirdsSettings, 
  suffix: string,
  formatter?: (v: number) => number
): void {
  const input = document.getElementById(id) as HTMLInputElement
  if (!input) return

  input.addEventListener('input', () => {
    const value = parseFloat(input.value)
    updateSetting(key, value as any)
    
    const valueSpan = input.parentElement?.querySelector('.range-value')
    if (valueSpan) {
      valueSpan.textContent = `${formatter ? formatter(value) : value}${suffix}`
    }
  })
}

/**
 * Main render function
 */
export function renderLowerThirdsScreen(): void {
  // Reload settings in case they changed
  settings = loadSettings()
  
  const app = document.getElementById('app')
  if (!app) return

  app.innerHTML = buildScreenHTML()
  setupEventListeners()
  setupSocketListeners()
}
