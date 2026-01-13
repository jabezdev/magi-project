import { ICONS } from '../../constants/icons'
import { renderStatusIndicator, initStatusIndicatorListener } from './StatusIndicator'
import { openSettings } from '../settings'
import { state, saveLayoutSettings } from '../../state'

// Default resolutions for scaling
const RES_16_9 = { width: 1920, height: 1080 }

function getConfidenceResolution(): { width: number; height: number } {
  return state.layoutSettings.confidenceMonitorResolution || { width: 1024, height: 768 }
}

function isMonitorEnabled(monitor: 'main' | 'confidence' | 'thirds'): boolean {
  const settings = state.layoutSettings
  switch (monitor) {
    case 'main': return settings.mainMonitorEnabled !== false
    case 'confidence': return settings.confidenceMonitorEnabled !== false
    case 'thirds': return settings.lowerThirdsMonitorEnabled !== false
  }
}

function isStaticModeEnabled(): boolean {
  return state.layoutSettings.mainProjectionStaticMode === true
}

function renderMonitorContent(
  path: string,
  res: { width: number; height: number },
  enabled: boolean,
  staticMode?: boolean
): string {
  if (!enabled) {
    return `<div class="monitor-disabled"><span>${ICONS.power}</span><span>Display Off</span></div>`
  }

  // For static mode, add query param so MainProjection uses thumbnail instead of video
  const src = staticMode ? `${path}?static=1` : path

  return `<iframe src="${src}" scrolling="no" class="monitor-frame" style="width: ${res.width}px; height: ${res.height}px;"></iframe>`
}

export function renderOutputMonitorColumn(): string {
  const mainEnabled = isMonitorEnabled('main')
  const confidenceEnabled = isMonitorEnabled('confidence')
  const thirdsEnabled = isMonitorEnabled('thirds')
  const staticMode = isStaticModeEnabled()
  const confidenceRes = getConfidenceResolution()

  return `
    <div class="cp-column cp-monitors">
      <div class="cp-column-header horizontal-layout compact-header">
        <div class="header-section-left">
          <span class="header-icon">${ICONS.monitor}</span>
          <span>OUTPUTS</span>
        </div>
        <div class="header-section-center"></div>
        <div class="header-section-right">
          <div class="status-indicator-wrapper">${renderStatusIndicator()}</div>
          <button class="icon-btn settings-header-btn flush-btn" id="focus-all-btn" title="Focus All Windows">${ICONS.target}</button>
          <button class="icon-btn settings-header-btn flush-btn" id="data-screen-btn" title="Full Screen">${ICONS.maximize}</button>
          <button class="icon-btn settings-header-btn flush-btn" id="settings-btn" title="Settings">${ICONS.settings}</button>
        </div>
      </div>
      <div class="cp-column-body monitor-list">
        
        <!-- Main Projection (16:9) -->
        <div class="monitor-group" data-monitor="main">
          <div class="monitor-label">
            <label class="toggle-switch">
              <input type="checkbox" class="monitor-toggle" data-monitor="main" ${mainEnabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <span>Main Projection</span>
            <label class="toggle-switch static-toggle" title="Static Mode (saves GPU)">
              <input type="checkbox" class="static-mode-toggle" data-monitor="main" ${staticMode ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="monitor-wrapper ratio-16-9" data-width="${RES_16_9.width}" data-height="${RES_16_9.height}">
            ${renderMonitorContent('/main', RES_16_9, mainEnabled, staticMode)}
          </div>
        </div>

        <!-- Confidence Monitor (4:3) -->
        <div class="monitor-group" data-monitor="confidence">
          <div class="monitor-label">
            <label class="toggle-switch">
              <input type="checkbox" class="monitor-toggle" data-monitor="confidence" ${confidenceEnabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <span>Confidence</span>
          </div>
          <div class="monitor-wrapper ratio-4-3" data-width="${confidenceRes.width}" data-height="${confidenceRes.height}">
            ${renderMonitorContent('/confidence', confidenceRes, confidenceEnabled)}
          </div>
        </div>

        <!-- Lower Thirds (16:9) -->
        <div class="monitor-group" data-monitor="thirds">
          <div class="monitor-label">
            <label class="toggle-switch">
              <input type="checkbox" class="monitor-toggle" data-monitor="thirds" ${thirdsEnabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <span>Lower Thirds</span>
          </div>
          <div class="monitor-wrapper ratio-16-9" data-width="${RES_16_9.width}" data-height="${RES_16_9.height}">
            ${renderMonitorContent('/thirds', RES_16_9, thirdsEnabled)}
          </div>
        </div>

      </div>
    </div>
  `
}

export function initOutputMonitorListeners(): void {
  const wrappers = document.querySelectorAll('.monitor-wrapper')

  const ro = new ResizeObserver(entries => {
    for (const entry of entries) {
      const wrapper = entry.target as HTMLElement
      const iframe = wrapper.querySelector('iframe') as HTMLElement
      if (!iframe) continue

      const baseWidth = parseInt(wrapper.getAttribute('data-width') || '1280')
      const baseHeight = parseInt(wrapper.getAttribute('data-height') || '720')

      const width = entry.contentRect.width
      const scale = width / baseWidth

      // Set iframe base size
      iframe.style.width = `${baseWidth}px`
      iframe.style.height = `${baseHeight}px`

      // Scale it
      iframe.style.transform = `scale(${scale})`
    }
  })

  wrappers.forEach(wrapper => ro.observe(wrapper))

  // Init Status Indicator
  initStatusIndicatorListener()

  // Init Settings Button
  document.getElementById('settings-btn')?.addEventListener('click', () => {
    openSettings()
  })

  // Monitor toggle checkboxes
  document.querySelectorAll('.monitor-toggle').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation()
      const monitor = checkbox.getAttribute('data-monitor') as 'main' | 'confidence' | 'thirds'
      toggleMonitor(monitor)
    })
  })

  // Static mode toggle checkbox
  document.querySelectorAll('.static-mode-toggle').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation()
      toggleStaticMode()
    })
  })

  // Window references
  let mainWin: Window | null = null
  let confidenceWin: Window | null = null
  let thirdsWin: Window | null = null

  // Monitor click listeners
  const openWindow = (path: string, ref: Window | null, w: number, h: number): Window | null => {
    if (ref && !ref.closed) {
      ref.focus()
      return ref
    }
    const newWin = window.open(path, '_blank', `width=${w},height=${h},menubar=no,toolbar=no,location=no,status=no`)
    if (newWin) newWin.focus()
    return newWin
  }

  // Setup click listeners for monitors
  const monitorGroups = document.querySelectorAll('.monitor-group')

  if (monitorGroups.length >= 1) {
    // Main
    monitorGroups[0].querySelector('.monitor-wrapper')?.addEventListener('click', () => {
      mainWin = openWindow('/main', mainWin, 1920, 1080)
    })
  }

  if (monitorGroups.length >= 2) {
    // Confidence
    monitorGroups[1].querySelector('.monitor-wrapper')?.addEventListener('click', () => {
      confidenceWin = openWindow('/confidence', confidenceWin, 1920, 1080)
    })
  }

  if (monitorGroups.length >= 3) {
    // Lower Thirds
    monitorGroups[2].querySelector('.monitor-wrapper')?.addEventListener('click', () => {
      thirdsWin = openWindow('/thirds', thirdsWin, 1920, 1080)
    })
  }

  // Focus All Button
  document.getElementById('focus-all-btn')?.addEventListener('click', () => {
    if (mainWin && !mainWin.closed) mainWin.focus()
    if (confidenceWin && !confidenceWin.closed) confidenceWin.focus()
    if (thirdsWin && !thirdsWin.closed) thirdsWin.focus()
  })

  // Init Full Screen Button
  const fsBtn = document.getElementById('data-screen-btn')
  fsBtn?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      fsBtn.innerHTML = ICONS.minimize
      fsBtn.title = 'Exit Full Screen'
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        fsBtn.innerHTML = ICONS.maximize
        fsBtn.title = 'Full Screen'
      }
    }
  })

  // Listen for fullscreen change events (ESCN etc)
  document.addEventListener('fullscreenchange', () => {
    if (fsBtn) {
      if (document.fullscreenElement) {
        fsBtn.innerHTML = ICONS.minimize
        fsBtn.title = 'Exit Full Screen'
      } else {
        fsBtn.innerHTML = ICONS.maximize
        fsBtn.title = 'Full Screen'
      }
    }
  })
}

function toggleMonitor(monitor: 'main' | 'confidence' | 'thirds'): void {
  const settings = { ...state.layoutSettings }

  switch (monitor) {
    case 'main':
      settings.mainMonitorEnabled = !isMonitorEnabled('main')
      break
    case 'confidence':
      settings.confidenceMonitorEnabled = !isMonitorEnabled('confidence')
      break
    case 'thirds':
      settings.lowerThirdsMonitorEnabled = !isMonitorEnabled('thirds')
      break
  }

  saveLayoutSettings(settings)
  updateMonitorDisplay(monitor)
}

function toggleStaticMode(): void {
  const settings = { ...state.layoutSettings }
  settings.mainProjectionStaticMode = !isStaticModeEnabled()
  saveLayoutSettings(settings)
  updateMonitorDisplay('main')
}

function updateMonitorDisplay(monitor: 'main' | 'confidence' | 'thirds'): void {
  const group = document.querySelector(`.monitor-group[data-monitor="${monitor}"]`)
  if (!group) return

  const wrapper = group.querySelector('.monitor-wrapper') as HTMLElement
  const toggleBtn = group.querySelector('.monitor-toggle')
  const staticBtn = group.querySelector('.static-mode-btn')

  if (!wrapper) return

  const enabled = isMonitorEnabled(monitor)
  const staticMode = monitor === 'main' && isStaticModeEnabled()

  // Update toggle button state
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', enabled)
    toggleBtn.setAttribute('title', enabled ? 'Disable Monitor' : 'Enable Monitor')
  }

  // Update static mode button state (only for main)
  if (staticBtn) {
    staticBtn.classList.toggle('active', staticMode)
    staticBtn.setAttribute('title', staticMode ? 'Disable Static Mode' : 'Enable Static Mode (saves GPU)')
  }

  // Get resolution for this monitor
  let res: { width: number; height: number }
  let path: string

  switch (monitor) {
    case 'main':
      res = RES_16_9
      path = '/main'
      break
    case 'confidence':
      res = getConfidenceResolution()
      path = '/confidence'
      break
    case 'thirds':
      res = RES_16_9
      path = '/thirds'
      break
  }

  // Update data attributes
  wrapper.setAttribute('data-width', String(res.width))
  wrapper.setAttribute('data-height', String(res.height))

  // Update wrapper content (this replaces iframe - necessary for enable/disable toggle)
  wrapper.innerHTML = renderMonitorContent(path, res, enabled, monitor === 'main' ? staticMode : undefined)

  // Re-observe for resize if iframe exists
  const iframe = wrapper.querySelector('iframe') as HTMLElement
  if (iframe) {
    const width = wrapper.clientWidth
    const scale = width / res.width
    iframe.style.width = `${res.width}px`
    iframe.style.height = `${res.height}px`
    iframe.style.transform = `scale(${scale})`
  }
}
