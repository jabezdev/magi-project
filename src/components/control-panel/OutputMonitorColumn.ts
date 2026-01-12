import { ICONS } from '../../constants/icons'
import { renderStatusIndicator, initStatusIndicatorListener } from './StatusIndicator'
import { openSettings } from '../settings'


// Base resolutions for scaling
// We use a decent desktop resolution so the layout isn't mobile-optimized
const RES_16_9 = { width: 1920, height: 1080 }
const RES_4_3 = { width: 1920, height: 1440 }

export function renderOutputMonitorColumn(): string {
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
        <div class="monitor-group">
          <div class="monitor-label">Main Projection</div>
          <div class="monitor-wrapper ratio-16-9" data-width="${RES_16_9.width}" data-height="${RES_16_9.height}">
            <iframe src="/main" scrolling="no" class="monitor-frame" style="width: ${RES_16_9.width}px; height: ${RES_16_9.height}px;"></iframe>
          </div>
        </div>

        <!-- Confidence Monitor (4:3) -->
        <div class="monitor-group">
          <div class="monitor-label">Confidence</div>
          <div class="monitor-wrapper ratio-4-3" data-width="${RES_4_3.width}" data-height="${RES_4_3.height}">
            <iframe src="/confidence" scrolling="no" class="monitor-frame" style="width: ${RES_4_3.width}px; height: ${RES_4_3.height}px;"></iframe>
          </div>
        </div>

        <!-- Lower Thirds (16:9) -->
        <div class="monitor-group">
          <div class="monitor-label">Lower Thirds</div>
          <div class="monitor-wrapper ratio-16-9" data-width="${RES_16_9.width}" data-height="${RES_16_9.height}">
            <iframe src="/thirds" scrolling="no" class="monitor-frame" style="width: ${RES_16_9.width}px; height: ${RES_16_9.height}px;"></iframe>
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
