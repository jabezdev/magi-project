import { state } from '../state'


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
    const { liveItem, previousItem, liveContent, previousContent, liveMediaState } = state

    // 1. Handle Overrides
    let modeOverlay = ''
    if (!liveItem && !previousItem && liveContent.length === 0 && previousContent.length === 0) {
        return modeOverlay + '<div class="flex items-center justify-center flex-1 text-xl text-text-muted cm-empty">No content loaded</div>'
    }

    // DISPATCH BASED ON CONTENT
    // We prioritize showing the live content in a teleprompter style (multi-slide scrolling)
    // For single-slide media (video/image), we show a special view.

    const isMultiSlide = liveContent.length > 1 || (liveContent.length === 1 && liveItem?.type === 'song')

    if (isMultiSlide) {
        return buildUnifiedTeleprompter()
    }

    // --- SINGLE-SLIDE MEDIA VIEWS ---
    let contentHTML = ''

    if (liveItem) {
        switch (liveItem.type) {
            case 'video':
                const isHolding = liveMediaState.isCanvaHolding
                const holdText = isHolding ? '<span class="text-amber-400 animate-pulse">WAITING FOR CUE</span>' : ''
                contentHTML = `
                    <div class="flex flex-col items-center justify-center flex-1 h-full text-center">
                        <div class="text-6xl mb-4">🎥</div>
                        <div class="text-4xl text-white font-bold mb-2">${liveItem.title || 'Video'}</div>
                        <div class="text-2xl text-text-muted font-mono mb-8">${formatTime(liveMediaState.currentTime)} / ${formatTime(liveMediaState.duration)}</div>
                        <div class="text-3xl">${holdText}</div>
                    </div>
                 `
                break

            case 'image':
                contentHTML = `
                    <div class="flex items-center justify-center flex-1 h-full w-full p-4">
                        <img src="${liveItem.url || (liveContent[0]?.content)}" class="max-w-full max-h-full object-contain rounded-lg shadow-lg border border-border-color" />
                    </div>
                 `
                break

            case 'audio':
                contentHTML = `
                    <div class="flex flex-col items-center justify-center flex-1 h-full text-center gap-4">
                        <div class="text-6xl">🎵</div>
                        <div class="text-4xl text-white font-bold">${liveItem.title || 'Audio'}</div>
                        <div class="text-2xl text-text-muted font-mono">${formatTime(liveMediaState.currentTime)} / ${formatTime(liveMediaState.duration)}</div>
                    </div>
                `
                break

            case 'scripture':
            case 'slide':
                // Even if single slide, we can use teleprompter or a focused view
                const slide = liveContent[0]
                if (slide) {
                    contentHTML = `
                        <div class="flex flex-col items-center justify-center flex-1 h-full p-8 text-center">
                            <div class="text-2xl text-accent-primary mb-6 font-bold">${liveItem.title || ''}</div>
                             <div class="text-5xl text-white leading-relaxed">
                                 ${slide.content}
                             </div>
                        </div>
                     `
                }
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

/**
 * Unified Teleprompter - Handles Songs, Scripture Lists, and Presentations
 */
function buildUnifiedTeleprompter(): string {
    const { liveItem, liveContent, previousItem, previousContent, previewItem, previewContent, livePosition, previousPosition, previewPosition } = state

    let htmlParts: string[] = []
    let currentGlobalIndex = -1
    let slideCounter = 0

    // 1. Previous Content (Show current active block)
    if (previousContent.length > 0 && (!liveItem || previousItem?.id !== liveItem?.id)) {
        // Find range to show (only show the active part/block if it's a song)
        let startIndex = 0
        let endIndex = previousContent.length

        const activeSlide = previousContent[previousPosition]
        if (activeSlide?.partId) {
            // Show all slides from this part
            startIndex = previousContent.findIndex(s => s.partId === activeSlide.partId)
            endIndex = previousContent.findLastIndex((s: any) => s.partId === activeSlide.partId) + 1
        }

        const prevHtml = previousContent.map((slide, index) => {
            const idx = slideCounter++
            const isHidden = index < startIndex || index >= endIndex
            const hiddenClass = isHidden ? ' hidden' : ''
            const styleClass = isHidden ? 'past' : ''
            const newPart = index > 0 && previousContent[index - 1].partId !== slide.partId
            return renderSlide(slide, idx, `tp-slide ${styleClass}${hiddenClass}`, newPart)
        }).join('')

        htmlParts.push(prevHtml)
        htmlParts.push('<div class="w-full my-8 shrink-0 tp-divider" style="height: var(--cm-divider-height, 2px); background: var(--cm-divider-color, rgba(255, 255, 255, 0.2));"></div>')
    }

    // 2. Live Content
    if (liveContent.length > 0) {
        const liveHtml = liveContent.map((slide, index) => {
            const globalIdx = slideCounter++
            let slideClass = 'tp-slide'
            if (index < livePosition) slideClass += ' past'
            else if (index === livePosition) { slideClass += ' current'; currentGlobalIndex = globalIdx }
            else slideClass += ' future'

            const newPart = index > 0 && liveContent[index - 1].partId !== slide.partId
            return renderSlide(slide, globalIdx, slideClass, newPart)
        }).join('')
        htmlParts.push(liveHtml)
    }

    // 3. Preview Content (Medley support)
    if (previewContent.length > 0 && previewItem?.id !== liveItem?.id) {
        htmlParts.push('<div class="w-full my-8 shrink-0 tp-divider" style="height: var(--cm-divider-height, 2px); background: var(--cm-divider-color, rgba(255, 255, 255, 0.2));"></div>')

        const previewHtml = previewContent.map((slide, index) => {
            const globalIdx = slideCounter++
            const isHidden = index < previewPosition
            const hiddenClass = isHidden ? ' hidden' : ''
            const newPart = index > 0 && previewContent[index - 1].partId !== slide.partId
            return renderSlide(slide, globalIdx, `tp-slide preview${hiddenClass}`, newPart)
        }).join('')
        htmlParts.push(previewHtml)
    }

    return `
        <div class="flex flex-col items-stretch w-full will-change-transform transition-transform duration-[400ms] ease-out teleprompter-scroll" 
             data-current-index="${currentGlobalIndex}" 
             data-item-id="${liveItem?.id || ''}" 
             data-prev-item-id="${previousItem?.id || ''}" 
             data-preview-item-id="${previewItem?.id || ''}" 
             data-preview-position="${previewPosition}">
            <div class="shrink-0 h-[40vh] tp-spacer-top"></div>
            ${htmlParts.join('')}
            <div class="shrink-0 h-[40vh] tp-spacer-bottom"></div>
        </div>
    `
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
    const label = slide.label || ''

    return `
        <div class="flex items-stretch w-full transition-all duration-500 ease-in-out py-6 ${className}" data-index="${index}" id="tp-slide-${index}" style="${style} margin-bottom: var(--cm-slide-gap, 0);">
            <div class="flex items-center justify-center w-10 shrink-0 relative tp-part-indicator">
                <span class="absolute whitespace-nowrap text-[0.7rem] font-bold uppercase tracking-[2px] rotate-[-90deg] ${isCurrent ? 'text-accent-primary' : 'text-text-muted'}">${label}</span>
            </div>
            <div class="flex-1 flex items-center pl-4 tp-content">
                <div class="tp-text ${isCurrent ? 'text-text-primary font-medium' : 'text-text-secondary'}" style="${textStyle}">${(slide.content || '').replace(/\n/g, '<br>')}</div>
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
    const { displayMode, liveItem, previousItem, previewItem, previewPosition } = state
    const teleprompter = document.querySelector('.cm-teleprompter')
    const existingScroll = teleprompter?.querySelector('.teleprompter-scroll')

    if (!teleprompter) return

    // Check if item changed - need full rebuild
    const currentItemId = existingScroll?.getAttribute('data-item-id')
    const newItemId = liveItem?.id?.toString() || ''
    const itemChanged = !existingScroll || currentItemId !== newItemId

    // Also track previous/preview item IDs to detect structure changes
    const currentPrevItemId = existingScroll?.getAttribute('data-prev-item-id') || ''
    const currentPreviewItemId = existingScroll?.getAttribute('data-preview-item-id') || ''
    const currentPreviewPosition = existingScroll?.getAttribute('data-preview-position') || ''

    const newPrevItemId = previousItem?.id?.toString() || ''
    const newPreviewItemId = previewItem?.id?.toString() || ''
    const newPreviewPosition = previewPosition.toString()

    // Core structure changes (require full rebuild)
    const coreStructureChanged = itemChanged || currentPrevItemId !== newPrevItemId

    // Preview-only change (can rebuild without jarring scroll reset)
    const previewOnlyChange = !coreStructureChanged && (
        currentPreviewItemId !== newPreviewItemId ||
        currentPreviewPosition !== newPreviewPosition
    )

    const structureChanged = coreStructureChanged || previewOnlyChange

    // Save current scroll transform before any DOM changes
    const savedTransform = (existingScroll as HTMLElement)?.style?.transform || ''

    const doUpdate = () => {
        updateModeOverlay(teleprompter, displayMode)
        if (structureChanged) {
            // Full rebuild when content structure changes
            updateHTML(teleprompter, buildTeleprompterContent())

            const newScrollContainer = teleprompter.querySelector('.teleprompter-scroll') as HTMLElement
            if (newScrollContainer) {
                if (previewOnlyChange) {
                    newScrollContainer.style.transition = 'none'
                    newScrollContainer.style.transform = savedTransform
                    void newScrollContainer.offsetHeight
                    newScrollContainer.style.transition = ''
                    scrollToSlide(parseInt(newScrollContainer.getAttribute('data-current-index') || '0'), false)
                } else {
                    scrollToCurrentSlide(true)
                }
            }
        } else {
            // Efficient update: just update CSS classes
            updateSlideClasses()
        }
    }

    // Determine transition settings
    const { type, duration } = state.confidenceMonitorSettings.transitions || { type: 'crossfade', duration: 0.5 }
    const useTransition = type !== 'none' && (itemChanged || displayMode !== (teleprompter.getAttribute('data-prev-mode') || ''))

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
    const { liveItem, previousItem } = state
    if (liveItem || previousItem) return

    // Add new overlay if not in lyrics mode
    const overlayClass = "absolute inset-0 flex items-center justify-center w-full h-full z-[10] mode-overlay";
    if (displayMode === 'black') {
        teleprompter.insertAdjacentHTML('afterbegin', `<div class="${overlayClass} bg-black text-[#333]"></div>`)
    } else if (displayMode === 'clear' || displayMode === 'logo') {
        teleprompter.insertAdjacentHTML('afterbegin', `<div class="${overlayClass} bg-transparent"></div>`)
    }
}

/**
 * Efficiently update slide classes without rebuilding entire DOM.
 * This is used when only the position changes within the same song structure.
 */
function updateSlideClasses(): void {
    const { liveContent, livePosition, previousContent } = state
    if (liveContent.length === 0) return

    const previousSlidesCount = previousContent.length > 0 ? previousContent.length : 0
    const globalCurrentIndex = previousSlidesCount + livePosition

    document.querySelectorAll('.tp-slide').forEach((slide, index) => {
        slide.classList.remove('past', 'current', 'future')
        const indicator = slide.querySelector('.tp-part-indicator span')
        const text = slide.querySelector('.tp-text')

        if (indicator) indicator.className = 'absolute whitespace-nowrap text-[0.7rem] font-bold uppercase tracking-[2px] rotate-[-90deg] text-text-muted';
        if (text) text.className = 'tp-text text-text-secondary';
        (slide as HTMLElement).style.opacity = 'var(--cm-prev-next-opacity, 0.35)';

        if (index < previousSlidesCount) {
            slide.classList.add('past')
        } else if (index < previousSlidesCount + liveContent.length) {
            const liveIndex = index - previousSlidesCount
            if (liveIndex < livePosition) {
                slide.classList.add('past')
            } else if (liveIndex === livePosition) {
                slide.classList.add('current')
                if (indicator) indicator.className = 'absolute whitespace-nowrap text-[0.7rem] font-bold uppercase tracking-[2px] rotate-[-90deg] text-accent-primary';
                if (text) text.className = 'tp-text text-text-primary font-medium';
                (slide as HTMLElement).style.opacity = '1';
            } else {
                slide.classList.add('future')
            }
        }
    })

    const scrollContainer = document.querySelector('.teleprompter-scroll') as HTMLElement
    if (scrollContainer) {
        scrollContainer.setAttribute('data-current-index', String(globalCurrentIndex))
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

