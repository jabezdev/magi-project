import { state } from '../state'

import { getAllSlides } from '../utils'
import { updateHTML } from '../utils'

let clockInterval: number | null = null

export function buildConfidenceMonitorHTML(): string {
    const { confidenceMonitorSettings } = state

    // Build inline styles from settings
    const cmStyles = `
    --cm-font-size: ${confidenceMonitorSettings.fontSize ?? 2.5}rem;
    --cm-font-family: ${confidenceMonitorSettings.fontFamily ?? 'system-ui'};
    --cm-line-height: ${confidenceMonitorSettings.lineHeight ?? 1.4};
    --cm-part-gap: ${confidenceMonitorSettings.partGap ?? 2.0}rem;
    --cm-slide-gap: ${confidenceMonitorSettings.slideGap ?? 0}rem;
    --cm-prev-next-opacity: ${confidenceMonitorSettings.prevNextOpacity ?? 0.35};
    --cm-clock-size: ${confidenceMonitorSettings.clockSize ?? 1.25}rem;
    --cm-margin-top: ${confidenceMonitorSettings.marginTop ?? 0.5}rem;
    --cm-margin-bottom: ${confidenceMonitorSettings.marginBottom ?? 0.5}rem;
    --cm-margin-left: ${confidenceMonitorSettings.marginLeft ?? 0.5}rem;
    --cm-margin-right: ${confidenceMonitorSettings.marginRight ?? 0.5}rem;
    --cm-divider-color: rgba(255, 255, 255, 0.2);
    --cm-divider-height: 2px;
    `

    return `
        <div class="flex flex-col h-screen bg-bg-primary confidence-screen" style="${cmStyles}">
            <nav class="flex justify-center items-center px-4 py-2 bg-bg-secondary border-b border-border-color shrink-0 cm-navbar">
                <div class="text-xl font-semibold tabular-nums text-text-primary cm-clock" id="cm-clock" style="font-size: var(--cm-clock-size, 1.25rem);"></div>
            </nav>
            <div class="flex-1 flex flex-col overflow-hidden relative cm-teleprompter" style="padding: var(--cm-margin-top, 0.5rem) var(--cm-margin-right, 0.5rem) var(--cm-margin-bottom, 0.5rem) var(--cm-margin-left, 0.5rem);">
                ${buildTeleprompterContent()}
            </div>
            <button class="fixed bottom-5 right-5 w-12 h-12 flex items-center justify-center bg-black/60 border border-white/20 rounded-lg text-white cursor-pointer z-[100] opacity-0 transition-all duration-300 ease-in-out hover:opacity-100 group-hover:opacity-100 fullscreen-btn" title="Toggle Fullscreen">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </button>
        </div>
    `
}

function buildTeleprompterContent(): string {
    const { displayMode, liveItem, liveSong, liveVariation, livePosition, previousLiveSong, previousLiveItem, previewItem, previewSong, previewVariation, previewPosition, liveMediaState } = state

    // 1. Handle overrides
    let modeOverlay = ''
    if (!liveItem && !previousLiveItem) {
        // ... (existing overlay logic for no-item state) ...
    }

    if (!liveItem && !previousLiveItem) {
        return modeOverlay + '<div class="flex items-center justify-center flex-1 text-xl text-text-muted cm-empty">No content loaded</div>'
    }

    // DISPATCH BASED ON LIVE ITEM TYPE
    // Note: Previous Item logic is tricky with non-songs. For now, only Songs support "Previous Item" continuity in the teleprompter.
    // Use existing logic if it's a song.

    if (liveItem?.type === 'song' || (!liveItem && previousLiveItem?.type === 'song')) {
        // --- SONG MODE (Existing Teleprompter) ---
        return buildSongTeleprompter()
    }

    // --- NON-SONG MODES ---
    let contentHTML = ''

    if (liveItem) {
        switch (liveItem.type) {
            case 'video':
                const isHolding = liveMediaState.isCanvaHolding
                const holdText = isHolding ? '<span class="text-amber-400 animate-pulse">WAITING FOR CUE</span>' : ''
                contentHTML = `
                    <div class="flex flex-col items-center justify-center flex-1 h-full text-center">
                        <div class="text-6xl mb-4">🎥</div>
                        <div class="text-4xl text-white font-bold mb-2">${liveItem.name || 'Video'}</div>
                        <div class="text-2xl text-text-muted font-mono mb-8">${formatTime(liveMediaState.currentTime)} / ${formatTime(liveMediaState.duration)}</div>
                        <div class="text-3xl">${holdText}</div>
                    </div>
                 `
                break

            case 'image':
                contentHTML = `
                    <div class="flex items-center justify-center flex-1 h-full w-full p-4">
                        <img src="${liveItem.url}" class="max-w-full max-h-full object-contain rounded-lg shadow-lg border border-border-color" />
                    </div>
                 `
                break

            case 'presentation':
                // Show Current Slide + Next Slide Preview
                const slideIndex = (livePosition as any).index || 0
                const currentSlide = liveItem.slides[slideIndex]
                const nextSlide = liveItem.slides[slideIndex + 1]

                contentHTML = `
                    <div class="flex flex-col h-full p-4 gap-4">
                        <div class="flex-1 flex flex-col items-center justify-center bg-bg-secondary rounded-lg border-2 border-accent-primary p-4 relative">
                            <span class="absolute top-2 left-2 text-xs uppercase tracking-widest text-accent-primary font-bold">Current</span>
                             ${renderSlideContent(currentSlide)}
                        </div>
                        <div class="h-1/3 flex flex-col items-center justify-center bg-bg-tertiary rounded-lg border border-border-color p-4 relative opacity-60">
                            <span class="absolute top-2 left-2 text-xs uppercase tracking-widest text-text-muted font-bold">Next</span>
                             ${nextSlide ? renderSlideContent(nextSlide) : '<span class="text-text-muted italic">End of presentation</span>'}
                        </div>
                    </div>
                 `
                break

            case 'scripture':
                contentHTML = `
                    <div class="flex flex-col items-center justify-center flex-1 h-full p-8 text-center">
                        <div class="text-3xl text-accent-primary mb-6 font-bold">${liveItem.reference}</div>
                        <div class="text-5xl text-white leading-relaxed font-serif">
                             "${liveItem.verses.map(v => v.text).join(' ')}"
                        </div>
                    </div>
                 `
                break
        }
    }

    return `
        ${modeOverlay}
        <div class="flex flex-col w-full h-full cm-media-view">
             ${contentHTML}
        </div>
    `
}

// Helper to extract old logic but wrapped for dispatch
function buildSongTeleprompter(): string {
    const { displayMode, liveSong, liveVariation, livePosition, previousLiveSong, previousLiveVariation, previousLivePosition, previewSong, previewVariation, previewPosition } = state

    // ... (Existing logic for songs: Previous, Live, Preview) ...
    // To save complexity in this diff, I will rely on the fact that I am REPLACING the whole function.
    // I should copy the existing logic here.

    let htmlParts: string[] = []
    let currentGlobalIndex = -1
    let slideCounter = 0

    // 1. Previous Song
    if (previousLiveSong && (!liveSong || previousLiveSong.id !== liveSong.id)) {
        const prevSlides = getAllSlides(previousLiveSong, previousLiveVariation)
        if (prevSlides.length > 0) {
            let prevStartIndex = 0
            let prevEndIndex = prevSlides.length
            if (previousLivePosition) {
                const activePartIndex = (previousLivePosition as any).partIndex
                let foundStart = false
                for (let i = 0; i < prevSlides.length; i++) {
                    if (prevSlides[i].position.partIndex === activePartIndex) {
                        if (!foundStart) { prevStartIndex = i; foundStart = true }
                    } else if (foundStart) { prevEndIndex = i; break }
                }
            }
            const prevHtml = prevSlides.map((slide, index) => {
                const idx = slideCounter++
                const isHidden = index < prevStartIndex || index >= prevEndIndex
                const hiddenClass = isHidden ? ' hidden' : ''
                const styleClass = isHidden ? 'past' : ''
                const newPart = index > 0 && prevSlides[index - 1].partLabel !== slide.partLabel
                return renderSlide(slide, idx, `tp-slide ${styleClass}${hiddenClass}`, newPart)
            }).join('')
            htmlParts.push(prevHtml)
            htmlParts.push('<div class="w-full my-8 shrink-0 tp-divider" style="height: var(--cm-divider-height, 2px); background: var(--cm-divider-color, rgba(255, 255, 255, 0.2));"></div>')
        }
    }

    // 2. Live Song
    if (liveSong) {
        const liveSlides = getAllSlides(liveSong, liveVariation)
        let localCurrentIndex = 0
        for (let i = 0; i < liveSlides.length; i++) {
            if (liveSlides[i].position.partIndex === (livePosition as any).partIndex &&
                liveSlides[i].position.slideIndex === (livePosition as any).slideIndex) {
                localCurrentIndex = i
                break
            }
        }
        const liveHtml = liveSlides.map((slide, index) => {
            const globalIdx = slideCounter++
            let slideClass = 'tp-slide'
            if (index < localCurrentIndex) slideClass += ' past'
            else if (index === localCurrentIndex) { slideClass += ' current'; currentGlobalIndex = globalIdx }
            else slideClass += ' future'
            return renderSlide(slide, globalIdx, slideClass, index > 0 && liveSlides[index - 1].partLabel !== slide.partLabel)
        }).join('')
        htmlParts.push(liveHtml)
    }

    // 3. Preview Song
    if (previewSong && previewSong.id !== liveSong?.id) {
        htmlParts.push('<div class="w-full my-8 shrink-0 tp-divider" style="height: var(--cm-divider-height, 2px); background: var(--cm-divider-color, rgba(255, 255, 255, 0.2));"></div>')
        const previewSlides = getAllSlides(previewSong, previewVariation)
        let previewStartIndex = 0
        for (let i = 0; i < previewSlides.length; i++) {
            if (previewSlides[i].position.partIndex === (previewPosition as any).partIndex &&
                previewSlides[i].position.slideIndex === (previewPosition as any).slideIndex) {
                previewStartIndex = i
                break
            }
        }
        const previewHtml = previewSlides.map((slide, index) => {
            const globalIdx = slideCounter++
            const isHidden = index < previewStartIndex
            const hiddenClass = isHidden ? ' hidden' : ''
            const newPart = index > 0 && previewSlides[index - 1].partLabel !== slide.partLabel
            return renderSlide(slide, globalIdx, `tp-slide preview${hiddenClass}`, newPart)
        }).join('')
        htmlParts.push(previewHtml)
    }

    return `
        <div class="flex flex-col items-stretch w-full will-change-transform transition-transform duration-[400ms] ease-out teleprompter-scroll" data-current-index="${currentGlobalIndex}" data-song-id="${liveSong?.id}" data-prev-song-id="${previousLiveSong?.id || ''}" data-preview-song-id="${previewSong?.id || ''}" data-preview-position="${(previewPosition as any).partIndex}-${(previewPosition as any).slideIndex}">
            <div class="shrink-0 h-[40vh] tp-spacer-top"></div>
            ${htmlParts.join('')}
            <div class="shrink-0 h-[40vh] tp-spacer-bottom"></div>
        </div>
    `
}

function renderSlideContent(slide: any): string {
    if (!slide) return ''
    if (slide.type === 'text') return `<div class="text-4xl text-white text-center font-medium">${slide.content}</div>`
    if (slide.type === 'image') return `<img src="${slide.content}" class="max-w-full max-h-full object-contain" />`
    return ''
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

function renderSlide(slide: any, index: number, className: string, newPart: boolean): string {
    let style = `opacity: var(--cm-prev-next-opacity, 0.35);`
    if (className.includes('current')) {
        style = `opacity: 1;`
    }
    if (newPart) {
        style += `margin-top: var(--cm-part-gap, 2rem);`
    }

    const textStyle = `font-size: var(--cm-font-size, 2.5rem); line-height: var(--cm-line-height, 1.4); font-family: var(--cm-font-family, system-ui);`
    const isCurrent = className.includes('current')

    return `
        <div class="flex items-stretch w-full transition-all duration-500 ease-in-out py-6 ${className}" data-index="${index}" id="tp-slide-${index}" style="${style} margin-bottom: var(--cm-slide-gap, 0);">
            <div class="flex items-center justify-center w-10 shrink-0 relative tp-part-indicator">
                <span class="absolute whitespace-nowrap text-[0.7rem] font-bold uppercase tracking-[2px] rotate-[-90deg] ${isCurrent ? 'text-accent-primary' : 'text-text-muted'}">${slide.partLabel}</span>
            </div>
            <div class="flex-1 flex items-center pl-4 tp-content">
                <div class="tp-text ${isCurrent ? 'text-text-primary font-medium' : 'text-text-secondary'}" style="${textStyle}">${slide.text.replace(/\n/g, '<br>')}</div>
            </div>
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
            let hours = now.getHours()
            const ampm = hours >= 12 ? 'PM' : 'AM'
            hours = hours % 12
            hours = hours ? hours : 12 // the hour '0' should be '12'
            const hoursStr = hours.toString()
            const minutes = now.getMinutes().toString().padStart(2, '0')
            // const seconds = now.getSeconds().toString().padStart(2, '0')
            clockEl.textContent = `${hoursStr}:${minutes} ${ampm}`
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
    const { displayMode, liveSong } = state
    const teleprompter = document.querySelector('.cm-teleprompter')
    const existingScroll = teleprompter?.querySelector('.teleprompter-scroll')

    if (!teleprompter) return

    // Check if song changed - need full rebuild of lyrics
    const currentSongId = existingScroll?.getAttribute('data-song-id')
    const newSongId = liveSong?.id?.toString() || ''
    const songChanged = !existingScroll || currentSongId !== newSongId

    // Also track previous/preview song IDs to detect structure changes
    const currentPrevSongId = existingScroll?.getAttribute('data-prev-song-id') || ''
    const currentPreviewSongId = existingScroll?.getAttribute('data-preview-song-id') || ''
    const currentPreviewPosition = existingScroll?.getAttribute('data-preview-position') || ''
    const newPrevSongId = state.previousLiveSong?.id?.toString() || ''
    const newPreviewSongId = state.previewSong?.id?.toString() || ''
    const newPreviewPosition = `${state.previewPosition.partIndex}-${state.previewPosition.slideIndex}`

    // Core structure changes (require full rebuild)
    const coreStructureChanged = songChanged || currentPrevSongId !== newPrevSongId

    // Preview-only change (can rebuild without jarring scroll reset)
    const previewOnlyChange = !coreStructureChanged && (
        currentPreviewSongId !== newPreviewSongId ||
        currentPreviewPosition !== newPreviewPosition
    )

    const structureChanged = coreStructureChanged || previewOnlyChange

    // Save current scroll transform before any DOM changes (only used for preview-only changes)
    const savedTransform = (existingScroll as HTMLElement)?.style?.transform || ''

    // Always update mode overlay
    const doUpdate = () => {
        updateModeOverlay(teleprompter, displayMode)
        if (structureChanged) {
            // Full rebuild when song structure changes
            updateHTML(teleprompter, buildTeleprompterContent())

            const newScrollContainer = teleprompter.querySelector('.teleprompter-scroll') as HTMLElement
            if (newScrollContainer) {
                if (previewOnlyChange) {
                    // For preview-only changes: preserve scroll position
                    newScrollContainer.style.transition = 'none'
                    newScrollContainer.style.transform = savedTransform
                    void newScrollContainer.offsetHeight
                    newScrollContainer.style.transition = ''
                    // Smooth scroll to current slide (should be same position)
                    scrollToSlide(parseInt(newScrollContainer.getAttribute('data-current-index') || '0'), false)
                } else {
                    // For song changes: instant scroll to new position
                    scrollToCurrentSlide(true) // true = instant
                }
            }
        } else {
            // Efficient update: just update CSS classes (scroll is handled inside updateSlideClasses)
            updateSlideClasses()
        }
    }

    // Determine transition settings
    const { type, duration } = state.confidenceMonitorSettings.transitions || { type: 'crossfade', duration: 0.5 }
    const useTransition = type !== 'none' && (songChanged || displayMode !== (teleprompter.getAttribute('data-prev-mode') || ''))

    // Update previous mode tracker
    teleprompter.setAttribute('data-prev-mode', displayMode)

    if (useTransition && document.startViewTransition) {
        document.documentElement.style.setProperty('--view-transition-duration', `${duration}s`)
        document.startViewTransition(doUpdate)
    } else {
        doUpdate()
    }
}

function updateModeOverlay(teleprompter: Element, displayMode: string): void {
    // Remove existing overlay
    const existingOverlay = teleprompter.querySelector('.mode-overlay')
    if (existingOverlay) {
        existingOverlay.remove()
    }

    // Only add overlay if NO song is loaded and NOT in lyrics mode
    const { liveSong, previousLiveSong } = state
    if (liveSong || previousLiveSong) return

    // Add new overlay if not in lyrics mode
    const overlayClass = "absolute inset-0 flex items-center justify-center w-full h-full z-[10] mode-overlay";
    if (displayMode === 'black') {
        teleprompter.insertAdjacentHTML('afterbegin', `<div class="${overlayClass} bg-black text-[#333]"></div>`)
    } else if (displayMode === 'clear') {
        teleprompter.insertAdjacentHTML('afterbegin', `<div class="${overlayClass} bg-transparent"></div>`)
    } else if (displayMode === 'logo') {
        teleprompter.insertAdjacentHTML('afterbegin', `<div class="${overlayClass} bg-transparent"></div>`)
    }
}

/**
 * Efficiently update slide classes without rebuilding entire DOM.
 * This is used when only the position changes within the same song structure.
 */
function updateSlideClasses(): void {
    const { liveSong, liveVariation, livePosition, previousLiveSong, previousLiveVariation } = state
    if (!liveSong) return

    // Calculate the offset from previous song slides (full song for continuous medley)
    let previousSlidesCount = 0
    if (previousLiveSong && previousLiveSong.id !== liveSong.id) {
        const prevSlides = getAllSlides(previousLiveSong, previousLiveVariation)
        previousSlidesCount = prevSlides.length
    }

    const liveSlides = getAllSlides(liveSong, liveVariation)

    // Find current slide index within live song
    let localCurrentIndex = 0
    for (let i = 0; i < liveSlides.length; i++) {
        if (liveSlides[i].position.partIndex === livePosition.partIndex &&
            liveSlides[i].position.slideIndex === livePosition.slideIndex) {
            localCurrentIndex = i
            break
        }
    }

    // The global index accounts for previous song slides
    const globalCurrentIndex = previousSlidesCount + localCurrentIndex

    // Update all slide classes
    document.querySelectorAll('.tp-slide').forEach((slide, index) => {
        slide.classList.remove('past', 'current', 'future')
        const indicator = slide.querySelector('.tp-part-indicator span')
        const text = slide.querySelector('.tp-text')

        if (indicator) indicator.className = 'absolute whitespace-nowrap text-[0.7rem] font-bold uppercase tracking-[2px] rotate-[-90deg] text-text-muted';
        if (text) text.className = 'tp-text text-text-secondary';
        (slide as HTMLElement).style.opacity = 'var(--cm-prev-next-opacity, 0.35)';

        // Previous song slides are always "past"
        if (index < previousSlidesCount) {
            slide.classList.add('past')
        } else {
            // Live song slides
            const liveIndex = index - previousSlidesCount
            if (liveIndex < liveSlides.length) {
                if (liveIndex < localCurrentIndex) {
                    slide.classList.add('past')
                } else if (liveIndex === localCurrentIndex) {
                    slide.classList.add('current')
                    if (indicator) indicator.className = 'absolute whitespace-nowrap text-[0.7rem] font-bold uppercase tracking-[2px] rotate-[-90deg] text-accent-primary';
                    if (text) text.className = 'tp-text text-text-primary font-medium';
                    (slide as HTMLElement).style.opacity = '1';
                } else {
                    slide.classList.add('future')
                }
            }
            // Preview song slides keep their tp-preview class (opacity handled by CSS)
        }
    })

    // Update data attribute and scroll to center the current slide
    const scrollContainer = document.querySelector('.teleprompter-scroll') as HTMLElement
    if (scrollContainer) {
        scrollContainer.setAttribute('data-current-index', String(globalCurrentIndex))
        // Directly call scroll with the calculated index
        scrollToSlide(globalCurrentIndex)
    }
}



/**
 * Centers the target slide in the viewport using CSS transform.
 * Uses getBoundingClientRect for accurate position calculation.
 */
function scrollToSlide(targetIndex: number, instant = false): void {
    const scrollContainer = document.querySelector('.teleprompter-scroll') as HTMLElement
    const teleprompter = document.querySelector('.cm-teleprompter') as HTMLElement
    const targetSlide = document.getElementById(`tp-slide-${targetIndex}`)

    if (!scrollContainer || !teleprompter || !targetSlide) return

    // Force layout recalculation
    void scrollContainer.offsetHeight

    // Disable transition for instant scroll
    if (instant) {
        scrollContainer.style.transition = 'none'
    }

    // Get current transform value
    const currentTransform = scrollContainer.style.transform
    const match = currentTransform.match(/translateY\((-?\d+\.?\d*)px\)/)
    const currentOffset = match ? parseFloat(match[1]) : 0

    // Use getBoundingClientRect for accurate position (accounts for all CSS)
    const slideRect = targetSlide.getBoundingClientRect()
    const teleprompterRect = teleprompter.getBoundingClientRect()

    // Calculate where the slide center is relative to teleprompter center
    const slideCenter = slideRect.top + (slideRect.height / 2)
    const viewportCenter = teleprompterRect.top + (teleprompterRect.height / 2)

    // How much we need to move to center the slide
    const adjustment = slideCenter - viewportCenter

    // New offset = current offset - adjustment
    const newOffset = currentOffset - adjustment

    // Apply transform
    scrollContainer.style.transform = `translateY(${newOffset}px)`

    // Re-enable transition after instant scroll
    if (instant) {
        requestAnimationFrame(() => {
            scrollContainer.style.transition = ''
        })
    }
}

function scrollToCurrentSlide(instant = false): void {
    const scrollContainer = document.querySelector('.teleprompter-scroll') as HTMLElement
    if (!scrollContainer) return

    const idx = parseInt(scrollContainer.getAttribute('data-current-index') || '0')

    if (instant) {
        // Use double RAF to ensure DOM layout is complete
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                scrollToSlide(idx, true)
            })
        })
    } else {
        scrollToSlide(idx, false)
    }
}

export function updateConfidenceMonitorStyles(): void {
    const { confidenceMonitorSettings } = state
    const screen = document.querySelector('.confidence-screen') as HTMLElement

    if (screen) {
        screen.style.setProperty('--cm-font-size', `${confidenceMonitorSettings.fontSize}rem`)
        screen.style.setProperty('--cm-font-family', confidenceMonitorSettings.fontFamily)
        screen.style.setProperty('--cm-line-height', String(confidenceMonitorSettings.lineHeight))
        screen.style.setProperty('--cm-part-gap', `${confidenceMonitorSettings.partGap}rem`)
        screen.style.setProperty('--cm-slide-gap', `${confidenceMonitorSettings.slideGap ?? 0}rem`)
        screen.style.setProperty('--cm-prev-next-opacity', String(confidenceMonitorSettings.prevNextOpacity))
        screen.style.setProperty('--cm-clock-size', `${confidenceMonitorSettings.clockSize}rem`)
        screen.style.setProperty('--cm-margin-top', `${confidenceMonitorSettings.marginTop}rem`)
        screen.style.setProperty('--cm-margin-bottom', `${confidenceMonitorSettings.marginBottom}rem`)
        screen.style.setProperty('--cm-margin-left', `${confidenceMonitorSettings.marginLeft}rem`)
        screen.style.setProperty('--cm-margin-right', `${confidenceMonitorSettings.marginRight}rem`)
    }
}

