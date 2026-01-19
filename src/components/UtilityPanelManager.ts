

import { store } from '../state/store'
import { UtilityRendererRegistry, genericUtilityRenderer, UtilityRendererContext } from './utility'

export class UtilityPanelManager {
    element: HTMLElement
    private resizerElement: HTMLElement | null = null
    private context: 'preview' | 'live'

    constructor(mountPoint: HTMLElement | string, resizerPoint: HTMLElement | string | null, context: 'preview' | 'live') {
        this.context = context

        // Resolve Mount Point
        if (typeof mountPoint === 'string') {
            const el = document.getElementById(mountPoint)
            if (!el) {
                console.error(`UtilityPanelManager: Mount point ID "${mountPoint}" not found in document.`)
                this.element = document.createElement('div')
            } else {
                this.element = el
            }
        } else {
            this.element = mountPoint
        }

        // Resolve Resizer Point
        if (resizerPoint) {
            if (typeof resizerPoint === 'string') {
                this.resizerElement = document.getElementById(resizerPoint)
            } else {
                this.resizerElement = resizerPoint
            }
        }


        // Initial State Check
        this.checkVisibility()
        this.render()

        // Subscribe to Store
        // Subscribe to State (Selection changes)
        // Subscribe to State (Selection changes)
        store.subscribe(() => {
            this.checkVisibility()
            this.render()
        })

        // Subscribe to Library (Data loading/Updates) - Fixes "Not loading in" race condition
        store.subscribeLibrary(() => {
            this.render() // Re-render content if library items appear
            // Note: Visibility depends on IDs in State, which shouldn't change just because Library loaded,
            // but if we were waiting for an item to exist to Render it, we need this.
            // Actually checkVisibility only checks if ID exists. render() checks if object exists.
        })
    }

    checkVisibility() {
        // If context is Preview, check Preview Item. 
        // If context is Live, check Live Item.
        const state = store.state
        let hasItem = false

        if (this.context === 'preview') {
            hasItem = !!state.preview.item_id
        } else {
            hasItem = !!state.live.item_id
        }

        // The User requested: "when nothing is loaded, the panel is hidden."
        // So we toggle display.
        const displayStyle = hasItem ? 'flex' : 'none'

        if (this.element.style.display !== displayStyle) {
            this.element.style.display = displayStyle

            // Also hide the resizer if the panel is hidden, otherwise it looks weird
            if (this.resizerElement) {
                this.resizerElement.style.display = displayStyle
            }
        }
    }

    render() {
        this.element.innerHTML = ''
        const state = store.state

        let item = null
        if (this.context === 'preview' && state.preview.item_id) {
            item = store.library.find(i => i.id === state.preview.item_id)
        } else if (this.context === 'live' && state.live.item_id) {
            item = store.library.find(i => i.id === state.live.item_id)
        }

        // Create Container - Flushed Style (No rounded corners, full width/height)
        const container = document.createElement('div')
        container.className = 'w-full h-full flex flex-col bg-gray-900 border-l border-gray-800'

        // Ensure relative positioning for absolute children
        container.style.position = 'relative'

        if (!item) {
            // If we have an ID but found no Item, it means the Library hasn't loaded it yet.
            // Show a loader instead of empty black box.
            container.innerHTML = `<div class="p-4 text-gray-500 text-xs">Loading metadata...</div>`
            this.element.appendChild(container)
            return
        }

        // Add Label
        const labelColor = this.context === 'preview' ? 'blue' : 'red'
        this.addLabel(container, this.context.toUpperCase(), labelColor)

        // Render Content
        this.renderContent(container, item)

        this.element.appendChild(container)
    }

    private addLabel(container: HTMLElement, text: string, color: 'blue' | 'red') {
        const label = document.createElement('div')
        // Flushed Label: sleek text overlay, no background box
        const textClass = color === 'blue' ? 'text-blue-500' : 'text-red-500'
        label.className = `absolute top-2 right-2 ${textClass} text-[9px] font-bold tracking-widest uppercase opacity-50 z-10 pointer-events-none`
        label.innerText = text
        container.appendChild(label)
    }

    private renderContent(container: HTMLElement, item: any) {
        const renderer = UtilityRendererRegistry.get(item.type) || genericUtilityRenderer
        const ctx: UtilityRendererContext = { context: this.context }
        renderer.render(container, item, ctx)
    }
}

