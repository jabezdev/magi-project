import { state } from '../state'
import type { DisplaySettings } from '../types'
import { getSlideText } from '../utils/slides'
import { updateHTML, updateVideoSource } from '../utils/dom'
import { socketService } from '../services/socket'

export function buildMainProjectionHTML(): string {
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
          ${formatLyricsText(lyricsText)}
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

export function updateDisplayMode(): void {
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
          ${formatLyricsText(lyricsText)}
        </div>
      `
            break
    }

    // Use View Transition API if available
    if (document.startViewTransition) {
        document.startViewTransition(() => {
            updateHTML(overlay, contentHTML)
        })
    } else {
        updateHTML(overlay, contentHTML)
    }

    // Re-setup video autoplay for logo if it's a video
    if (displayMode === 'logo') {
        setupVideoAutoplay()
    }
}

export function updateBackgroundVideo(): void {
    const video = document.querySelector('.background-video') as HTMLVideoElement
    updateVideoSource(video, state.backgroundVideo)
}

export function updateLyricsDisplay(): void {
    const { displayMode, liveSong, liveVariation, livePosition } = state
    const lyricsEl = document.querySelector('.lyrics-display')

    if (lyricsEl && displayMode === 'lyrics' && liveSong) {
        const lyricsText = getSlideText(liveSong, liveVariation, livePosition) || ''

        // Use View Transition API if available
        if (document.startViewTransition) {
            document.startViewTransition(() => {
                updateHTML(lyricsEl, formatLyricsText(lyricsText))
            })
        } else {
            updateHTML(lyricsEl, formatLyricsText(lyricsText))
        }
    }
}

export function updateLyricsStyle(): void {
    const { displaySettings } = state
    const lyricsEl = document.querySelector('.lyrics-display') as HTMLElement

    if (lyricsEl) {
        // We can't easily parse current styles back to displaySettings to update gracefully without re-render or complex DOM manip
        // For simplicity, we just update the style attribute whole if we use buildLyricsStyleString logic
        // OR apply individual properties. Let's use individual props for better perf in update.

        // Actually the logic to apply individual props is more robust
        elApplyLyricsStyles(lyricsEl, displaySettings)
    }

    // Also update margin markers if visible
    updateMarginMarkers()
}

export function updateLogoMedia(): void {
    if (state.displayMode === 'logo') {
        updateDisplayMode()
    }
}

// Helpers

function elApplyLyricsStyles(el: HTMLElement, ds: DisplaySettings): void {
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

function buildLogoHTML(logoMedia: string): string {
    const isVideo = logoMedia.endsWith('.mp4') || logoMedia.endsWith('.webm') || logoMedia.endsWith('.mov')

    if (isVideo) {
        return `<video class="logo-media" src="${logoMedia}" autoplay loop muted playsinline></video>`
    } else {
        return `<img class="logo-media" src="${logoMedia}" alt="Logo" />`
    }
}

function formatLyricsText(text: string): string {
    if (!text) return ''
    return text.split('\n').map(line => `<div class="lyric-line">${line}</div>`).join('')
}

export function setupMarginMarkersListener(): void {
    socketService.on('margin-markers', (data: unknown) => {
        const { visible } = data as { visible: boolean }
        toggleMarginMarkers(visible)
    })
}

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

export function setupVideoAutoplay(): void {
    const videos = document.querySelectorAll('video')

    videos.forEach(video => {
        // Try to play immediately
        video.play().catch(() => {
            // If autoplay fails, try again on user interaction
            document.addEventListener('click', () => video.play(), { once: true })
        })
    })
}
