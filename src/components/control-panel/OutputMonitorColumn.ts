import { ICONS } from '../../constants/icons'

// Base resolutions for scaling
// We use a decent desktop resolution so the layout isn't mobile-optimized
const RES_16_9 = { width: 1920, height: 1080 }
const RES_4_3 = { width: 1920, height: 1440 }

export function renderOutputMonitorColumn(): string {
  return `
    <div class="cp-column cp-monitors">
      <div class="cp-column-header">
        <div class="header-left">
          <span class="header-icon">${ICONS.monitor}</span>
          <span>OUTPUTS</span>
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
}
