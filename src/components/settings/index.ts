/**
 * Settings Modal Component
 * 
 * Provides comprehensive settings for main screen and confidence monitor displays.
 * Uses a tabbed interface for better organization.
 */

import { saveTheme, saveDisplaySettings, saveConfidenceMonitorSettings, updateState } from '../../state'
import { socketService } from '../../services/socket'
import { setModalOpen } from '../../utils/keyboard'
import { ICONS } from '../../constants/icons'
import type { DisplaySettings, ConfidenceMonitorSettings } from '../../types'

import { renderMainScreenTab, initMainScreenTabListeners } from './MainScreenTab'
import { renderConfidenceMonitorTab, initConfidenceMonitorTabListeners } from './ConfidenceMonitorTab'
import { renderMediaTab, initMediaTabListeners } from './MediaTab'
import { renderGeneralTab } from './GeneralTab'

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
