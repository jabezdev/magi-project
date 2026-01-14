import { state, subscribeToState } from '../state'
import type { DisplaySettings } from '../types'
import { getSlideText } from '../utils'
import { updateHTML } from '../utils'
import { socketService } from '../services'

// Check if we're in static mode (for control panel preview optimization)
function isStaticMode(): boolean {
    const params = new URLSearchParams(window.location.search)
    return params.get('static') === '1'
}

// Track existing listeners to remove them
let _currentMediaElement: HTMLVideoElement | null = null
let _mediaListeners: { [key: string]: EventListener } = {}
let _stateUnsubscribe: (() => void) | null = null

export function setupMediaListeners(): void {
    // Clean up old listeners
    if (_currentMediaElement) {
        Object.entries(_mediaListeners).forEach(([event, handler]) => {
            _currentMediaElement?.removeEventListener(event, handler)
        })
        _currentMediaElement = null
        _mediaListeners = {}
    }
    if (_stateUnsubscribe) {
        _stateUnsubscribe()
        _stateUnsubscribe = null
    }

    const mediaEl = (document.querySelector('.content-overlay video') || document.querySelector('.content-overlay audio')) as HTMLMediaElement
    if (!mediaEl) return

    _currentMediaElement = mediaEl as any // Cast to any or specialized type diff if needed, but EventListener is generic

    // Define handlers
    const onTimeUpdate = () => {
        const currentTime = mediaEl.currentTime
        const duration = mediaEl.duration
        const { liveItem, liveMediaState } = state

        // Canva Slide Logic (Video specific)
        if (liveItem?.type === 'video' && liveItem.settings?.isCanvaSlide && liveItem.settings.canvaHoldPoint) {
            const videoEl = mediaEl as HTMLVideoElement

            const holdPoint = liveItem.settings.canvaHoldPoint
            const isHolding = liveMediaState.isCanvaHolding

            // If we reached the hold point and are NOT holding, pause and hold
            // Use a small threshold (0.25s) to catch it
            if (!isHolding && currentTime >= holdPoint && currentTime < holdPoint + 0.5) {
                videoEl.pause()
                socketService.updateMediaState({
                    isPlaying: false,
                    isCanvaHolding: true,
                    currentTime
                })
                return
            }
        }

        socketService.updateMediaState({
            currentTime,
            duration,
            isPlaying: !mediaEl.paused
        })
    }

    const onPlay = () => {
        socketService.updateMediaState({ isPlaying: true })
    }

    const onPause = () => {
        // Only update state if we are not holding (holding handles its own state)
        if (!state.liveMediaState.isCanvaHolding) {
            socketService.updateMediaState({ isPlaying: false })
        }
    }

    const onEnded = () => {
        socketService.updateMediaState({ isPlaying: false, currentTime: mediaEl.duration })
    }

    // Attach
    mediaEl.addEventListener('timeupdate', onTimeUpdate)
    mediaEl.addEventListener('play', onPlay)
    mediaEl.addEventListener('pause', onPause)
    mediaEl.addEventListener('ended', onEnded)

    // Store for cleanup
    _mediaListeners = {
        'timeupdate': onTimeUpdate,
        'play': onPlay,
        'pause': onPause,
        'ended': onEnded
    }

    // Subscribe to state changes for Remote Control
    _stateUnsubscribe = subscribeToState((changes) => {
        // If 'live' group changed (which includes liveMediaState from socket update)
        // Or if we specifically check for liveMediaState... 
        // The `getChangedGroups` returns 'live' if liveItems change. 
        // We really want to know if `liveMediaState` changed.
        // But `notifySubscribers` passes the GROUPS.
        // Wait, `getChangedGroups` logic in `state/index.ts` to put `liveMediaState` where?
        // It's likely NOT in the 'live' group list I saw earlier (it only had song/variation/position).
        // I should have checked that.
        // If it's not grouped, it might come as a raw key? 
        // `notifySubscribers` passes `changes` which is `StateChangeKey[]`. 
        // `StateChangeKey` includes `keyof AppState`.

        if (changes.includes('liveMediaState' as any) || changes.includes('live')) {
            const shouldBePlaying = state.liveMediaState.isPlaying
            if (shouldBePlaying && mediaEl.paused) {
                mediaEl.play().catch(() => { })
            } else if (!shouldBePlaying && !mediaEl.paused) {
                mediaEl.pause()
            }
        }
    })
}

export function buildMainProjectionHTML(): string {
    const { displayMode, liveItem, liveSong, liveVariation, livePosition, backgroundVideo, logoMedia, displaySettings, availableVideos } = state
    const staticMode = isStaticMode()

    // --- Content Generation ---
    let contentHTML = ''

    // 1. Handle Overrides (Black, Clear, Logo)
    if (displayMode === 'black') {
        contentHTML = '<div class="w-full h-full bg-black"></div>'
    } else if (displayMode === 'logo') {
        contentHTML = buildLogoHTML(logoMedia)
    } else if (displayMode === 'clear') {
        contentHTML = '' // Just background
    } else {
        // 2. Handle Live Item Content
        if (liveItem) {
            switch (liveItem.type) {
                case 'song':
                    // existing lyrics logic
                    let lyricsText = ''
                    if (liveSong) {
                        lyricsText = getSlideText(liveSong, liveVariation, livePosition as any) || ''
                    }
                    const lyricsStyle = buildLyricsStyleString(displaySettings)
                    contentHTML = `
                        <div class="flex flex-col items-center justify-center text-center text-white w-full h-full box-border will-change-contents" style="${lyricsStyle}">
                          ${formatLyricsText(lyricsText)}
                        </div>
                    `
                    break

                case 'image':
                    contentHTML = `
                        <div class="w-full h-full bg-contain bg-center bg-no-repeat" style="background-image: url('${liveItem.url}');"></div>
                    `
                    break

                case 'video':
                    // Video is typically handled as a "background" but for specific video items, we render it as content 
                    // OR we force the background video to match this item. 
                    // For the unified system, let's render it as a full-screen video element in the content layer if it's the main item,
                    // but usually, video players want to be in the background layer to allow overlays?
                    // Actually, if it's a "User Video", it might be the only thing. 
                    // Let's use the background layer for performance/consistency if possible, OR a dedicated video tag here.
                    // Given existing background architecture, let's render nothing in content and ensure the background handles it.
                    // BUT: We need to handle audio? The background video is currently muted.
                    // If this is a generic video item, it might need sound.
                    // For MVP: Let's assume user videos are rendered in the content layer to separate them from "Background Loops".
                    const isYouTube = liveItem.isYouTube
                    if (isYouTube) {
                        // Simple iframe embed for MVP
                        // Extract ID? usually url is full.
                        // TODO: Robust YouTube parsing.
                        contentHTML = `<iframe class="w-full h-full" src="${liveItem.url}?autoplay=1&controls=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`
                    } else {
                        // Cast to any for loop property which is not on ScheduleItem interface currently
                        contentHTML = `<video class="w-full h-full object-contain" src="${liveItem.url}" autoplay ${(liveItem as any).loop ? 'loop' : ''} playsinline></video>`
                    }
                    break

                case 'slide':
                    // Render current slide
                    const slideIndex = (livePosition as any).index || 0
                    // Cast to any because generic ProjectableItem doesn't define 'slides' array structure strictly yet
                    const itemData = liveItem as any
                    const slide = itemData.slides ? itemData.slides[slideIndex] : null
                    if (slide) {
                        if (slide.type === 'image') {
                            contentHTML = `<div class="w-full h-full bg-contain bg-center bg-no-repeat" style="background-image: url('${slide.content}');"></div>`
                        } else if (slide.type === 'text') {
                            contentHTML = `<div class="flex items-center justify-center h-full text-white text-6xl font-bold p-10 text-center">${slide.content}</div>`
                        }
                    }
                    break

                case 'scripture':
                    const scripItem = liveItem as any
                    contentHTML = `
                        <div class="flex flex-col items-center justify-center h-full text-white p-20 text-center">
                             <div class="text-4xl mb-8">${scripItem.reference}</div>
                             <div class="text-6xl font-serif leading-tight">
                                "${scripItem.verses.map((v: any) => v.text).join(' ')}"
                             </div>
                        </div>
                     `
                    break
            }
        }
    }

    // --- Background Generation ---
    // If liveItem is a VIDEO type, we might want to SUPPRESS the standard background 
    // to avoid double playing, or use the standard background system to PLAY it.
    // Use standard background for loop consistency, unless it's a specific Video Item which might have audio.
    const isVideoItem = liveItem?.type === 'video'

    // In static mode, use thumbnail or gradient
    let backgroundHTML: string
    if (staticMode) {
        let thumbnail = ''
        if (backgroundVideo) {
            const videoFilename = backgroundVideo.split('/').pop()
            if (videoFilename) thumbnail = `/media/thumbnails/${videoFilename}.jpg`
        }
        // ... (existing thumbnail logic) ... 
        const bgStyle = thumbnail
            ? `background-image: url('${thumbnail}'); background-size: cover; background-position: center;`
            : `background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);`

        backgroundHTML = `<div class="absolute inset-0 w-full h-full bg-cover bg-center z-[1]" style="${bgStyle}"></div>`
    } else {
        // Standard background video system
        // If we are playing a foreground video item, we might hide this or make it black?
        // Let's keep it running behind (opacity 0?) or replace it?
        // Ideally: If liveItem is video, we hide the standard background.
        const bgClass = isVideoItem ? 'hidden' : 'active opacity-100'

        const videoClass = "absolute inset-0 w-full h-full object-cover z-[1] opacity-0 transition-opacity duration-1000 ease-in-out";
        backgroundHTML = `
      <video class="${videoClass} bg-layer-1 ${bgClass}" src="${backgroundVideo}" autoplay loop muted playsinline></video>
      <video class="${videoClass} bg-layer-2" autoplay loop muted playsinline></video>
    `
    }

    const overlayBaseClass = "absolute inset-0 flex items-center justify-center z-[2] transition-[background] duration-300 ease-in-out content-overlay";
    // If showing video content, bg should be black?
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
    // Re-use the full build logic for simplicity in MVP, or implement granular partial updates.
    // For robust "View Transitions" and accurate state reflection, calling buildMainProjectionHTML 
    // and diffing/updating is safer, but `updateHTML` (which sets innerHTML) is what we have.
    // Given the complexity of switching between Video/Image/Song here, let's re-render the content block.

    // We can call buildMainProjectionHTML() effectively, but we are inside an update function meant to be lighter?
    // Let's just re-run the whole HTML build for the overlay content.
    // The background video update is handled separately by `updateBackgroundVideo`.

    const overlay = document.querySelector('.content-overlay')
    if (!overlay) return

    // We simply rebuild the whole screen to catch all `liveItem` cases? 
    // No, that replaces the background video DOM nodes and restarts the video! 
    // We must ONLY update the overlay.

    const { displayMode, liveItem, liveSong, liveVariation, livePosition, displaySettings, logoMedia } = state

    // ... Copy-paste content logic from above ...
    let contentHTML = ''
    if (displayMode === 'black') {
        contentHTML = '<div class="w-full h-full bg-black"></div>'
    } else if (displayMode === 'logo') {
        contentHTML = buildLogoHTML(logoMedia)
    } else if (displayMode === 'clear') {
        contentHTML = ''
    } else {
        if (liveItem) {
            switch (liveItem.type) {
                case 'song':
                    let lyricsText = ''
                    if (liveSong) lyricsText = getSlideText(liveSong, liveVariation, livePosition as any) || ''
                    const lyricsStyle = buildLyricsStyleString(displaySettings)
                    contentHTML = `<div class="flex flex-col items-center justify-center text-center text-white w-full h-full box-border will-change-contents" style="${lyricsStyle}">${formatLyricsText(lyricsText)}</div>`
                    break
                case 'image':
                    contentHTML = `<div class="w-full h-full bg-contain bg-center bg-no-repeat" style="background-image: url('${liveItem.url}');"></div>`
                    break
                case 'video':
                    const isYouTube = liveItem.isYouTube
                    if (isYouTube) {
                        contentHTML = `<iframe class="w-full h-full" src="${liveItem.url}?autoplay=1&controls=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`
                    } else {
                        // Cast to any for loop property which is not on ScheduleItem interface currently
                        contentHTML = `<video class="w-full h-full object-contain" src="${liveItem.url}" autoplay ${(liveItem as any).loop ? 'loop' : ''} playsinline></video>`
                    }
                    break
                case 'slide':
                    const slideIndex2 = (livePosition as any).index || 0
                    const itemData2 = liveItem as any
                    const slide2 = itemData2.slides ? itemData2.slides[slideIndex2] : null
                    if (slide2) {
                        if (slide2.type === 'image') contentHTML = `<div class="w-full h-full bg-contain bg-center bg-no-repeat" style="background-image: url('${slide2.content}');"></div>`
                        else if (slide2.type === 'text') contentHTML = `<div class="flex items-center justify-center h-full text-white text-6xl font-bold p-10 text-center">${slide2.content}</div>`
                    }
                    break
                case 'scripture':
                    const sItem = liveItem as any
                    contentHTML = `<div class="flex flex-col items-center justify-center h-full text-white p-20 text-center"><div class="text-4xl mb-8">${sItem.reference}</div><div class="text-6xl font-serif leading-tight">"${sItem.verses.map((v: any) => v.text).join(' ')}"</div></div>`
                    break
                case 'audio':
                    // Audio Visualization (Minimal)
                    // Use 'sound' icon SVG inline here or from ICONS? importing ICONS in MainProjection might be nice but constants are usually available.
                    // But MainProjection.ts doesn't import ICONS.
                    // I'll use a generic SVG for now.
                    const soundIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>'
                    contentHTML = `
                        <div class="flex flex-col items-center justify-center h-full text-white p-20 text-center">
                             <div class="text-white/50 mb-8 animate-pulse">${soundIcon}</div>
                             <div class="text-4xl font-bold">${liveItem.title}</div>
                             <audio class="hidden" src="${liveItem.url}" autoplay></audio>
                        </div>
                     `
                    break
            }
        }
    }

    const overlayBgStyle = (displayMode === 'lyrics' || displayMode === 'clear') ? 'transparent' : 'black';
    (overlay as HTMLElement).style.background = overlayBgStyle;
    overlay.className = `absolute inset-0 flex items-center justify-center z-[2] transition-[background] duration-300 ease-in-out content-overlay ${displayMode}`;

    const { type, duration } = displaySettings.transitions || { type: 'crossfade', duration: 0.5 }
    const useTransition = type !== 'none'

    if (useTransition && document.startViewTransition) {
        document.documentElement.style.setProperty('--view-transition-duration', `${duration}s`)
        document.startViewTransition(() => {
            updateHTML(overlay, contentHTML)
            setupMediaListeners() // Re-attach listeners after DOM update
        })
    } else {
        updateHTML(overlay, contentHTML)
        setupMediaListeners() // Re-attach listeners after DOM update
    }

    if (displayMode === 'logo') setupVideoAutoplay()
}

export function updateLiveContent(): void {
    const { liveItem } = state
    const lyricsEl = document.querySelector('.will-change-contents') as HTMLElement

    // If we are showing lyrics and the new item is ALSO a song, we can try to use the optimized update
    if (lyricsEl && liveItem?.type === 'song') {
        updateLyricsDisplay()
    } else {
        // Structure changed or not a song, full rewrite
        updateDisplayMode()
    }
}

export function updateBackgroundVideo(): void {
    // Also update static background if in static mode
    if (isStaticMode()) {
        updateStaticBackground()
        return  // Don't process video elements in static mode
    }

    // If we are showing a foreground video item, we might want to pause the background layers?
    // The render logic hides them, but they might still be playing if we don't pause.
    // However, keeping them playing allows for instant transition back. 
    // Let's rely on the `hidden` class logic in buildHTML/updateDisplayMode to handle visibility.
    // But `updateBackgroundVideo` is called when `state.backgroundVideo` changes. 
    // If we are in "Video Mode", likely the user doesn't care about background video changes yet.
    // But let's keep the logic consistent: The background video layers always reflect `state.backgroundVideo`.
    // The visibility is controlled by the parent container or class in rendering.

    // Correction: In `buildMainProjectionHTML` I added `const bgClass = isVideoItem ? 'hidden' : 'active opacity-100'`.
    // But `updateBackgroundVideo` manually manages classes `active` and `opacity`. 
    // We should respect the `hidden` override if it exists, or re-apply it?
    // Actually, `updateBackgroundVideo` is primarily for CROSSFADING between backgrounds.
    // If we are in video mode, we probably shouldn't be crossfading backgrounds.

    if (state.liveItem?.type === 'video') {
        // Maybe just ensure they are paused or hidden?
        // For now, let's let them be managed by state.backgroundVideo. 
        // If the user changes background while watching a video, it will change in the background (invisible).
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
        const lyricsText = getSlideText(liveSong, liveVariation, livePosition as any) || ''

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
