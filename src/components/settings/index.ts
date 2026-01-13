/**
 * Settings Modal Component
 * 
 * Provides comprehensive settings for main screen and confidence monitor displays.
 * Uses a tabbed interface for better organization.
 */

import { state, saveTheme, saveDisplaySettings, saveConfidenceMonitorSettings, saveLayoutSettings, updateState } from '../../state'
import { socketService } from '../../services/socket'
import { saveSettings } from '../../services/api'
import { setModalOpen } from '../../utils/keyboard'
import { ICONS } from '../../constants/icons'
import type { DisplaySettings, ConfidenceMonitorSettings, TransitionType } from '../../types'

import { renderMainScreenTab, initMainScreenTabListeners } from './MainScreenTab'
import { renderConfidenceMonitorTab, initConfidenceMonitorTabListeners } from './ConfidenceMonitorTab'
import { renderMediaTab, initMediaTabListeners } from './MediaTab'
import { renderGeneralTab } from './GeneralTab'
import { renderShortcutsTab } from './ShortcutsTab'
import { renderOutputMonitorTab, getConfidenceResolutionFromForm } from './OutputMonitorTab'

let isOpen = false
let onCloseCallback: (() => void) | null = null
let activeTab = 'main'

// Snapshot for formatting and reverting changes
interface SettingsSnapshot {
  theme: 'light' | 'dark'
  displaySettings: DisplaySettings
  confidenceMonitorSettings: ConfidenceMonitorSettings
  logoMedia: string
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
    logoMedia: state.logoMedia
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
      logoMedia: settingsSnapshot.logoMedia
    })

    // Restore remote screens
    socketService.updateDisplaySettings(settingsSnapshot.displaySettings)
    socketService.updateConfidenceMonitorSettings(settingsSnapshot.confidenceMonitorSettings)
    socketService.updateLogo(settingsSnapshot.logoMedia)
    // We don't need to revert theme on server as it's local mainly, but we could if needed. 
    // Actually theme is local storage usually, but state update handles it.
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

  const modal = document.createElement('div')
  modal.id = 'settings-modal'
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="settings-modal">
      <div class="settings-sidebar">
        <div class="settings-logo">
          <span class="settings-logo-icon">${ICONS.settings}</span>
          <span>Settings</span>
        </div>
        <nav class="settings-nav">
          <button class="settings-nav-item ${activeTab === 'main' ? 'active' : ''}" data-tab="main">
            <span class="nav-icon">${ICONS.screen}</span>
            <span>Main Screen</span>
          </button>
          <button class="settings-nav-item ${activeTab === 'confidence' ? 'active' : ''}" data-tab="confidence">
            <span class="nav-icon">${ICONS.monitor}</span>
            <span>Confidence Monitor</span>
          </button>
          <button class="settings-nav-item ${activeTab === 'media' ? 'active' : ''}" data-tab="media">
            <span class="nav-icon">${ICONS.media}</span>
            <span>Media</span>
          </button>
          <button class="settings-nav-item ${activeTab === 'general' ? 'active' : ''}" data-tab="general">
            <span class="nav-icon">${ICONS.palette}</span>
            <span>General</span>
          </button>
          <button class="settings-nav-item ${activeTab === 'shortcuts' ? 'active' : ''}" data-tab="shortcuts">
            <span class="nav-icon">${ICONS.keyboard}</span>
            <span>Shortcuts</span>
          </button>
          <button class="settings-nav-item ${activeTab === 'outputs' ? 'active' : ''}" data-tab="outputs">
            <span class="nav-icon">${ICONS.monitor}</span>
            <span>Outputs</span>
          </button>
        </nav>
      </div>
      
      <div class="settings-content">
        <div class="settings-header">
          <h2 id="settings-title">${getTabTitle(activeTab)}</h2>
          <button class="modal-close" id="close-settings">×</button>
        </div>
        
        <div class="settings-body">
          ${renderMainScreenTab()}
          ${renderConfidenceMonitorTab()}
          ${renderMediaTab()}
          ${renderGeneralTab()}
          ${renderShortcutsTab()}
          ${renderOutputMonitorTab()}
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
    default: return 'Settings'
  }
}

/**
 * Update visibility of tab content based on activeTab
 */
function updateActiveTabContent(): void {
  document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'))
  document.getElementById(`tab-${activeTab}`)?.classList.add('active')
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
  // We use event delegation on the settings body
  const settingsBody = modal.querySelector('.settings-body') as HTMLElement
  if (settingsBody) {
    const handleUpdate = () => {
      updatePreview()
    }

    // Listen for input (sliders, text) and change (selects, checkboxes)
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
  const ds = { ...state.displaySettings } // start with defaults/current to fill gaps if elements missing

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

  return {
    theme,
    displaySettings: ds,
    confidenceMonitorSettings: cms,
    logoMedia
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
    logoMedia: current.logoMedia
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

  // Reset saving flag after a brief moment (or immediately if we are closing anyway)
  // If Apply is clicked, we stay open, so we need to reset isSaving to false
  // so if they Cancel LATER, it reverts to THIS state (which is why we updated snapshot)
  isSaving = false
}
