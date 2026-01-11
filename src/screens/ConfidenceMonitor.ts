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
    --cm-clock-size: ${confidenceMonitorSettings.clockSize}rem;
    --cm-margin-top: ${confidenceMonitorSettings.marginTop}rem;
    --cm-margin-bottom: ${confidenceMonitorSettings.marginBottom}rem;
    --cm-margin-left: ${confidenceMonitorSettings.marginLeft}rem;
    --cm-margin-right: ${confidenceMonitorSettings.marginRight}rem;
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
    // Build mode overlay for non-lyrics modes
    let modeOverlay = ''
    if (displayMode === 'black') {
        modeOverlay = '<div class="mode-overlay black"><span>BLACK</span></div>'
    } else if (displayMode === 'clear') {
        modeOverlay = '<div class="mode-overlay clear"><span>CLEAR</span></div>'
    } else if (displayMode === 'logo') {
        modeOverlay = '<div class="mode-overlay logo"><span>LOGO</span></div>'
    }

    if (!song) {
        return modeOverlay + '<div class="cm-empty">No song loaded</div>'
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

    // Build all slides for smooth scrolling teleprompter
    const slidesHTML = allSlides.map((slide, index) => {
        let slideClass = 'tp-slide'
        if (index < currentFlatIndex) {
            slideClass += ' tp-past'
        } else if (index === currentFlatIndex) {
            slideClass += ' tp-current'
        } else {
            slideClass += ' tp-future'
        }

        return `
      <div class="${slideClass}" data-index="${index}" id="tp-slide-${index}">
        <div class="tp-part-indicator"><span>${slide.partLabel}</span></div>
        <div class="tp-content">
          <div class="tp-text">${slide.text.replace(/\n/g, '<br>')}</div>
        </div>
      </div>
    `
    }).join('')

    return `
    ${modeOverlay}
    <div class="teleprompter-scroll" data-current-index="${currentFlatIndex}" data-song-id="${song.id}">
      <div class="tp-spacer-top"></div>
      ${slidesHTML}
      <div class="tp-spacer-bottom"></div>
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
    const existingScroll = teleprompter?.querySelector('.teleprompter-scroll')

    if (!teleprompter) return

    // Check if song changed - need full rebuild of lyrics
    const currentSongId = existingScroll?.getAttribute('data-song-id')
    const newSongId = liveSong?.id?.toString() || ''
    const songChanged = !existingScroll || currentSongId !== newSongId

    // Always update mode overlay
    updateModeOverlay(teleprompter, displayMode)

    if (songChanged) {
        updateHTML(teleprompter, buildTeleprompterContent(liveSong, liveVariation, livePosition, displayMode))
        // After rebuild, scroll to current slide
        scrollToCurrentSlide()
    } else {
        // Just update slide classes and scroll
        updateSlideClasses(livePosition)
        scrollToCurrentSlide()
    }
}

function updateModeOverlay(teleprompter: Element, displayMode: string): void {
    // Remove existing overlay
    const existingOverlay = teleprompter.querySelector('.mode-overlay')
    if (existingOverlay) {
        existingOverlay.remove()
    }

    // Add new overlay if not in lyrics mode
    if (displayMode === 'black') {
        teleprompter.insertAdjacentHTML('afterbegin', '<div class="mode-overlay black"><span>BLACK</span></div>')
    } else if (displayMode === 'clear') {
        teleprompter.insertAdjacentHTML('afterbegin', '<div class="mode-overlay clear"><span>CLEAR</span></div>')
    } else if (displayMode === 'logo') {
        teleprompter.insertAdjacentHTML('afterbegin', '<div class="mode-overlay logo"><span>LOGO</span></div>')
    }
}

function updateSlideClasses(position: SlidePosition): void {
    const { liveSong, liveVariation } = state
    if (!liveSong) return

    const allSlides = getAllSlides(liveSong, liveVariation)
    
    // Find current slide index
    let currentFlatIndex = 0
    for (let i = 0; i < allSlides.length; i++) {
        if (allSlides[i].position.partIndex === position.partIndex &&
            allSlides[i].position.slideIndex === position.slideIndex) {
            currentFlatIndex = i
            break
        }
    }

    // Update all slide classes
    document.querySelectorAll('.tp-slide').forEach((slide, index) => {
        slide.classList.remove('tp-past', 'tp-current', 'tp-future')
        if (index < currentFlatIndex) {
            slide.classList.add('tp-past')
        } else if (index === currentFlatIndex) {
            slide.classList.add('tp-current')
        } else {
            slide.classList.add('tp-future')
        }
    })

    // Update data attribute
    const scrollContainer = document.querySelector('.teleprompter-scroll')
    if (scrollContainer) {
        scrollContainer.setAttribute('data-current-index', String(currentFlatIndex))
    }
}

function scrollToCurrentSlide(): void {
    requestAnimationFrame(() => {
        const currentSlide = document.querySelector('.tp-slide.tp-current')
        const teleprompter = document.querySelector('.cm-teleprompter')
        
        if (currentSlide && teleprompter) {
            currentSlide.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            })
        }
    })
}

export function updateConfidenceMonitorStyles(): void {
    const { confidenceMonitorSettings } = state
    const screen = document.querySelector('.confidence-screen') as HTMLElement

    if (screen) {
        screen.style.setProperty('--cm-font-size', `${confidenceMonitorSettings.fontSize}rem`)
        screen.style.setProperty('--cm-font-family', confidenceMonitorSettings.fontFamily)
        screen.style.setProperty('--cm-line-height', String(confidenceMonitorSettings.lineHeight))
        screen.style.setProperty('--cm-prev-next-opacity', String(confidenceMonitorSettings.prevNextOpacity))
        screen.style.setProperty('--cm-clock-size', `${confidenceMonitorSettings.clockSize}rem`)
        screen.style.setProperty('--cm-margin-top', `${confidenceMonitorSettings.marginTop}rem`)
        screen.style.setProperty('--cm-margin-bottom', `${confidenceMonitorSettings.marginBottom}rem`)
        screen.style.setProperty('--cm-margin-left', `${confidenceMonitorSettings.marginLeft}rem`)
        screen.style.setProperty('--cm-margin-right', `${confidenceMonitorSettings.marginRight}rem`)
    }
}
