import { state } from '../state'
import type { Song, SlidePosition } from '../types'
import { getAllSlides } from '../utils/slides'
import { updateHTML } from '../utils/dom'

let clockInterval: number | null = null

export function buildConfidenceMonitorHTML(): string {
    const { displayMode, liveSong, liveVariation, livePosition, confidenceMonitorSettings } = state

    // Build inline styles from settings
    const cmStyles = `
    --cm-font-size: ${confidenceMonitorSettings.fontSize}rem;
    --cm-font-family: ${confidenceMonitorSettings.fontFamily};
    --cm-line-height: ${confidenceMonitorSettings.lineHeight};
    --cm-prev-next-opacity: ${confidenceMonitorSettings.prevNextOpacity};
  `

    return `
    <div class="confidence-screen" style="${cmStyles}">
      <nav class="cm-navbar">
        <div class="cm-clock" id="cm-clock"></div>
      </nav>
      <div class="cm-teleprompter">
        ${buildTeleprompterContent(liveSong, liveVariation, livePosition, displayMode)}
      </div>
      <button class="fullscreen-btn" title="Toggle Fullscreen">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
      </button>
    </div>
  `
}

function buildTeleprompterContent(song: Song | null, variation: number, position: SlidePosition, displayMode: string): string {
    // Handle special display modes
    if (displayMode === 'black') {
        return '<div class="mode-overlay black"><span>BLACK</span></div>'
    }
    if (displayMode === 'clear') {
        return '<div class="mode-overlay clear"><span>CLEAR</span></div>'
    }
    if (displayMode === 'logo') {
        return '<div class="mode-overlay logo"><span>LOGO</span></div>'
    }

    if (!song) {
        return '<div class="cm-empty">No song loaded</div>'
    }

    // Get all slides for the arrangement
    const allSlides = getAllSlides(song, variation)

    // Find current slide index in flat list
    let currentFlatIndex = 0
    for (let i = 0; i < allSlides.length; i++) {
        if (allSlides[i].position.partIndex === position.partIndex &&
            allSlides[i].position.slideIndex === position.slideIndex) {
            currentFlatIndex = i
            break
        }
    }

    const prevSlide = currentFlatIndex > 0 ? allSlides[currentFlatIndex - 1] : null
    const currentSlide = allSlides[currentFlatIndex]
    const nextSlide = currentFlatIndex < allSlides.length - 1 ? allSlides[currentFlatIndex + 1] : null

    return `
    <div class="teleprompter-scroll" data-slide-index="${currentFlatIndex}">
      ${prevSlide ? `
        <div class="tp-slide tp-prev">
          <div class="tp-part-indicator"><span>${prevSlide.partLabel}</span></div>
          <div class="tp-content">
            <div class="tp-text">${prevSlide.text.replace(/\n/g, '<br>')}</div>
          </div>
        </div>
      ` : '<div class="tp-slide tp-prev tp-empty"></div>'}
      
      <div class="tp-slide tp-current">
        <div class="tp-part-indicator"><span>${currentSlide?.partLabel || ''}</span></div>
        <div class="tp-content">
          <div class="tp-text">${currentSlide?.text.replace(/\n/g, '<br>') || ''}</div>
        </div>
      </div>
      
      ${nextSlide ? `
        <div class="tp-slide tp-next">
          <div class="tp-part-indicator"><span>${nextSlide.partLabel}</span></div>
          <div class="tp-content">
            <div class="tp-text">${nextSlide.text.replace(/\n/g, '<br>')}</div>
          </div>
        </div>
      ` : '<div class="tp-slide tp-next tp-empty"></div>'}
    </div>
  `
}

export function startClock(): void {
    if (clockInterval) {
        clearInterval(clockInterval)
    }

    const updateClock = () => {
        const clockEl = document.getElementById('cm-clock')
        if (clockEl) {
            const now = new Date()
            const hours = now.getHours().toString().padStart(2, '0')
            const minutes = now.getMinutes().toString().padStart(2, '0')
            const seconds = now.getSeconds().toString().padStart(2, '0')
            clockEl.textContent = `${hours}:${minutes}:${seconds}`
        }
    }

    updateClock()
    clockInterval = window.setInterval(updateClock, 1000)
}

export function stopClock(): void {
    if (clockInterval) {
        clearInterval(clockInterval)
        clockInterval = null
    }
}

export function updateTeleprompterContent(): void {
    const { displayMode, liveSong, liveVariation, livePosition } = state
    const teleprompter = document.querySelector('.cm-teleprompter')

    if (teleprompter) {
        updateHTML(teleprompter, buildTeleprompterContent(liveSong, liveVariation, livePosition, displayMode))
    }
}

export function updateConfidenceMonitorStyles(): void {
    const { confidenceMonitorSettings } = state
    const screen = document.querySelector('.confidence-screen') as HTMLElement

    if (screen) {
        screen.style.setProperty('--cm-font-size', `${confidenceMonitorSettings.fontSize}rem`)
        screen.style.setProperty('--cm-font-family', confidenceMonitorSettings.fontFamily)
        screen.style.setProperty('--cm-line-height', String(confidenceMonitorSettings.lineHeight))
        screen.style.setProperty('--cm-prev-next-opacity', String(confidenceMonitorSettings.prevNextOpacity))
    }
}
