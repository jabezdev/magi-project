/**
 * Lower Thirds Screen
 * 
 * A screen for displaying lower third graphics with chroma key background.
 * Syncs with live lyrics from the control panel via Socket.io.
 * Settings are stored locally in the browser's localStorage.
 */

import { state, subscribeToState } from '../state'
import type { LowerThirdsSettings } from '../types'
import { STORAGE_KEYS, DEFAULT_LOWER_THIRDS_SETTINGS } from '../constants'

// Local state for settings
let settings: LowerThirdsSettings = loadSettings()
let isSettingsPanelOpen = false

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
 * Get the current text from live state
 */
function getCurrentContentText(): string {
  const slide = state.liveContent[state.livePosition]
  if (!slide || slide.type !== 'text') return ''
  return slide.content || ''
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

  const text = getCurrentContentText()

  const positionStyle = position === 'bottom'
    ? `bottom: ${marginBottom}%; top: auto;`
    : `top: ${marginTop}%; bottom: auto;`

  const containerStyle = `
    ${positionStyle}
    left: ${marginLeft}%;
    right: ${marginRight}%;
    padding: ${paddingVertical}px ${paddingHorizontal}px;
    background-color: ${backgroundColor};
    opacity: ${visible && text ? backgroundOpacity : 0};
    transform: translateX(${visible && text ? '0' : '-100%'});
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

  // Format text - replace newlines with <br>
  const formattedText = text
    .split('\n')
    .map(line => `<span class="lyric-line">${escapeHtml(line)}</span>`)
    .join('<br>')

  return `
    <div class="absolute z-[2] box-border lower-third-container" style="${containerStyle}">
      <div class="leading-[1.3] lower-third-text" style="${textStyle}">${formattedText}</div>
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
    <div class="fixed top-0 ${isSettingsPanelOpen ? 'right-0' : '-right-[400px]'} w-[380px] h-screen bg-[#141419fa] border-l border-white/10 z-[99] transition-[right] duration-300 ease-in-out flex flex-col overflow-hidden lower-thirds-settings-panel">
      <div class="flex justify-between items-center py-4 px-5 bg-black/30 border-b border-white/10 settings-panel-header">
        <h2 class="m-0 text-lg font-semibold text-white">Lower Thirds Settings</h2>
        <button class="w-8 h-8 border-none bg-white/10 text-white text-2xl rounded-md cursor-pointer flex items-center justify-center transition-colors duration-200 hover:bg-white/20 settings-close-btn" title="Close Settings">×</button>
      </div>
      
      <div class="flex-1 overflow-y-auto py-4 px-5 settings-panel-content">
        <!-- Info Section -->
        <section class="mb-6 settings-section">
          <div class="py-3 px-4 bg-blue-500/15 border border-blue-500/30 rounded-lg settings-info">
            <p class="m-0 text-[13px] text-white/80 leading-[1.4]">📡 Text syncs automatically with live lyrics from the Control Panel.</p>
          </div>
        </section>

        <!-- Typography Section -->
        <section class="mb-6 settings-section">
          <h3 class="text-[13px] font-semibold text-white/50 uppercase tracking-[0.5px] m-[0_0_12px_0] pb-2 border-b border-white/10">Typography</h3>
          <div class="flex flex-col gap-[6px] mb-[14px] setting-row">
            <label class="text-[13px] font-medium text-white/80" for="lt-font-family">Font Family</label>
            <select class="w-full py-[10px] px-3 border border-white/15 rounded-md bg-white/5 text-white text-sm transition-colors duration-200 focus:outline-none focus:border-blue-500/60 focus:bg-white/10 cursor-pointer" id="lt-font-family">
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
          <div class="flex flex-col gap-[6px] mb-[14px] setting-row">
            <label class="text-[13px] font-medium text-white/80" for="lt-font-size">Font Size</label>
            <div class="flex items-center gap-3 range-with-value">
              <input class="flex-1 h-[6px] appearance-none bg-white/10 rounded-[3px] outline-none cursor-pointer" type="range" id="lt-font-size" min="16" max="120" step="1" value="${fontSize}" />
              <span class="min-w-[55px] py-1 px-2 bg-white/10 rounded text-xs font-medium text-white/70 text-center range-value">${fontSize}px</span>
            </div>
          </div>
          <div class="flex flex-col gap-[6px] mb-[14px] setting-row">
            <label class="text-[13px] font-medium text-white/80" for="lt-font-weight">Font Weight</label>
            <select class="w-full py-[10px] px-3 border border-white/15 rounded-md bg-white/5 text-white text-sm transition-colors duration-200 focus:outline-none focus:border-blue-500/60 focus:bg-white/10 cursor-pointer" id="lt-font-weight">
              <option class="bg-[#1a1a1f] text-white" value="normal" ${fontWeight === 'normal' ? 'selected' : ''}>Normal</option>
              <option class="bg-[#1a1a1f] text-white" value="bold" ${fontWeight === 'bold' ? 'selected' : ''}>Bold</option>
              <option class="bg-[#1a1a1f] text-white" value="lighter" ${fontWeight === 'lighter' ? 'selected' : ''}>Lighter</option>
              <option class="bg-[#1a1a1f] text-white" value="100" ${fontWeight === '100' ? 'selected' : ''}>100</option>
              <option class="bg-[#1a1a1f] text-white" value="200" ${fontWeight === '200' ? 'selected' : ''}>200</option>
              <option class="bg-[#1a1a1f] text-white" value="300" ${fontWeight === '300' ? 'selected' : ''}>300</option>
              <option class="bg-[#1a1a1f] text-white" value="400" ${fontWeight === '400' ? 'selected' : ''}>400</option>
              <option class="bg-[#1a1a1f] text-white" value="500" ${fontWeight === '500' ? 'selected' : ''}>500</option>
              <option class="bg-[#1a1a1f] text-white" value="600" ${fontWeight === '600' ? 'selected' : ''}>600</option>
              <option class="bg-[#1a1a1f] text-white" value="700" ${fontWeight === '700' ? 'selected' : ''}>700</option>
              <option class="bg-[#1a1a1f] text-white" value="800" ${fontWeight === '800' ? 'selected' : ''}>800</option>
              <option class="bg-[#1a1a1f] text-white" value="900" ${fontWeight === '900' ? 'selected' : ''}>900</option>
            </select>
          </div>
          <div class="flex flex-col gap-[6px] mb-[14px] setting-row">
            <label class="text-[13px] font-medium text-white/80" for="lt-text-color">Text Color</label>
            <input class="w-[60px] h-[36px] p-[2px] border border-white/15 rounded-md bg-white/5 cursor-pointer" type="color" id="lt-text-color" value="${textColor}" />
          </div>
          <div class="flex flex-col gap-[6px] mb-[14px] setting-row">
            <label class="text-[13px] font-medium text-white/80" for="lt-text-align">Text Alignment</label>
            <select class="w-full py-[10px] px-3 border border-white/15 rounded-md bg-white/5 text-white text-sm transition-colors duration-200 focus:outline-none focus:border-blue-500/60 focus:bg-white/10 cursor-pointer" id="lt-text-align">
              <option class="bg-[#1a1a1f] text-white" value="left" ${textAlign === 'left' ? 'selected' : ''}>Left</option>
              <option class="bg-[#1a1a1f] text-white" value="center" ${textAlign === 'center' ? 'selected' : ''}>Center</option>
              <option class="bg-[#1a1a1f] text-white" value="right" ${textAlign === 'right' ? 'selected' : ''}>Right</option>
            </select>
          </div>
          <div class="flex items-center justify-between mb-[14px] setting-row setting-row-inline">
            <label class="text-[13px] font-medium text-white/80" for="lt-all-caps">All Caps</label>
            <input class="w-5 h-5 cursor-pointer accent-blue-500" type="checkbox" id="lt-all-caps" ${allCaps ? 'checked' : ''} />
          </div>
        </section>

        <!-- Background Section -->
        <section class="mb-6 settings-section">
          <h3 class="text-[13px] font-semibold text-white/50 uppercase tracking-[0.5px] m-[0_0_12px_0] pb-2 border-b border-white/10">Background</h3>
          <div class="flex flex-col gap-[6px] mb-[14px] setting-row">
            <label class="text-[13px] font-medium text-white/80" for="lt-bg-color">Background Color</label>
            <div class="flex gap-2 items-center color-with-presets">
              <input class="w-[60px] h-[36px] p-[2px] border border-white/15 rounded-md bg-white/5 cursor-pointer" type="color" id="lt-bg-color" value="${backgroundColor}" />
              <button class="w-8 h-8 p-0 border border-white/15 rounded-md bg-white/5 text-base cursor-pointer flex items-center justify-center transition-all duration-100 hover:scale-110 hover:border-white/30 preset-btn" data-color="#00FF00" title="Chroma Green">🟢</button>
              <button class="w-8 h-8 p-0 border border-white/15 rounded-md bg-white/5 text-base cursor-pointer flex items-center justify-center transition-all duration-100 hover:scale-110 hover:border-white/30 preset-btn" data-color="#0000FF" title="Chroma Blue">🔵</button>
              <button class="w-8 h-8 p-0 border border-white/15 rounded-md bg-white/5 text-base cursor-pointer flex items-center justify-center transition-all duration-100 hover:scale-110 hover:border-white/30 preset-btn" data-color="#000000" title="Black">⚫</button>
              <button class="w-8 h-8 p-0 border border-white/15 rounded-md bg-white/5 text-base cursor-pointer flex items-center justify-center transition-all duration-100 hover:scale-110 hover:border-white/30 preset-btn" data-color="#FFFFFF" title="White">⚪</button>
            </div>
          </div>
          <div class="flex flex-col gap-[6px] mb-[14px] setting-row">
            <label class="text-[13px] font-medium text-white/80" for="lt-bg-opacity">Background Opacity</label>
            <div class="flex items-center gap-3 range-with-value">
              <input class="flex-1 h-[6px] appearance-none bg-white/10 rounded-[3px] outline-none cursor-pointer" type="range" id="lt-bg-opacity" min="0" max="1" step="0.05" value="${backgroundOpacity}" />
              <span class="min-w-[55px] py-1 px-2 bg-white/10 rounded text-xs font-medium text-white/70 text-center range-value">${Math.round(backgroundOpacity * 100)}%</span>
            </div>
          </div>
        </section>

        <!-- Position & Sizing Section -->
        <section class="mb-6 settings-section">
          <h3 class="text-[13px] font-semibold text-white/50 uppercase tracking-[0.5px] m-[0_0_12px_0] pb-2 border-b border-white/10">Position & Sizing</h3>
          <div class="flex flex-col gap-[6px] mb-[14px] setting-row">
            <label class="text-[13px] font-medium text-white/80" for="lt-position">Position</label>
            <select class="w-full py-[10px] px-3 border border-white/15 rounded-md bg-white/5 text-white text-sm transition-colors duration-200 focus:outline-none focus:border-blue-500/60 focus:bg-white/10 cursor-pointer" id="lt-position">
              <option class="bg-[#1a1a1f] text-white" value="bottom" ${position === 'bottom' ? 'selected' : ''}>Bottom</option>
              <option class="bg-[#1a1a1f] text-white" value="top" ${position === 'top' ? 'selected' : ''}>Top</option>
            </select>
          </div>
          <div class="flex flex-col gap-[6px] mb-[14px] setting-row">
            <label class="text-[13px] font-medium text-white/80" for="lt-margin-top">Margin Top (%)</label>
            <div class="flex items-center gap-3 range-with-value">
              <input class="flex-1 h-[6px] appearance-none bg-white/10 rounded-[3px] outline-none cursor-pointer" type="range" id="lt-margin-top" min="0" max="50" step="1" value="${marginTop}" />
              <span class="min-w-[55px] py-1 px-2 bg-white/10 rounded text-xs font-medium text-white/70 text-center range-value">${marginTop}%</span>
            </div>
          </div>
          <div class="flex flex-col gap-[6px] mb-[14px] setting-row">
            <label class="text-[13px] font-medium text-white/80" for="lt-margin-bottom">Margin Bottom (%)</label>
            <div class="flex items-center gap-3 range-with-value">
              <input class="flex-1 h-[6px] appearance-none bg-white/10 rounded-[3px] outline-none cursor-pointer" type="range" id="lt-margin-bottom" min="0" max="50" step="1" value="${marginBottom}" />
              <span class="min-w-[55px] py-1 px-2 bg-white/10 rounded text-xs font-medium text-white/70 text-center range-value">${marginBottom}%</span>
            </div>
          </div>
          <div class="flex flex-col gap-[6px] mb-[14px] setting-row">
            <label class="text-[13px] font-medium text-white/80" for="lt-margin-left">Margin Left (%)</label>
            <div class="flex items-center gap-3 range-with-value">
              <input class="flex-1 h-[6px] appearance-none bg-white/10 rounded-[3px] outline-none cursor-pointer" type="range" id="lt-margin-left" min="0" max="50" step="1" value="${marginLeft}" />
              <span class="min-w-[55px] py-1 px-2 bg-white/10 rounded text-xs font-medium text-white/70 text-center range-value">${marginLeft}%</span>
            </div>
          </div>
          <div class="flex flex-col gap-[6px] mb-[14px] setting-row">
            <label class="text-[13px] font-medium text-white/80" for="lt-margin-right">Margin Right (%)</label>
            <div class="flex items-center gap-3 range-with-value">
              <input class="flex-1 h-[6px] appearance-none bg-white/10 rounded-[3px] outline-none cursor-pointer" type="range" id="lt-margin-right" min="0" max="50" step="1" value="${marginRight}" />
              <span class="min-w-[55px] py-1 px-2 bg-white/10 rounded text-xs font-medium text-white/70 text-center range-value">${marginRight}%</span>
            </div>
          </div>
          <div class="flex flex-col gap-[6px] mb-[14px] setting-row">
            <label class="text-[13px] font-medium text-white/80" for="lt-padding-v">Padding Vertical (px)</label>
            <div class="flex items-center gap-3 range-with-value">
              <input class="flex-1 h-[6px] appearance-none bg-white/10 rounded-[3px] outline-none cursor-pointer" type="range" id="lt-padding-v" min="0" max="100" step="1" value="${paddingVertical}" />
              <span class="min-w-[55px] py-1 px-2 bg-white/10 rounded text-xs font-medium text-white/70 text-center range-value">${paddingVertical}px</span>
            </div>
          </div>
          <div class="flex flex-col gap-[6px] mb-[14px] setting-row">
            <label class="text-[13px] font-medium text-white/80" for="lt-padding-h">Padding Horizontal (px)</label>
            <div class="flex items-center gap-3 range-with-value">
              <input class="flex-1 h-[6px] appearance-none bg-white/10 rounded-[3px] outline-none cursor-pointer" type="range" id="lt-padding-h" min="0" max="200" step="1" value="${paddingHorizontal}" />
              <span class="min-w-[55px] py-1 px-2 bg-white/10 rounded text-xs font-medium text-white/70 text-center range-value">${paddingHorizontal}px</span>
            </div>
          </div>
        </section>

        <!-- Animation Section -->
        <section class="mb-6 settings-section">
          <h3 class="text-[13px] font-semibold text-white/50 uppercase tracking-[0.5px] m-[0_0_12px_0] pb-2 border-b border-white/10">Animation</h3>
          <div class="flex flex-col gap-[6px] mb-[14px] setting-row">
            <label class="text-[13px] font-medium text-white/80" for="lt-animation-duration">Animation Duration (s)</label>
            <div class="flex items-center gap-3 range-with-value">
              <input class="flex-1 h-[6px] appearance-none bg-white/10 rounded-[3px] outline-none cursor-pointer" type="range" id="lt-animation-duration" min="0" max="2" step="0.1" value="${animationDuration}" />
              <span class="min-w-[55px] py-1 px-2 bg-white/10 rounded text-xs font-medium text-white/70 text-center range-value">${animationDuration}s</span>
            </div>
          </div>
        </section>

        <!-- Actions Section -->
        <section class="mb-6 settings-section pt-4 border-t border-white/10">
          <button class="w-full p-3 border rounded-md text-[#ff9999] text-sm font-medium cursor-pointer transition-colors duration-200 border-red-400/30 bg-red-400/10 hover:bg-red-400/20 hover:border-red-400/50 reset-btn" id="lt-reset">Reset to Defaults</button>
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
    <div class="relative w-full h-screen overflow-hidden lower-thirds-screen">
      <!-- Chroma Key Background -->
      <div class="absolute inset-0 z-[1] lower-thirds-background" style="background-color: ${settings.backgroundColor}"></div>
      
      <!-- Lower Third Element -->
      ${buildLowerThirdHTML()}
      
      <!-- Controls Overlay (hidden in fullscreen/production) -->
      <div class="fixed top-5 left-5 flex gap-[10px] z-[100] opacity-0 transition-opacity duration-300 pointer-events-none hover:opacity-100 hover:pointer-events-auto lower-thirds-controls">
        <button class="py-[10px] px-4 border border-white/30 rounded-md bg-black/70 text-white text-sm cursor-pointer transition-all duration-200 whitespace-nowrap visibility-toggle-btn ${settings.visible ? 'visible' : 'hidden opacity-70'}" title="Toggle Lower Third">
          ${settings.visible ? '👁️ Hide' : '👁️‍🗨️ Show'}
        </button>
        <button class="py-[10px] px-4 border border-white/30 rounded-md bg-black/70 text-white text-sm cursor-pointer transition-all duration-200 whitespace-nowrap settings-toggle-btn ${isSettingsPanelOpen ? 'active bg-blue-500/80 border-blue-500/50' : ''}" title="Open Settings">
          ⚙️ Settings
        </button>
        <button class="py-[10px] px-4 border border-white/30 rounded-md bg-black/70 text-white text-sm cursor-pointer transition-all duration-200 whitespace-nowrap fullscreen-btn" title="Toggle Fullscreen">
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

  const text = getCurrentContentText()

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
    opacity: ${visible && text ? backgroundOpacity : 0};
    transform: translateX(${visible && text ? '0' : '-100%'});
    transition: opacity ${animationDuration}s ease, transform ${animationDuration}s ease;
    text-align: ${textAlign};
  `

  // Update text
  const textEl = container.querySelector('.lower-third-text') as HTMLElement
  if (textEl) {
    // Format text - replace newlines with <br>
    const formattedText = text
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
    btn.className = `py-[10px] px-4 border border-white/30 rounded-md bg-black/70 text-white text-sm cursor-pointer transition-all duration-200 whitespace-nowrap visibility-toggle-btn ${settings.visible ? 'visible' : 'hidden opacity-70'}`
    btn.innerHTML = settings.visible ? '👁️ Hide' : '👁️‍🗨️ Show'
  }
}

/**
 * Setup state subscription for updates
 */
function setupStateSubscription(): void {
  subscribeToState((changes) => {
    if (changes.includes('live' as any) || changes.includes('livePosition') || changes.includes('liveContent')) {
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
  setupStateSubscription()
}
