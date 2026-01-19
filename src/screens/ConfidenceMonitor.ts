import { store } from '../state/store'
import { LibraryItem, GlobalSettings } from '../types'
import { api } from '../services/api'
import { BehaviorRegistry } from '../behaviors/registry'
import { ConfidenceContext } from '../behaviors/types'

export class ConfidenceMonitor {
    element: HTMLElement
    private currentItem: LibraryItem | null = null

    private currentSlideIndex: number = 0


    constructor() {
        this.element = document.createElement('div')
        this.element.className = 'w-full h-full bg-black text-white flex flex-col overflow-hidden font-sans'

        this.renderShell()
        this.startClock()

        // Subscribe to settings changes
        store.subscribeSettings((settings) => {

            this.applySettings(settings)
        })

        store.subscribe(state => {
            // Update Next Item Display
            this.updateNextItemDisplay(state.live.item_id || undefined)

            // Update Live Item
            if (state.live.item_id !== this.currentItem?.id) {
                if (state.live.item_id) {
                    this.currentSlideIndex = 0 // Reset on new item
                    this.loadItem(state.live.item_id)
                } else {
                    this.clear()
                }
            } else {
                // Same item, check index
                if (state.live.slide_index !== undefined && state.live.slide_index !== this.currentSlideIndex) {
                    this.currentSlideIndex = state.live.slide_index
                    this.renderContent()
                }
            }
        })
    }

    /**
     * Apply settings to the screen's CSS variables
     */
    private applySettings(settings: GlobalSettings) {
        const confSettings = settings.confidenceMonitorSettings
        const el = this.element

        // Apply font settings
        el.style.setProperty('--conf-font-family', confSettings.fontFamily)
        el.style.setProperty('--conf-font-size', `${confSettings.fontSize}rem`)
        el.style.setProperty('--conf-line-height', `${confSettings.lineHeight}`)
        el.style.setProperty('--conf-prev-next-opacity', `${confSettings.prevNextOpacity}`)
        el.style.setProperty('--conf-clock-size', `${confSettings.clockSize}rem`)
        el.style.setProperty('--conf-part-gap', `${confSettings.partGap}rem`)
        el.style.setProperty('--conf-slide-gap', `${confSettings.slideGap}rem`)

        // Apply margins
        el.style.setProperty('--conf-margin-top', `${confSettings.marginTop}rem`)
        el.style.setProperty('--conf-margin-bottom', `${confSettings.marginBottom}rem`)
        el.style.setProperty('--conf-margin-left', `${confSettings.marginLeft}rem`)
        el.style.setProperty('--conf-margin-right', `${confSettings.marginRight}rem`)
    }


    renderShell() {
        // Teleprompter Layout: 
        // Top: Previous Slides (Dimmed)
        // Middle: Current Slide (High Vis)
        // Bottom: Next Slides (Dimmed) + Arrangement Strip
        // Footer: Clock + Next Item
        this.element.innerHTML = `
            <div id="conf-content" class="flex-1 flex flex-col relative overflow-hidden">
                <!-- Previous Slides (scrolled up) -->
                <div id="conf-prev" class="h-1/5 bg-[#050505] flex flex-col justify-end px-12 pb-2 opacity-50 overflow-hidden border-b border-gray-900 transition-all duration-300">
                </div>

                <!-- Current Slide -->
                <div id="conf-current" class="flex-1 flex flex-col p-8 items-center justify-center text-center bg-black relative z-10 w-full">
                     <div class="text-gray-600 text-2xl animate-pulse font-medium tracking-wide">CONFIDENCE MONITOR READY</div>
                </div>

                <!-- Next Slides -->
                <div id="conf-next" class="h-1/5 bg-[#050505] flex flex-col justify-start px-12 pt-2 opacity-60 overflow-hidden border-t border-gray-900 transition-all duration-300">
                </div>
                
                <!-- Countdown Overlay (for videos) -->
                <div id="conf-countdown" class="absolute top-4 right-4 text-8xl font-mono font-bold text-red-600 drop-shadow-lg hidden z-50 tracking-tighter">
                    -00:00
                </div>

                <!-- Arrangement Strip -->
                <div id="conf-arrangement" class="bg-black border-t border-gray-900 px-2 py-1 flex gap-1 overflow-x-auto hidden shrink-0 h-14 items-center scrollbar-hide">
                </div>
            </div>

            <!-- Footer: Clock & Status -->
            <div class="h-20 bg-[#050505] border-t-2 border-gray-800 flex justify-between items-center px-10 shrink-0">
                 <div class="flex items-center gap-6 overflow-hidden">
                     <div id="conf-msg" class="text-2xl font-bold text-blue-500 truncate max-w-xl"></div>
                     <div class="text-gray-500 text-lg font-mono bg-gray-900 px-3 py-1 rounded" id="conf-slide-info"></div>
                 </div>
                 <div class="flex items-center gap-8">
                     <div class="flex flex-col items-end">
                        <div class="text-xs text-gray-500 uppercase font-bold tracking-widest">Next Item</div>
                        <div id="conf-next-item" class="text-xl text-white font-bold truncate max-w-xs">--</div>
                     </div>
                     <div class="w-px h-10 bg-gray-700"></div>
                     <div id="conf-clock" class="text-5xl font-bold font-mono text-yellow-500 tracking-wider tabular-nums">--:--</div>
                 </div>
            </div>
            </div>
        `
    }

    startClock() {
        const update = () => {
            const now = new Date()
            // 12-hour format
            let hours = now.getHours()
            const ampm = hours >= 12 ? 'PM' : 'AM'
            hours = hours % 12
            hours = hours ? hours : 12 // the hour '0' should be '12'
            const minutes = now.getMinutes().toString().padStart(2, '0')

            const timeString = `${hours}:${minutes}<span class="text-2xl text-gray-600 ml-1">${ampm}</span>`
            const el = this.element.querySelector('#conf-clock')
            if (el) el.innerHTML = timeString
        }
        update()
        setInterval(update, 1000)
    }

    updateNextItemDisplay(currentId: string | undefined) {
        const nextItemEl = this.element.querySelector('#conf-next-item')
        if (!nextItemEl) return

        // Find current item index in schedule
        // Note: Ideally the "Live Item" ID corresponds to a Schedule Item ID or Library ID
        // Note: The store currently assumes flattened schedule logic might be needed
        // For now, let's just search the schedule list

        const schedule = store.schedule
        let nextTitle = "--"
        const liveItem = currentId ? store.library.find(i => i.id === currentId) : null

        const getItemTitle = (sItem: import('../types').ScheduleItem) => {
            if (sItem.label) return sItem.label
            const libItem = store.library.find(li => li.id === sItem.library_item_id)
            return libItem?.title || 'Untitled Item'
        }

        if (schedule.length > 0) {
            let idx = -1

            // Try 1: Match by exact Schedule ID (if we tracked it in state, currently state only has library item_id)
            // Ideally state.live should have 'schedule_item_id'

            // Try 2: Match by Library Item ID
            // Problem: If the same song is in schedule twice, this always finds the first one.
            // We need a heuristic or state improvement. For now, find the *first* occurrence? 
            // Better: If we have a previous known index, search after that? Too complex for now.
            // Let's assume the first match for now, or improve if we add schedule_item_id to state later.
            idx = schedule.findIndex(i => i.library_item_id === currentId)

            if (idx !== -1) {
                if (idx < schedule.length - 1) {
                    nextTitle = getItemTitle(schedule[idx + 1])
                } else {
                    nextTitle = "End of Service"
                }
            } else {
                // Current item is Live but NOT in schedule (Ad-Hoc)
                // Logic: Show the FIRST item of the schedule as "Coming Up"?
                // Or "Resuming: [First Item]"?
                if (liveItem) {
                    nextTitle = getItemTitle(schedule[0]) + " (Up Next)"
                } else {
                    // Nothing live, show first
                    nextTitle = getItemTitle(schedule[0])
                }
            }
        } else {
            nextTitle = "No Schedule"
        }

        nextItemEl.textContent = nextTitle
    }

    async loadItem(id: string) {
        try {
            // Check cache first
            let item = store.library.find(i => i.id === id)
            if (!item) item = await api.library.get(id)

            this.currentItem = item

            // Sync initial index if coming from store state (e.g. joined late)
            this.currentSlideIndex = store.state.live.slide_index || 0

            this.renderContent()
        } catch (e) {
            console.error(e)
        }
    }

    renderContent() {
        const currentContainer = this.element.querySelector('#conf-current') as HTMLElement
        const nextContainer = this.element.querySelector('#conf-next') as HTMLElement
        const prevContainer = this.element.querySelector('#conf-prev') as HTMLElement
        const stripContainer = this.element.querySelector('#conf-arrangement') as HTMLElement
        const msgEl = this.element.querySelector('#conf-msg')
        const infoEl = this.element.querySelector('#conf-slide-info') as HTMLElement
        const countdownEl = this.element.querySelector('#conf-countdown')

        if (!currentContainer || !nextContainer || !this.currentItem) return

        const item = this.currentItem
        if (msgEl) msgEl.textContent = item.title
        if (countdownEl) countdownEl.classList.add('hidden') // Default hidden


        const ctx: ConfidenceContext = {
            currentContainer,
            nextContainer,
            prevContainer,
            stripContainer,
            infoContainer: infoEl,
            settings: store.settings || undefined
        }

        const behavior = BehaviorRegistry.get(item.type)
        if (behavior && behavior.renderConfidence) {
            behavior.renderConfidence(item, ctx)
        } else {
            // Fallback
            currentContainer.innerHTML = `<div class="text-gray-500 text-4xl">Unsupported Content: ${item.type}</div>`
        }
    }

    clear() {
        this.currentItem = null
        const container = this.element.querySelector('#conf-current')
        const nextContainer = this.element.querySelector('#conf-next')
        const prevContainer = this.element.querySelector('#conf-prev')
        const msgEl = this.element.querySelector('#conf-msg')
        const countdownEl = this.element.querySelector('#conf-countdown')

        if (msgEl) msgEl.textContent = ''
        if (countdownEl) countdownEl.classList.add('hidden')

        if (container) {
            container.className = "flex-1 flex flex-col p-8 items-center justify-center text-center bg-black"
            container.innerHTML = '<div class="text-gray-600 text-3xl animate-pulse">Waiting for Live Content...</div>'
        }
        if (nextContainer) nextContainer.innerHTML = ''
        if (prevContainer) prevContainer.innerHTML = ''
    }
}
