/**
 * Projection Screen
 * 
 * Renders the main projection or confidence monitor display.
 * Uses efficient DOM updates to avoid recreating video elements.
 */

import type { ScreenType, SlidePosition, Song, DisplaySettings } from '../types'
import { state, subscribeToState, StateChangeKey } from '../state'
import { getSlideText, getAllSlides } from '../utils/slides'
import { updateHTML, updateVideoSource } from '../utils/dom'
import { socketService } from '../services/socket'

// Clock update interval
let clockInterval: number | null = null
// State subscription cleanup
let unsubscribe: (() => void) | null = null
// Track if initial render is done
let isInitialized = false

/**
 * Render the projection screen (main projection or confidence monitor)
 */
export function renderProjectionScreen(screenType: ScreenType): void {
  const app = document.getElementById('app')
  if (!app) return

  const isConfidenceMonitor = screenType === 'confidence-monitor'
  
  // Clean up previous subscriptions
  cleanup()
  
  // Initial full render (only on first load or screen type change)
  if (isConfidenceMonitor) {
    app.innerHTML = buildConfidenceMonitorHTML()
    startClock()
    setupConfidenceMonitorUpdates()
  } else {
    app.innerHTML = buildMainProjectionHTML()
    setupMainProjectionUpdates()
    setupMarginMarkersListener()
  }
  
  // Setup video autoplay and fullscreen button
  setupVideoAutoplay()
  setupFullscreenButton()
  isInitialized = true
}

/**
 * Cleanup function for when component unmounts
 */
function cleanup(): void {
  if (clockInterval) {
    clearInterval(clockInterval)
    clockInterval = null
  }
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
  isInitialized = false
}

/**
 * Setup efficient updates for main projection screen
 */
function setupMainProjectionUpdates(): void {
  unsubscribe = subscribeToState((changedKeys: StateChangeKey[]) => {
    if (!isInitialized) return
    
    // Update only what changed
    if (changedKeys.includes('live') || changedKeys.includes('displayMode')) {
      updateLyricsDisplay()
    }
    if (changedKeys.includes('backgroundVideo')) {
      updateBackgroundVideo()
    }
    if (changedKeys.includes('displayMode')) {
      updateDisplayMode()
    }
    if (changedKeys.includes('displaySettings')) {
      updateLyricsStyle()
    }
    if (changedKeys.includes('logoMedia')) {
      updateLogoMedia()
    }
  })
}

/**
 * Setup efficient updates for confidence monitor
 */
function setupConfidenceMonitorUpdates(): void {
  unsubscribe = subscribeToState((changedKeys: StateChangeKey[]) => {
    if (!isInitialized) return
    
    // Update teleprompter content when live state changes
    if (changedKeys.includes('live') || changedKeys.includes('displayMode')) {
      updateTeleprompterContent()
    }
    
    // Update styles when confidence monitor settings change
    if (changedKeys.includes('confidenceMonitorSettings')) {
      updateConfidenceMonitorStyles()
    }
  })
}

/**
 * Update confidence monitor styles (font, size, opacity)
 */
function updateConfidenceMonitorStyles(): void {
  const { confidenceMonitorSettings } = state
  const screen = document.querySelector('.confidence-screen') as HTMLElement
  
  if (screen) {
    screen.style.setProperty('--cm-font-size', `${confidenceMonitorSettings.fontSize}rem`)
    screen.style.setProperty('--cm-font-family', confidenceMonitorSettings.fontFamily)
    screen.style.setProperty('--cm-line-height', String(confidenceMonitorSettings.lineHeight))
    screen.style.setProperty('--cm-prev-next-opacity', String(confidenceMonitorSettings.prevNextOpacity))
  }
}

/**
 * Update only the lyrics display content
 */
function updateLyricsDisplay(): void {
  const { displayMode, liveSong, liveVariation, livePosition } = state
  const lyricsEl = document.querySelector('.lyrics-display')
  
  if (lyricsEl && displayMode === 'lyrics' && liveSong) {
    const lyricsText = getSlideText(liveSong, liveVariation, livePosition) || ''
    updateHTML(lyricsEl, formatLyricsText(lyricsText))
  }
}

/**
 * Update the lyrics styling
 */
function updateLyricsStyle(): void {
  const { displaySettings } = state
  const lyricsEl = document.querySelector('.lyrics-display') as HTMLElement
  
  if (lyricsEl) {
    applyLyricsStyles(lyricsEl, displaySettings)
  }
  
  // Also update margin markers if visible
  updateMarginMarkers()
}

/**
 * Apply lyrics styles to an element
 */
function applyLyricsStyles(el: HTMLElement, ds: DisplaySettings): void {
  el.style.fontSize = `${ds.fontSize}rem`
  el.style.fontFamily = ds.fontFamily
  el.style.lineHeight = String(ds.lineHeight)
  el.style.color = ds.textColor
  el.style.textTransform = ds.allCaps ? 'uppercase' : 'none'
  el.style.padding = `${ds.marginTop}% ${ds.marginRight}% ${ds.marginBottom}% ${ds.marginLeft}%`
  
  // Text shadow
  if (ds.textShadow) {
    el.style.textShadow = `${ds.shadowOffsetX}px ${ds.shadowOffsetY}px ${ds.shadowBlur}px rgba(0, 0, 0, 0.8)`
  } else {
    el.style.textShadow = 'none'
  }
  
  // Text outline using text-stroke
  if (ds.textOutline) {
    el.style.webkitTextStroke = `${ds.outlineWidth}px ${ds.outlineColor}`
  } else {
    el.style.webkitTextStroke = 'none'
  }
}

/**
 * Build inline style string for lyrics
 */
function buildLyricsStyleString(ds: DisplaySettings): string {
  const shadowStyle = ds.textShadow 
    ? `text-shadow: ${ds.shadowOffsetX}px ${ds.shadowOffsetY}px ${ds.shadowBlur}px rgba(0, 0, 0, 0.8);`
    : ''
  const outlineStyle = ds.textOutline
    ? `-webkit-text-stroke: ${ds.outlineWidth}px ${ds.outlineColor};`
    : ''
  
  return `
    font-size: ${ds.fontSize}rem;
    font-family: ${ds.fontFamily};
    line-height: ${ds.lineHeight};
    color: ${ds.textColor};
    text-transform: ${ds.allCaps ? 'uppercase' : 'none'};
    padding: ${ds.marginTop}% ${ds.marginRight}% ${ds.marginBottom}% ${ds.marginLeft}%;
    ${shadowStyle}
    ${outlineStyle}
  `
}

/**
 * Update background video without recreating element
 */
function updateBackgroundVideo(): void {
  const video = document.querySelector('.background-video') as HTMLVideoElement
  updateVideoSource(video, state.backgroundVideo)
}

/**
 * Update display mode (lyrics, logo, black, clear)
 */
function updateDisplayMode(): void {
  const { displayMode, liveSong, liveVariation, livePosition, logoMedia, displaySettings } = state
  const overlay = document.querySelector('.content-overlay')
  
  if (!overlay) return
  
  // Update overlay classes
  overlay.className = `content-overlay ${displayMode}`
  
  // Update content based on mode
  let contentHTML = ''
  
  switch (displayMode) {
    case 'black':
      contentHTML = '<div class="black-screen"></div>'
      break
    case 'clear':
      contentHTML = ''
      break
    case 'logo':
      contentHTML = buildLogoHTML(logoMedia)
      break
    case 'lyrics':
    default:
      let lyricsText = ''
      if (liveSong) {
        lyricsText = getSlideText(liveSong, liveVariation, livePosition) || ''
      }
      const lyricsStyle = buildLyricsStyleString(displaySettings)
      contentHTML = `
        <div class="lyrics-display" style="${lyricsStyle}">
          ${formatLyricsText(lyricsText, displaySettings)}
        </div>
      `
      break
  }
  
  updateHTML(overlay, contentHTML)
  
  // Re-setup video autoplay for logo if it's a video
  if (displayMode === 'logo') {
    setupVideoAutoplay()
  }
}

/**
 * Update logo media
 */
function updateLogoMedia(): void {
  if (state.displayMode === 'logo') {
    updateDisplayMode()
  }
}

/**
 * Update teleprompter content for confidence monitor
 */
function updateTeleprompterContent(): void {
  const { displayMode, liveSong, liveVariation, livePosition } = state
  const teleprompter = document.querySelector('.cm-teleprompter')
  
  if (teleprompter) {
    updateHTML(teleprompter, buildTeleprompterContent(liveSong, liveVariation, livePosition, displayMode))
  }
}

/**
 * Build the main projection screen HTML
 */
function buildMainProjectionHTML(): string {
  const { displayMode, liveSong, liveVariation, livePosition, backgroundVideo, logoMedia, displaySettings } = state
  
  // Get current lyrics text
  let lyricsText = ''
  if (liveSong && displayMode === 'lyrics') {
    lyricsText = getSlideText(liveSong, liveVariation, livePosition) || ''
  }
  
  // Build inline styles for lyrics
  const lyricsStyle = buildLyricsStyleString(displaySettings)
  
  // Determine what to show based on display mode
  let contentHTML = ''
  
  switch (displayMode) {
    case 'black':
      contentHTML = '<div class="black-screen"></div>'
      break
    case 'clear':
      contentHTML = '' // Just show the video background
      break
    case 'logo':
      contentHTML = buildLogoHTML(logoMedia)
      break
    case 'lyrics':
    default:
      contentHTML = `
        <div class="lyrics-display" style="${lyricsStyle}">
          ${formatLyricsText(lyricsText, displaySettings)}
        </div>
      `
      break
  }
  
  return `
    <div class="projection-screen main-projection">
      <video class="background-video" src="${backgroundVideo}" autoplay loop muted playsinline></video>
      <div class="content-overlay ${displayMode}">
        ${contentHTML}
      </div>
      <button class="fullscreen-btn" title="Toggle Fullscreen">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
      </button>
    </div>
  `
}

/**
 * Build the confidence monitor HTML with teleprompter-style display
 */
function buildConfidenceMonitorHTML(): string {
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

/**
 * Build teleprompter content - shows current slide prominently with prev/next peeking
 */
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

/**
 * Build logo display HTML
 */
function buildLogoHTML(logoMedia: string): string {
  const isVideo = logoMedia.endsWith('.mp4') || logoMedia.endsWith('.webm') || logoMedia.endsWith('.mov')
  
  if (isVideo) {
    return `<video class="logo-media" src="${logoMedia}" autoplay loop muted playsinline></video>`
  } else {
    return `<img class="logo-media" src="${logoMedia}" alt="Logo" />`
  }
}

/**
 * Format lyrics text with line breaks
 */
function formatLyricsText(text: string, ds?: DisplaySettings): string {
  if (!text) return ''
  return text.split('\n').map(line => `<div class="lyric-line">${line}</div>`).join('')
}

/**
 * Update margin markers overlay
 */
function updateMarginMarkers(): void {
  const { displaySettings } = state
  const markers = document.querySelector('.margin-markers') as HTMLElement
  
  if (markers) {
    markers.innerHTML = `
      <div class="margin-marker top" style="height: ${displaySettings.marginTop}%"></div>
      <div class="margin-marker bottom" style="height: ${displaySettings.marginBottom}%"></div>
      <div class="margin-marker left" style="width: ${displaySettings.marginLeft}%"></div>
      <div class="margin-marker right" style="width: ${displaySettings.marginRight}%"></div>
    `
  }
}

/**
 * Show/hide margin markers
 */
function toggleMarginMarkers(visible: boolean): void {
  const screen = document.querySelector('.projection-screen')
  if (!screen) return
  
  let markers = screen.querySelector('.margin-markers')
  
  if (visible) {
    if (!markers) {
      markers = document.createElement('div')
      markers.className = 'margin-markers'
      screen.appendChild(markers)
    }
    updateMarginMarkers()
  } else {
    if (markers) {
      markers.remove()
    }
  }
}

/**
 * Setup margin markers listener
 */
function setupMarginMarkersListener(): void {
  socketService.on('margin-markers', (data: unknown) => {
    const { visible } = data as { visible: boolean }
    toggleMarginMarkers(visible)
  })
}

/**
 * Start the clock update for confidence monitor
 */
function startClock(): void {
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

/**
 * Setup video autoplay (needed due to browser restrictions)
 */
function setupVideoAutoplay(): void {
  const videos = document.querySelectorAll('video')
  
  videos.forEach(video => {
    // Try to play immediately
    video.play().catch(() => {
      // If autoplay fails, try again on user interaction
      document.addEventListener('click', () => video.play(), { once: true })
    })
  })
}

/**
 * Setup fullscreen button functionality
 */
function setupFullscreenButton(): void {
  const btn = document.querySelector('.fullscreen-btn')
  if (!btn) return
  
  btn.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  })
}
