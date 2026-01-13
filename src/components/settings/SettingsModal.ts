/**
 * Settings Modal Component
 * 
 * Provides comprehensive settings for main screen and confidence monitor displays.
 * Uses a tabbed interface for better organization.
 */

import { state, saveTheme, saveDisplaySettings, saveConfidenceMonitorSettings, saveLayoutSettings, updateState, savePartColors } from '../../state'
import { socketService, saveSettings } from '../../services'
import { setModalOpen } from '../../utils'
import { ICONS } from '../../constants'
import type { DisplaySettings, ConfidenceMonitorSettings, TransitionType, PartColorSettings } from '../../types'

import { renderMainScreenTab, initMainScreenTabListeners } from './MainScreenTab'
import { renderConfidenceMonitorTab, initConfidenceMonitorTabListeners } from './ConfidenceMonitorTab'
import { renderMediaTab, initMediaTabListeners } from './MediaTab'
import { renderGeneralTab } from './GeneralTab'
import { renderShortcutsTab } from './ShortcutsTab'
import { renderOutputMonitorTab, getConfidenceResolutionFromForm } from './OutputMonitorTab'
import { renderPartColorsTab, initPartColorsTabListeners } from './PartColorsTab'

let isOpen = false
let onCloseCallback: (() => void) | null = null
let activeTab = 'main'

// Snapshot for formatting and reverting changes
interface SettingsSnapshot {
  theme: 'light' | 'dark'
  displaySettings: DisplaySettings
  confidenceMonitorSettings: ConfidenceMonitorSettings
  logoMedia: string
  partColors: PartColorSettings
}

let settingsSnapshot: SettingsSnapshot | null = null
let isSaving = false

/**
 * Open the settings modal
 */
export function openSettings(onClose?: () => void): void {
  isOpen = true
  onCloseCallback = onClose || null
  isSaving = false

  // Capture snapshot
  settingsSnapshot = JSON.parse(JSON.stringify({
    theme: state.theme,
    displaySettings: state.displaySettings,
    confidenceMonitorSettings: state.confidenceMonitorSettings,
    logoMedia: state.logoMedia,
    partColors: state.partColors
  }))

  setModalOpen(true)
  render()
  showMarginMarkers()
}

/**
 * Close the settings modal
 */
export function closeSettings(): void {
  // Revert if not saving and snapshot exists
  if (!isSaving && settingsSnapshot) {
    // Restore state locally
    updateState({
      theme: settingsSnapshot.theme,
      displaySettings: settingsSnapshot.displaySettings,
      confidenceMonitorSettings: settingsSnapshot.confidenceMonitorSettings,
      logoMedia: settingsSnapshot.logoMedia,
      partColors: settingsSnapshot.partColors
    })

    // Restore remote screens
    socketService.updateDisplaySettings(settingsSnapshot.displaySettings)
    socketService.updateConfidenceMonitorSettings(settingsSnapshot.confidenceMonitorSettings)
    socketService.updateLogo(settingsSnapshot.logoMedia)
  }

  // Reset snapshot
  settingsSnapshot = null
  isSaving = false

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

  // Inline Tailwind Classes
  const overlayClass = "fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] backdrop-blur-[4px] modal-overlay"
  const modalClass = "flex w-[95%] max-w-[900px] h-[85vh] max-h-[700px] bg-bg-secondary border border-border-color rounded-md overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] settings-modal"
  const sidebarClass = "w-[220px] bg-bg-primary border-r border-border-color flex flex-col shrink-0"
  const logoClass = "flex items-center gap-3 p-4 font-semibold text-base text-text-primary border-b border-border-color"
  const logoIconClass = "text-xl"
  const navClass = "flex flex-col p-3 gap-1"
  const navItemClass = "flex items-center gap-3 px-4 py-3 bg-transparent border-none rounded-sm text-text-secondary text-sm cursor-pointer transition-all duration-150 text-left hover:bg-bg-hover hover:text-text-primary"
  const navItemActiveClass = "bg-accent-primary text-white hover:bg-accent-primary hover:text-white"
  const navIconClass = "text-base w-5 text-center"

  const contentClass = "flex-1 flex flex-col min-w-0"
  const headerClass = "flex justify-between items-center px-6 py-5 border-b border-border-color"
  const headerTitleClass = "text-lg font-semibold text-text-primary"
  const closeClass = "bg-none border-none text-text-secondary text-2xl cursor-pointer p-1 leading-[1] hover:text-text-primary"
  const bodyClass = "flex-1 overflow-y-auto p-6 settings-body"
  const footerClass = "flex justify-end gap-2 px-6 py-4 border-t border-border-color bg-bg-primary"

  const modal = document.createElement('div')
  modal.id = 'settings-modal'
  modal.className = overlayClass
  modal.innerHTML = `
    <div class="${modalClass}">
      <div class="${sidebarClass}">
        <div class="${logoClass}">
          <span class="${logoIconClass}">${ICONS.settings}</span>
          <span>Settings</span>
        </div>
        <nav class="${navClass}">
          <button class="${navItemClass} ${activeTab === 'main' ? navItemActiveClass : ''} settings-nav-item" data-tab="main">
            <span class="${navIconClass}">${ICONS.screen}</span>
            <span>Main Screen</span>
          </button>
          <button class="${navItemClass} ${activeTab === 'confidence' ? navItemActiveClass : ''} settings-nav-item" data-tab="confidence">
            <span class="${navIconClass}">${ICONS.monitor}</span>
            <span>Confidence Monitor</span>
          </button>
          <button class="${navItemClass} ${activeTab === 'media' ? navItemActiveClass : ''} settings-nav-item" data-tab="media">
            <span class="${navIconClass}">${ICONS.media}</span>
            <span>Media</span>
          </button>
          <button class="${navItemClass} ${activeTab === 'general' ? navItemActiveClass : ''} settings-nav-item" data-tab="general">
            <span class="${navIconClass}">${ICONS.palette}</span>
            <span>General</span>
          </button>
          <button class="${navItemClass} ${activeTab === 'shortcuts' ? navItemActiveClass : ''} settings-nav-item" data-tab="shortcuts">
            <span class="${navIconClass}">${ICONS.keyboard}</span>
            <span>Shortcuts</span>
          </button>
          <button class="${navItemClass} ${activeTab === 'outputs' ? navItemActiveClass : ''} settings-nav-item" data-tab="outputs">
            <span class="${navIconClass}">${ICONS.monitor}</span>
            <span>Outputs</span>
          </button>
          <button class="${navItemClass} ${activeTab === 'colors' ? navItemActiveClass : ''} settings-nav-item" data-tab="colors">
            <span class="${navIconClass}">${ICONS.palette}</span>
            <span>Colors</span>
          </button>
        </nav>
      </div>
      
      <div class="${contentClass}">
        <div class="${headerClass}">
          <h2 id="settings-title" class="${headerTitleClass}">${getTabTitle(activeTab)}</h2>
          <button class="${closeClass}" id="close-settings">×</button>
        </div>
        
        <div class="${bodyClass}">
          ${renderMainScreenTab()}
          ${renderConfidenceMonitorTab()}
          ${renderMediaTab()}
          ${renderGeneralTab()}
          ${renderShortcutsTab()}
          ${renderOutputMonitorTab()}
          ${renderPartColorsTab()}
        </div>
        
        <div class="${footerClass}">
          <button id="cancel-settings" class="px-4 py-2 bg-transparent border border-border-color text-text-secondary rounded cursor-pointer hover:bg-bg-hover hover:text-text-primary transition-colors">Cancel</button>
          <button id="apply-settings" class="px-4 py-2 bg-transparent border border-accent-primary text-accent-primary rounded cursor-pointer hover:bg-accent-primary/10 transition-colors">Apply</button>
          <button id="save-settings" class="px-4 py-2 bg-accent-primary border-none text-white rounded cursor-pointer hover:bg-accent-secondary transition-colors font-medium">Save & Close</button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // Show active tab content
  updateActiveTabContent()

  attachListeners(modal)
}

function getTabTitle(tab: string): string {
  switch (tab) {
    case 'main': return 'Main Screen Display'
    case 'confidence': return 'Confidence Monitor'
    case 'media': return 'Media Library'
    case 'general': return 'General Settings'
    case 'shortcuts': return 'Keyboard Shortcuts'
    case 'outputs': return 'Output Monitors'
    case 'colors': return 'Part Colors'
    default: return 'Settings'
  }
}

/**
 * Update visibility of tab content based on activeTab
 */
function updateActiveTabContent(): void {
  document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active', 'block'))
  document.querySelectorAll('.settings-tab').forEach(t => (t as HTMLElement).style.display = 'none')

  const activeTabEl = document.getElementById(`tab-${activeTab}`)
  if (activeTabEl) {
    activeTabEl.classList.add('active', 'block')
    activeTabEl.style.display = 'block'
  }
}

/**
 * Attach event listeners to the modal
 */
function attachListeners(modal: HTMLElement): void {
  document.getElementById('close-settings')?.addEventListener('click', closeSettings)
  document.getElementById('cancel-settings')?.addEventListener('click', closeSettings)


  document.querySelectorAll('.settings-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = (btn as HTMLElement).dataset.tab || 'main'
      activeTab = tab

      // Update nav
      document.querySelectorAll('.settings-nav-item').forEach(b => {
        b.classList.remove('bg-accent-primary', 'text-white')
        b.classList.add('text-text-secondary')
      })
      btn.classList.add('bg-accent-primary', 'text-white')
      btn.classList.remove('text-text-secondary')

      // Update content visibility
      updateActiveTabContent()

      // Update title
      const title = document.getElementById('settings-title')
      if (title) title.textContent = getTabTitle(tab)
    })
  })

  // Initialize listeners for sub-components
  initMainScreenTabListeners()
  initConfidenceMonitorTabListeners()
  initMediaTabListeners()
  initPartColorsTabListeners()

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

  // Live Preview Listeners
  const settingsBody = modal.querySelector('.settings-body') as HTMLElement
  if (settingsBody) {
    const handleUpdate = () => {
      updatePreview()
    }

    settingsBody.addEventListener('input', handleUpdate)
    settingsBody.addEventListener('change', handleUpdate)
  }
}

/**
 * Get current values from the form
 */
function getFormState(): SettingsSnapshot {
  // Theme
  const theme = (document.getElementById('theme-select') as HTMLSelectElement)?.value as 'light' | 'dark' || state.theme

  // Logo
  const logoMedia = (document.getElementById('logo-url') as HTMLInputElement)?.value || state.logoMedia

  // Main screen settings
  const ds = { ...state.displaySettings }

  if (document.getElementById('main-font-size')) {
    ds.fontSize = parseFloat((document.getElementById('main-font-size') as HTMLInputElement).value)
    ds.fontFamily = (document.getElementById('main-font-family') as HTMLSelectElement).value
    ds.lineHeight = parseFloat((document.getElementById('main-line-height') as HTMLInputElement).value)
    ds.textColor = (document.getElementById('main-text-color') as HTMLInputElement).value
    ds.allCaps = (document.getElementById('main-all-caps') as HTMLInputElement).checked
    ds.textShadow = (document.getElementById('main-text-shadow') as HTMLInputElement).checked
    ds.shadowBlur = parseInt((document.getElementById('main-shadow-blur') as HTMLInputElement).value)
    ds.shadowOffsetX = parseInt((document.getElementById('main-shadow-x') as HTMLInputElement).value)
    ds.shadowOffsetY = parseInt((document.getElementById('main-shadow-y') as HTMLInputElement).value)
    ds.textOutline = (document.getElementById('main-text-outline') as HTMLInputElement).checked
    ds.outlineWidth = parseFloat((document.getElementById('main-outline-width') as HTMLInputElement).value)
    ds.outlineColor = (document.getElementById('main-outline-color') as HTMLInputElement).value
    ds.marginTop = parseInt((document.getElementById('main-margin-top') as HTMLInputElement).value)
    ds.marginBottom = parseInt((document.getElementById('main-margin-bottom') as HTMLInputElement).value)
    ds.marginLeft = parseInt((document.getElementById('main-margin-left') as HTMLInputElement).value)
    ds.marginRight = parseInt((document.getElementById('main-margin-right') as HTMLInputElement).value)
    ds.transitions = {
      type: (document.getElementById('main-transition-type') as HTMLSelectElement).value as TransitionType,
      duration: parseFloat((document.getElementById('main-transition-duration') as HTMLInputElement).value)
    }
  }

  // Confidence monitor settings
  const cms = { ...state.confidenceMonitorSettings }

  if (document.getElementById('cm-font-size')) {
    cms.fontSize = parseFloat((document.getElementById('cm-font-size') as HTMLInputElement).value)
    cms.fontFamily = (document.getElementById('cm-font-family') as HTMLSelectElement).value
    cms.lineHeight = parseFloat((document.getElementById('cm-line-height') as HTMLInputElement).value)
    cms.partGap = parseFloat((document.getElementById('cm-part-gap') as HTMLInputElement).value)
    cms.slideGap = parseFloat((document.getElementById('cm-slide-gap') as HTMLInputElement).value)
    cms.prevNextOpacity = parseFloat((document.getElementById('cm-opacity') as HTMLInputElement).value)
    cms.clockSize = parseFloat((document.getElementById('cm-clock-size') as HTMLInputElement).value)
    cms.marginTop = parseFloat((document.getElementById('cm-margin-top') as HTMLInputElement).value)
    cms.marginBottom = parseFloat((document.getElementById('cm-margin-bottom') as HTMLInputElement).value)
    cms.marginLeft = parseFloat((document.getElementById('cm-margin-left') as HTMLInputElement).value)
    cms.marginRight = parseFloat((document.getElementById('cm-margin-right') as HTMLInputElement).value)
    cms.transitions = {
      type: (document.getElementById('cm-transition-type') as HTMLSelectElement).value as TransitionType,
      duration: parseFloat((document.getElementById('cm-transition-duration') as HTMLInputElement).value)
    }
  }

  // Part Colors
  const partColors: PartColorSettings = { ...state.partColors }
  const colorInputs = document.querySelectorAll('.part-color-input')
  colorInputs.forEach(input => {
    const el = input as HTMLInputElement
    const key = el.getAttribute('data-key')
    if (key) {
      partColors[key] = el.value
    }
  })

  return {
    theme,
    displaySettings: ds,
    confidenceMonitorSettings: cms,
    logoMedia,
    partColors
  }
}

/**
 * Update state and sockets for live preview
 */
function updatePreview(): void {
  const current = getFormState()

  // Update local state (triggers Control Panel UI updates)
  updateState({
    theme: current.theme,
    displaySettings: current.displaySettings,
    confidenceMonitorSettings: current.confidenceMonitorSettings,
    logoMedia: current.logoMedia,
    partColors: current.partColors
  })

  // Update remote screens via socket
  socketService.updateDisplaySettings(current.displaySettings)
  socketService.updateConfidenceMonitorSettings(current.confidenceMonitorSettings)
  socketService.updateLogo(current.logoMedia)
}

/**
 * Collect current form values and apply settings
 */
function applySettings(): void {
  // Mark as saving so we don't revert on close
  isSaving = true

  const current = getFormState()

  // Save specific parts
  saveTheme(current.theme)
  saveDisplaySettings(current.displaySettings)
  saveConfidenceMonitorSettings(current.confidenceMonitorSettings)
  savePartColors(current.partColors)

  updateState({ logoMedia: current.logoMedia })
  socketService.updateLogo(current.logoMedia)
  // Save logo path to server
  saveSettings({ logoMedia: current.logoMedia }).catch(console.error)

  // Save output monitor resolution settings (from Outputs tab)
  const confidenceRes = getConfidenceResolutionFromForm()
  if (confidenceRes) {
    const layoutSettings = { ...state.layoutSettings, confidenceMonitorResolution: confidenceRes }
    saveLayoutSettings(layoutSettings)
  }

  // Update snapshot to current so subsequent cancels don't revert
  settingsSnapshot = JSON.parse(JSON.stringify(current))

  // Reset saving flag
  isSaving = false
}
