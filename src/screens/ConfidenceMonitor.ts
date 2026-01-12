import { state } from '../state'

import { getAllSlides } from '../utils/slides'
import { updateHTML } from '../utils/dom'

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
        <div class="confidence-screen" style="${cmStyles}">
            <nav class="cm-navbar">
                <div class="cm-clock" id="cm-clock"></div>
            </nav>
            <div class="cm-teleprompter">
                ${buildTeleprompterContent()}
            </div>
            <button class="fullscreen-btn" title="Toggle Fullscreen">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </button>
        </div>
    `
}

function buildTeleprompterContent(): string {
    const { displayMode, liveSong, liveVariation, livePosition, previousLiveSong, previousLiveVariation, previousLivePosition, previewSong, previewVariation, previewPosition } = state

    // Build mode overlay for non-lyrics modes
    let modeOverlay = ''
    if (displayMode === 'black') {
        modeOverlay = '<div class="mode-overlay black"><span>BLACK</span></div>'
    } else if (displayMode === 'clear') {
        modeOverlay = '<div class="mode-overlay clear"><span>CLEAR</span></div>'
    } else if (displayMode === 'logo') {
        modeOverlay = '<div class="mode-overlay logo"><span>LOGO</span></div>'
    }

    if (!liveSong && !previousLiveSong) {
        return modeOverlay + '<div class="cm-empty">No song loaded</div>'
    }

    // Accumulate all slide HTML strings
    let htmlParts: string[] = []

    // We need to track the global index of the CURRENT live slide to scroll to it
    let currentGlobalIndex = -1
    let slideCounter = 0

    // --- 1. PREVIOUS SONG (Filtered) ---
    // Show ONLY the active part of the previous song
    if (previousLiveSong && (!liveSong || previousLiveSong.id !== liveSong.id)) {
        const prevSlides = getAllSlides(previousLiveSong, previousLiveVariation)

        if (prevSlides.length > 0) {
            // Find the index of the start and END of the active part
            let prevStartIndex = 0
            let prevEndIndex = prevSlides.length

            if (previousLivePosition) {
                const activePartIndex = previousLivePosition.partIndex

                let foundStart = false
                for (let i = 0; i < prevSlides.length; i++) {
                    if (prevSlides[i].position.partIndex === activePartIndex) {
                        if (!foundStart) {
                            prevStartIndex = i
                            foundStart = true
                        }
                    } else if (foundStart) {
                        // Found start, now at different part -> end
                        prevEndIndex = i
                        break
                    }
                }
            }

            const prevHtml = prevSlides.map((slide, index) => {
                const idx = slideCounter++

                // Show ONLY the active part (hide everything else)
                const isHidden = index < prevStartIndex || index >= prevEndIndex
                const hiddenClass = isHidden ? ' tp-hidden' : ''

                // Use normal styling for visible previous slides (no tp-past) to ensure readability
                const styleClass = isHidden ? 'tp-slide tp-past' : 'tp-slide'

                // Check if this slide starts a new part
                const newPart = index > 0 && prevSlides[index - 1].partLabel !== slide.partLabel
                return renderSlide(slide, idx, `${styleClass}${hiddenClass}`, newPart)
            }).join('')

            htmlParts.push(prevHtml)

            // Separator between previous and live song
            htmlParts.push('<div class="tp-divider"></div>')
        }
    }

    // --- 2. LIVE SONG (Full) ---
    if (liveSong) {
        const liveSlides = getAllSlides(liveSong, liveVariation)

        // Find local index of current slide
        let localCurrentIndex = 0
        for (let i = 0; i < liveSlides.length; i++) {
            if (liveSlides[i].position.partIndex === livePosition.partIndex &&
                liveSlides[i].position.slideIndex === livePosition.slideIndex) {
                localCurrentIndex = i
                break
            }
        }

        const liveHtml = liveSlides.map((slide, index) => {
            const globalIdx = slideCounter++
            let slideClass = 'tp-slide'

            if (index < localCurrentIndex) {
                slideClass += ' tp-past'
            } else if (index === localCurrentIndex) {
                slideClass += ' tp-current'
                currentGlobalIndex = globalIdx // Found our scroll target
            } else {
                slideClass += ' tp-future'
            }

            return renderSlide(slide, globalIdx, slideClass, index > 0 && liveSlides[index - 1].partLabel !== slide.partLabel)
        }).join('')

        htmlParts.push(liveHtml)
    }

    // --- 3. PREVIEW SONG (Next) ---
    // Only show if different from live song and exists
    if (previewSong && previewSong.id !== liveSong?.id) {
        // Separator
        htmlParts.push('<div class="tp-divider"></div>')

        const previewSlides = getAllSlides(previewSong, previewVariation)

        // Find the index of the preview position
        let previewStartIndex = 0
        for (let i = 0; i < previewSlides.length; i++) {
            if (previewSlides[i].position.partIndex === previewPosition.partIndex &&
                previewSlides[i].position.slideIndex === previewPosition.slideIndex) {
                previewStartIndex = i
                break
            }
        }

        const previewHtml = previewSlides.map((slide, index) => {
            const globalIdx = slideCounter++
            // Hide slides before the selected preview position
            const isHidden = index < previewStartIndex
            const hiddenClass = isHidden ? ' tp-hidden' : ''
            const newPart = index > 0 && previewSlides[index - 1].partLabel !== slide.partLabel
            return renderSlide(slide, globalIdx, `tp-slide tp-preview${hiddenClass}`, newPart)
        }).join('')

        htmlParts.push(previewHtml)
    }

    return `
        ${modeOverlay}
        <div class="teleprompter-scroll" data-current-index="${currentGlobalIndex}" data-song-id="${liveSong?.id}" data-prev-song-id="${previousLiveSong?.id || ''}" data-preview-song-id="${previewSong?.id || ''}" data-preview-position="${previewPosition.partIndex}-${previewPosition.slideIndex}">
            <div class="tp-spacer-top"></div>
            ${htmlParts.join('')}
            <div class="tp-spacer-bottom"></div>
        </div>
    `
}

function renderSlide(slide: any, index: number, className: string, newPart: boolean): string {
    let style = ''
    if (newPart) {
        style = `margin-top: var(--cm-part-gap, 2rem);`
    }
    return `
        <div class="${className}" data-index="${index}" id="tp-slide-${index}" style="${style}">
            <div class="tp-part-indicator"><span>${slide.partLabel}</span></div>
            <div class="tp-content">
                <div class="tp-text">${slide.text.replace(/\n/g, '<br>')}</div>
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

    // Add new overlay if not in lyrics mode
    if (displayMode === 'black') {
        teleprompter.insertAdjacentHTML('afterbegin', '<div class="mode-overlay black"><span>BLACK</span></div>')
    } else if (displayMode === 'clear') {
        teleprompter.insertAdjacentHTML('afterbegin', '<div class="mode-overlay clear"><span>CLEAR</span></div>')
    } else if (displayMode === 'logo') {
        teleprompter.insertAdjacentHTML('afterbegin', '<div class="mode-overlay logo"><span>LOGO</span></div>')
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
        slide.classList.remove('tp-past', 'tp-current', 'tp-future')

        // Previous song slides are always "past"
        if (index < previousSlidesCount) {
            slide.classList.add('tp-past')
        } else {
            // Live song slides
            const liveIndex = index - previousSlidesCount
            if (liveIndex < liveSlides.length) {
                if (liveIndex < localCurrentIndex) {
                    slide.classList.add('tp-past')
                } else if (liveIndex === localCurrentIndex) {
                    slide.classList.add('tp-current')
                } else {
                    slide.classList.add('tp-future')
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

