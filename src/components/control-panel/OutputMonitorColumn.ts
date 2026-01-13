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
    // monitor-disabled
    return `<div class="flex flex-col items-center justify-center gap-2 w-full h-full bg-bg-tertiary text-text-muted text-xs font-medium uppercase tracking-[0.5px]"><span class="w-6 h-6 opacity-50">${ICONS.power}</span><span>Display Off</span></div>`
  }

  // For static mode, add query param so MainProjection uses thumbnail instead of video
  const src = staticMode ? `${path}?static=1` : path

  // monitor-frame
  return `<iframe src="${src}" scrolling="no" class="absolute top-0 left-0 border-none origin-top-left pointer-events-none bg-black" style="width: ${res.width}px; height: ${res.height}px;"></iframe>`
}

export function renderOutputMonitorColumn(): string {
  const mainEnabled = isMonitorEnabled('main')
  const confidenceEnabled = isMonitorEnabled('confidence')
  const thirdsEnabled = isMonitorEnabled('thirds')
  const staticMode = isStaticModeEnabled()
  const confidenceRes = getConfidenceResolution()

  // Inline Tailwind Classes
  const columnClass = "flex flex-col bg-bg-primary overflow-hidden min-w-0 min-w-[200px] bg-bg-secondary cp-monitors"
  const headerClass = "flex flex-row items-center justify-between gap-0 p-0 h-[2.2rem] min-h-[2.2rem] bg-bg-secondary border-b border-border-color shrink-0 text-[0.85rem]"
  const headerLeft = "flex items-center h-full px-2 gap-2"
  const headerIconClass = "w-[14px] h-[14px] opacity-70"
  const headerRight = "flex items-center h-full gap-0 pr-0"
  const statusWrapper = "flex items-center px-3 h-full"
  const flushBtnClass = "h-full w-[2.2rem] border-l border-border-color rounded-none m-0 p-0 bg-transparent flex items-center justify-center text-text-secondary transition-colors duration-200 hover:bg-bg-hover hover:text-text-primary"

  const columnBodyClass = "flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-4 p-4 bg-bg-tertiary [&::-webkit-scrollbar]:hidden"
  const monitorGroupClass = "flex flex-col gap-1 monitor-group"
  const monitorLabelClass = "flex items-center gap-2 text-[0.7rem] font-semibold text-text-muted uppercase tracking-[0.5px] h-5"

  // toggle-switch
  const toggleSwitchClass = "relative inline-block w-8 h-[18px] shrink-0 toggle-switch"
  // monitor-wrapper
  const monitorWrapperClass = "w-full relative overflow-hidden bg-black rounded-sm shadow-sm border border-border-color cursor-pointer transition-all duration-200 hover:border-accent-primary hover:shadow-[0_0_0_2px_rgba(59,130,246,0.2)] monitor-wrapper"

  return `
    <div class="${columnClass}">
      <div class="${headerClass} cp-column-header horizontal-layout compact-header">
        <div class="${headerLeft}">
          <span class="${headerIconClass}">${ICONS.monitor}</span>
          <span class="font-semibold uppercase tracking-[0.5px] text-text-secondary">OUTPUTS</span>
        </div>
        <div class="flex-1 flex items-center justify-center h-full min-w-0 p-0"></div>
        <div class="${headerRight}">
          <div class="${statusWrapper}">${renderStatusIndicator()}</div>
          <button class="${flushBtnClass} flush-btn" id="focus-all-btn" title="Focus All Windows" style="border-left-width: 1px !important;">${ICONS.target}</button>
          <button class="${flushBtnClass} flush-btn" id="data-screen-btn" title="Full Screen" style="border-left-width: 1px !important;">${ICONS.maximize}</button>
          <button class="${flushBtnClass} flush-btn" id="settings-btn" title="Settings" style="border-left-width: 1px !important;">${ICONS.settings}</button>
        </div>
      </div>
      <div class="${columnBodyClass}" style="scrollbar-width: none;">
        
        <!-- Main Projection (16:9) -->
        <div class="${monitorGroupClass}" data-monitor="main">
          <div class="${monitorLabelClass}">
            <label class="${toggleSwitchClass}">
              <input type="checkbox" class="w-0 h-0 opacity-0 monitor-toggle" data-monitor="main" ${mainEnabled ? 'checked' : ''}>
              <span class="absolute inset-0 cursor-pointer ${mainEnabled ? 'bg-success' : 'bg-[#444]'} rounded transition-all duration-200 before:absolute before:content-[''] before:h-[14px] before:w-[14px] before:left-[2px] before:top-1/2 before:-translate-y-1/2 before:bg-[#888] before:rounded-[3px] before:transition-all before:duration-200 toggle-slider"></span>
            </label>
            <span class="flex-1">Main Projection</span>
            <div class="flex items-center gap-2">
               <span class="text-[0.65rem] font-bold text-text-muted">STATIC</span>
               <label class="${toggleSwitchClass} static-toggle" title="Static Mode (saves GPU)">
                 <input type="checkbox" class="w-0 h-0 opacity-0 static-mode-toggle" data-monitor="main" ${staticMode ? 'checked' : ''}>
                 <span class="absolute inset-0 cursor-pointer ${staticMode ? 'bg-orange-600' : 'bg-[#444]'} rounded transition-all duration-200 before:absolute before:content-[''] before:h-[14px] before:w-[14px] before:left-[2px] before:top-1/2 before:-translate-y-1/2 before:bg-[#888] before:rounded-[3px] before:transition-all before:duration-200 toggle-slider" style="${staticMode ? 'background-color: #ea580c !important;' : ''}"></span>
               </label>
            </div>
          </div>
          <div class="${monitorWrapperClass} aspect-video ratio-16-9" data-width="${RES_16_9.width}" data-height="${RES_16_9.height}">
            ${renderMonitorContent('/main', RES_16_9, mainEnabled, staticMode)}
          </div>
        </div>

        <!-- Confidence Monitor (4:3) -->
        <div class="${monitorGroupClass}" data-monitor="confidence">
          <div class="${monitorLabelClass}">
            <label class="${toggleSwitchClass}">
              <input type="checkbox" class="w-0 h-0 opacity-0 monitor-toggle" data-monitor="confidence" ${confidenceEnabled ? 'checked' : ''}>
              <span class="absolute inset-0 cursor-pointer bg-[#444] rounded transition-all duration-200 before:absolute before:content-[''] before:h-[14px] before:w-[14px] before:left-[2px] before:top-1/2 before:-translate-y-1/2 before:bg-[#888] before:rounded-[3px] before:transition-all before:duration-200 toggle-slider"></span>
            </label>
            <span class="flex-1">Confidence</span>
          </div>
          <div class="${monitorWrapperClass} aspect-[4/3] ratio-4-3" data-width="${confidenceRes.width}" data-height="${confidenceRes.height}">
            ${renderMonitorContent('/confidence', confidenceRes, confidenceEnabled)}
          </div>
        </div>

        <!-- Lower Thirds (16:9) -->
        <div class="${monitorGroupClass}" data-monitor="thirds">
          <div class="${monitorLabelClass}">
            <label class="${toggleSwitchClass}">
              <input type="checkbox" class="w-0 h-0 opacity-0 monitor-toggle" data-monitor="thirds" ${thirdsEnabled ? 'checked' : ''}>
              <span class="absolute inset-0 cursor-pointer bg-[#444] rounded transition-all duration-200 before:absolute before:content-[''] before:h-[14px] before:w-[14px] before:left-[2px] before:top-1/2 before:-translate-y-1/2 before:bg-[#888] before:rounded-[3px] before:transition-all before:duration-200 toggle-slider"></span>
            </label>
            <span class="flex-1">Lower Thirds</span>
          </div>
          <div class="${monitorWrapperClass} aspect-video ratio-16-9" data-width="${RES_16_9.width}" data-height="${RES_16_9.height}">
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

  // Monitor toggle checkboxes - style the slider
  document.querySelectorAll('.monitor-toggle').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation()
      const monitor = checkbox.getAttribute('data-monitor') as 'main' | 'confidence' | 'thirds'

      // Update slider style
      const slider = (checkbox as HTMLElement).nextElementSibling as HTMLElement
      if (slider) {
        if ((checkbox as HTMLInputElement).checked) {
          slider.classList.add('bg-success')
          slider.classList.remove('bg-[#444]')
        } else {
          slider.classList.remove('bg-success')
          slider.classList.add('bg-[#444]')
        }
      }

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

  // Listen for fullscreen change events (ESC etc)
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
  const staticBtn = group.querySelector('.static-mode-toggle')

  if (!wrapper) return

  const enabled = isMonitorEnabled(monitor)
  const staticMode = monitor === 'main' && isStaticModeEnabled()

  // Update toggle button state
  if (toggleBtn) {
    (toggleBtn as HTMLInputElement).checked = enabled
    toggleBtn.setAttribute('title', enabled ? 'Disable Monitor' : 'Enable Monitor')
    const slider = (toggleBtn as HTMLElement).nextElementSibling as HTMLElement
    if (slider) {
      if (enabled) {
        slider.classList.add('bg-success')
        slider.classList.remove('bg-[#444]')
      } else {
        slider.classList.remove('bg-success')
        slider.classList.add('bg-[#444]')
      }
    }
  }

  // Update static mode button state (only for main)
  if (staticBtn) {
    (staticBtn as HTMLInputElement).checked = staticMode
    const slider = (staticBtn as HTMLElement).nextElementSibling as HTMLElement
    if (slider) {
      if (staticMode) {
        slider.classList.add('bg-orange-600')
        slider.classList.remove('bg-[#444]')
        slider.style.setProperty('background-color', '#ea580c', 'important')
      } else {
        slider.classList.remove('bg-orange-600')
        slider.classList.add('bg-[#444]')
        slider.style.removeProperty('background-color')
      }
    }
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
