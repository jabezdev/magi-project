import { state } from '../state'
import type { DisplaySettings } from '../types'
import { getSlideText } from '../utils'
import { updateHTML } from '../utils'
import { socketService } from '../services'

// Check if we're in static mode (for control panel preview optimization)
function isStaticMode(): boolean {
    const params = new URLSearchParams(window.location.search)
    return params.get('static') === '1'
}

export function buildMainProjectionHTML(): string {
    const { displayMode, liveSong, liveVariation, livePosition, backgroundVideo, logoMedia, displaySettings, availableVideos } = state
    const staticMode = isStaticMode()

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
            contentHTML = '<div class="w-full h-full bg-black"></div>'
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
        <div class="flex flex-col items-center justify-center text-center text-white w-full h-full box-border will-change-contents" style="${lyricsStyle}">
          ${formatLyricsText(lyricsText)}
        </div>
      `
            break
    }

    // In static mode, use thumbnail or gradient instead of video for GPU savings
    let backgroundHTML: string
    if (staticMode) {
        // Generate thumbnail path from video path
        // Pattern: /media/video.mp4 -> /media/thumbnails/video.mp4.jpg
        let thumbnail = ''
        if (backgroundVideo) {
            // Get just the filename (e.g., "video.mp4")
            const videoFilename = backgroundVideo.split('/').pop()
            if (videoFilename) {
                thumbnail = `/media/thumbnails/${videoFilename}.jpg`
            }
        }
        // Also check availableVideos for a better match
        const currentVideo = availableVideos.find(v => v.path === backgroundVideo)
        if (currentVideo?.thumbnail) {
            thumbnail = currentVideo.thumbnail
        }

        // Use thumbnail if available, otherwise use a dark gradient
        const bgStyle = thumbnail
            ? `background-image: url('${thumbnail}'); background-size: cover; background-position: center;`
            : `background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);`

        backgroundHTML = `
      <div class="absolute inset-0 w-full h-full bg-cover bg-center z-[1]" style="${bgStyle}"></div>
    `
    } else {
        const videoClass = "absolute inset-0 w-full h-full object-cover z-[1] opacity-0 transition-opacity duration-1000 ease-in-out";
        backgroundHTML = `
      <video class="${videoClass} bg-layer-1 active opacity-100" src="${backgroundVideo}" autoplay loop muted playsinline></video>
      <video class="${videoClass} bg-layer-2" autoplay loop muted playsinline></video>
    `
    }

    // Build class and style for the overlay to ensure background colors are applied without custom CSS
    const overlayBaseClass = "absolute inset-0 flex items-center justify-center z-[2] transition-[background] duration-300 ease-in-out content-overlay";
    const overlayBgStyle = (displayMode === 'lyrics' || displayMode === 'clear') ? 'background: transparent;' : 'background: black;';

    return `
    <div class="relative w-full h-screen overflow-hidden bg-black main-projection${staticMode ? ' static-mode' : ''}" style="contain: strict;">
      ${backgroundHTML}
      <div class="${overlayBaseClass} ${displayMode}" style="${overlayBgStyle}">
        ${contentHTML}
      </div>
      <button class="fixed bottom-5 right-5 w-12 h-12 flex items-center justify-center bg-black/60 border border-white/20 rounded-lg text-white cursor-pointer z-[100] opacity-0 transition-all duration-300 ease-in-out hover:bg-black/80 hover:opacity-100 group-hover:opacity-100 fullscreen-btn flush-btn" title="Toggle Fullscreen">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
      </button>
    </div>
  `
}


export function updateDisplayMode(): void {
    const { displayMode, liveSong, liveVariation, livePosition, logoMedia, displaySettings } = state
    const overlay = document.querySelector('.content-overlay')

    if (!overlay) return

    // Update overlay classes and background
    const overlayBgStyle = (displayMode === 'lyrics' || displayMode === 'clear') ? 'transparent' : 'black';
    (overlay as HTMLElement).style.background = overlayBgStyle;
    overlay.className = `absolute inset-0 flex items-center justify-center z-[2] transition-[background] duration-300 ease-in-out content-overlay ${displayMode}`;

    // Update content based on mode
    let contentHTML = ''

    switch (displayMode) {
        case 'black':
            contentHTML = '<div class="w-full h-full bg-black"></div>'
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
        <div class="flex flex-col items-center justify-center text-center text-white w-full h-full box-border will-change-contents" style="${lyricsStyle}">
          ${formatLyricsText(lyricsText)}
        </div>
      `
            break
    }

    // Determine transition settings
    const { type, duration } = displaySettings.transitions || { type: 'crossfade', duration: 0.5 }
    const useTransition = type !== 'none'

    // Use View Transition API if available and enabled
    if (useTransition && document.startViewTransition) {
        // Set duration
        document.documentElement.style.setProperty('--view-transition-duration', `${duration}s`)

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
    // Also update static background if in static mode
    if (isStaticMode()) {
        updateStaticBackground()
        return  // Don't process video elements in static mode
    }

    const video1 = document.querySelector('.bg-layer-1') as HTMLVideoElement
    const video2 = document.querySelector('.bg-layer-2') as HTMLVideoElement

    if (!video1 || !video2) return

    // Determine active and next
    // The active one is the one visible.
    const active = video1.classList.contains('active') ? video1 : video2
    const next = video1.classList.contains('active') ? video2 : video1

    // Check if we need to change anything
    const currentSrc = next.getAttribute('src')
    if (currentSrc === state.backgroundVideo) {
        // If next is already loaded with this video, just ensure it plays and is active
        // This might happen if we rapidly switch back and forth
        if (!next.classList.contains('active')) {
            next.classList.add('active')
            active.classList.remove('active')
        }
        return
    }

    // Load new video into 'next'
    next.setAttribute('src', state.backgroundVideo)
    next.load()

    const { type, duration } = state.displaySettings.transitions || { type: 'crossfade', duration: 0.5 }
    const fadeDuration = type === 'none' ? 0 : duration

    const playAndFade = () => {
        next.play().then(() => {
            // Apply fade
            next.classList.add('active', 'opacity-100')
            next.classList.remove('opacity-0')
            // Respect duration for CSS transition too (we need to update the style inline or class)
            next.style.transition = type === 'none' ? 'none' : `opacity ${fadeDuration}s ease`

            active.classList.remove('active', 'opacity-100')
            active.classList.add('opacity-0')
        }).catch(err => {
            console.error("BG Video play failed", err)
        })
    }

    if (next.readyState >= 3) {
        playAndFade()
    } else {
        next.addEventListener('canplay', playAndFade, { once: true })
    }
}

export function updateLyricsDisplay(): void {
    const { displayMode, liveSong, liveVariation, livePosition } = state
    const lyricsEl = document.querySelector('.will-change-contents') as HTMLElement

    if (lyricsEl && displayMode === 'lyrics' && liveSong) {
        const lyricsText = getSlideText(liveSong, liveVariation, livePosition) || ''

        const updateDOM = () => {
            const lines = lyricsText ? lyricsText.split('\n') : []

            // Optimization: Recycle DOM nodes if line count matches
            // This prevents layout thrashing
            const existingLines = lyricsEl.querySelectorAll('.mb-\\[0\\.25em\\]')

            if (existingLines.length === lines.length && lines.length > 0) {
                // Smart update: just change text
                existingLines.forEach((el, i) => {
                    if (el.textContent !== lines[i]) {
                        el.textContent = lines[i]
                    }
                })
            } else {
                // Full rebuild if structure changes
                lyricsEl.innerHTML = formatLyricsText(lyricsText)
            }
        }

        // Determine transition settings
        const { displaySettings } = state
        const { type, duration } = displaySettings.transitions || { type: 'crossfade', duration: 0.5 }
        const useTransition = type !== 'none'

        if (useTransition && document.startViewTransition) {
            // Set duration
            document.documentElement.style.setProperty('--view-transition-duration', `${duration}s`)

            document.startViewTransition(() => {
                updateDOM()
            })
        } else {
            updateDOM()
        }
    }
}

export function updateLyricsStyle(): void {
    const { displaySettings } = state
    const lyricsEl = document.querySelector('.will-change-contents') as HTMLElement

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

// Update static background when video changes (for static mode mini-screen)
export function updateStaticBackground(): void {
    if (!isStaticMode()) return

    const staticBg = document.querySelector('.background-static, .absolute.inset-0.w-full.h-full.bg-cover.bg-center.z-\\[1\\]') as HTMLElement
    if (!staticBg) return

    const { backgroundVideo, availableVideos } = state

    // Generate thumbnail path
    let thumbnail = ''
    if (backgroundVideo) {
        const videoFilename = backgroundVideo.split('/').pop()
        if (videoFilename) {
            thumbnail = `/media/thumbnails/${videoFilename}.jpg`
        }
    }
    // Check availableVideos for a better match
    const currentVideo = availableVideos.find(v => v.path === backgroundVideo)
    if (currentVideo?.thumbnail) {
        thumbnail = currentVideo.thumbnail
    }

    // Update background
    if (thumbnail) {
        staticBg.style.backgroundImage = `url('${thumbnail}')`
        staticBg.style.backgroundSize = 'cover'
        staticBg.style.backgroundPosition = 'center'
        staticBg.style.background = '' // Clear gradient if set
        staticBg.style.backgroundImage = `url('${thumbnail}')`
    } else {
        staticBg.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
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
        return `<video class="w-full h-full object-fill logo-media" src="${logoMedia}" autoplay loop muted playsinline></video>`
    } else {
        return `<img class="w-full h-full object-fill logo-media" src="${logoMedia}" alt="Logo" />`
    }
}

function formatLyricsText(text: string): string {
    if (!text) return ''
    return text.split('\n').map(line => `<div class="mb-[0.25em] last:mb-0">${line}</div>`).join('')
}

export function setupMarginMarkersListener(): void {
    socketService.on('margin-markers', (data: unknown) => {
        const { visible } = data as { visible: boolean }
        toggleMarginMarkers(visible)
    })
}

function toggleMarginMarkers(visible: boolean): void {
    const screen = document.querySelector('.main-projection')
    if (!screen) return

    let markers = screen.querySelector('.margin-markers')

    if (visible) {
        if (!markers) {
            markers = document.createElement('div')
            markers.className = 'absolute inset-0 pointer-events-none z-[50] margin-markers'
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
        const markerClass = "absolute border border-dashed bg-red-600/20 border-red-600/60";
        markers.innerHTML = `
      <div class="${markerClass} top-0 left-0 right-0" style="height: ${displaySettings.marginTop}%"></div>
      <div class="${markerClass} bottom-0 left-0 right-0" style="height: ${displaySettings.marginBottom}%"></div>
      <div class="${markerClass} top-0 bottom-0 left-0" style="width: ${displaySettings.marginLeft}%"></div>
      <div class="${markerClass} top-0 bottom-0 right-0" style="width: ${displaySettings.marginRight}%"></div>
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
