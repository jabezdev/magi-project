import { store } from '../state/store'
import { LibraryItem, Schedule, ScheduleItem } from '../types'
import { v4 as uuidv4 } from 'uuid'
import { api } from '../services/api'

import { ScheduleRendererRegistry } from './schedule/registry'
import { ScheduleItemContext } from './schedule/types'

export class SchedulePanel {
    element: HTMLElement
    private currentSchedule: Schedule | null = null

    constructor() {
        this.element = document.createElement('div')
        this.element.className = 'flex flex-col h-full bg-gray-900 text-white'

        this.renderShell()
        this.initSync()

        // Listen for global "add-to-schedule" events
        window.addEventListener('add-to-schedule', (e: any) => {
            if (e.detail) this.addItem(e.detail)
        })
    }

    initSync() {
        // subscribe to store changes
        store.subscribe((state) => {
            if (state.active_schedule_id !== this.currentSchedule?.id) {
                this.loadActiveSchedule(state.active_schedule_id)
            }
        })

        // Initial load
        this.loadActiveSchedule(store.state.active_schedule_id)
    }

    async loadActiveSchedule(id: string | null) {
        if (!id) {
            this.currentSchedule = null
            this.updateHeader()
            this.renderList()
            return
        }

        try {
            // Fetch as any first, then cast if type matches
            const item = await api.library.get(id)
            if (item.type === 'schedule') {
                this.currentSchedule = item as Schedule
                this.currentSchedule.items = this.currentSchedule.items || [] // ensure array
                this.updateHeader()
                this.renderList()
            }
        } catch (e) {
            console.error('Failed to load schedule', e)
        }
    }

    async saveSchedule(summary: string) {
        if (!this.currentSchedule) return

        try {
            this.currentSchedule.updated_at = new Date().toISOString()
            // Optimistic update
            this.renderList()

            // Persist
            await api.library.update(this.currentSchedule.id, this.currentSchedule, summary)
        } catch (e) {
            console.error('Failed to save schedule', e)
        }
    }

    renderShell() {
        this.element.innerHTML = `
            <div class="panel-header bg-gray-900 border-b border-gray-700 flex h-12 select-none items-stretch">
                <div class="px-3 flex items-center bg-gray-800 text-xs font-bold text-gray-400 border-r border-gray-700 whitespace-nowrap tracking-wider h-full">SCHEDULE</div>
                <div class="flex-1 relative group bg-gray-900 h-full min-w-0">
                    <button id="btn-schedule-dropdown" class="w-full h-full text-left px-3 text-sm font-medium text-gray-200 hover:bg-gray-800 hover:text-white flex justify-between items-center  min-w-0">
                        <span id="current-schedule-name" class="truncate mr-2">No Schedule Loaded</span>
                        <svg class="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    <!-- Dropdown embedded here (omitted for brevity, assume same structure) -->
                </div>
            </div>
            
            <div id="schedule-list" class="flex-1 overflow-y-auto p-0 relative min-h-[100px] pb-8">
                <div class="text-center text-gray-600 text-xs mt-8 pointer-events-none">
                    Drag items here...
                </div>
            </div>
        `

        // Drag Handling
        const list = this.element.querySelector('#schedule-list') as HTMLElement
        list.addEventListener('dragover', (e) => { e.preventDefault(); list.classList.add('bg-gray-800/20') })
        list.addEventListener('dragleave', () => list.classList.remove('bg-gray-800/20'))
        list.addEventListener('drop', (e) => {
            e.preventDefault()
            list.classList.remove('bg-gray-800/20')
            const data = e.dataTransfer?.getData('application/json')
            if (data) {
                try {
                    const item = JSON.parse(data)
                    this.addItem(item)
                } catch (err) { console.error(err) }
            }
        })

        // Dropdown Menu
        this.element.querySelector('#btn-schedule-dropdown')?.addEventListener('click', (e) => {
            e.stopPropagation()
            this.toggleScheduleMenu(e.target as HTMLElement)
        })
    }

    async toggleScheduleMenu(target: HTMLElement) {
        // Close existing
        document.getElementById('schedule-menu-popover')?.remove()

        const popover = document.createElement('div')
        popover.id = 'schedule-menu-popover'
        popover.className = 'fixed z-50 bg-gray-900 border border-gray-700 shadow-xl flex flex-col min-w-[240px] rounded-lg overflow-hidden'

        // Position
        const btn = target.closest('#btn-schedule-dropdown') as HTMLElement || target
        const rect = btn.getBoundingClientRect()
        popover.style.top = `${rect.bottom + 4}px`
        popover.style.left = `${rect.left}px`
        popover.style.width = `${rect.width}px`

        // Loading state
        popover.innerHTML = '<div class="p-3 text-xs text-center text-gray-500 italic">Loading schedules...</div>'
        document.body.appendChild(popover)

        try {
            const schedules = await api.library.list('schedule')
            // Sort by updated_at desc
            schedules.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

            let html = '<div class="max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col">'

            if (schedules.length === 0) {
                html += '<div class="p-3 text-xs text-center text-gray-500">No schedules found</div>'
            } else {
                schedules.forEach(sched => {
                    const activeClass = this.currentSchedule?.id === sched.id ? 'bg-blue-900/30 text-blue-400' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    const dateStr = new Date(sched.updated_at).toLocaleDateString()
                    html += `
                        <button class="menu-item-schedule w-full text-left px-4 py-3 border-b border-gray-800 last:border-0 transition-colors ${activeClass}" data-id="${sched.id}">
                            <div class="font-bold text-sm truncate">${sched.title}</div>
                            <div class="text-[10px] text-gray-500 mt-0.5">Last edited: ${dateStr}</div>
                        </button>
                    `
                })
            }
            html += '</div>'

            // New Schedule Button (Pinned Bottom)
            html += `
                <button id="btn-new-schedule" class="w-full text-center py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-colors border-t border-gray-700">
                    + New Schedule
                </button>
            `

            popover.innerHTML = html

            // Bind Events
            popover.querySelectorAll('.menu-item-schedule').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id')
                    if (id) {
                        store.setState({ active_schedule_id: id })
                        popover.remove()
                    }
                })
            })

            popover.querySelector('#btn-new-schedule')?.addEventListener('click', async () => {
                const name = prompt('Schedule Name:', 'New Service')
                if (name) {
                    const newSched = await api.library.create({
                        type: 'schedule',
                        title: name,
                        date: new Date().toISOString(),
                        items: []
                    } as any)
                    store.setState({ active_schedule_id: newSched.id })
                    popover.remove()
                }
            })

        } catch (e) {
            popover.innerHTML = '<div class="p-3 text-xs text-red-500">Failed to load schedules</div>'
        }

        // Clean up
        const close = (e: MouseEvent) => {
            if (!popover.contains(e.target as Node) && !btn.contains(e.target as Node)) {
                popover.remove()
                document.removeEventListener('click', close)
            }
        }
        setTimeout(() => document.addEventListener('click', close), 0)
    }

    updateHeader() {
        const el = this.element.querySelector('#current-schedule-name')
        if (el) el.textContent = this.currentSchedule ? this.currentSchedule.title : 'No Schedule Loaded'
    }

    addItem(libraryItem: LibraryItem) {
        if (!this.currentSchedule) {
            alert('Please create or open a schedule first.')
            return
        }

        const newItem: ScheduleItem = {
            id: uuidv4(),
            schedule_id: this.currentSchedule.id,
            library_item_id: libraryItem.id,
            order_index: this.currentSchedule.items.length,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            // Default overrides
            arrangement_id: (libraryItem.type === 'song' && (libraryItem as any).arrangements?.[0]?.id) || undefined
        }

        this.currentSchedule.items.push(newItem)
        this.saveSchedule(`Added item: ${libraryItem.title}`)
    }

    removeItem(id: string) {
        if (!this.currentSchedule) return
        this.currentSchedule.items = this.currentSchedule.items.filter(i => i.id !== id)
        this.saveSchedule('Removed item')
    }

    async renderList() {
        const list = this.element.querySelector('#schedule-list')
        if (!list) return

        if (!this.currentSchedule || this.currentSchedule.items.length === 0) {
            list.innerHTML = `<div class="text-center text-gray-600 text-xs mt-8 pointer-events-none">${this.currentSchedule ? 'Drag items here...' : 'No Schedule Active'}</div>`
            return
        }

        list.innerHTML = ''
        const items = this.currentSchedule.items

        for (const item of items) {
            let libItem: LibraryItem | undefined | null = store.library.find(i => i.id === item.library_item_id)
            if (!libItem) libItem = await api.library.get(item.library_item_id).catch(() => null) || undefined

            // If still not found, we might want to render a placeholder or skip
            // For now, if we have no libItem, we can't determine type easily unless we store it on ScheduleItem
            // But ScheduleItem doesn't enforce type.
            // We can try to guess or use a fallback.
            if (!libItem) {
                console.warn('Library item not found for schedule item', item.id)
                continue
            }

            const renderer = ScheduleRendererRegistry.get(libItem.type)
            if (renderer) {
                const ctx: ScheduleItemContext = {
                    onPreview: (schedItem) => store.setPreviewItem(schedItem.library_item_id, schedItem.id),
                    onRemove: (schedItem) => this.removeItem(schedItem.id),
                    onOpenOverride: (target, schedItem) => this.openOverridePopover(target, schedItem)
                }
                const el = renderer.renderItem(item, libItem, ctx)
                list.appendChild(el)
            }
        }
    }

    openOverridePopover(target: HTMLElement, item: ScheduleItem) {
        // Close existing
        document.getElementById('override-popover')?.remove()

        const popover = document.createElement('div')
        popover.id = 'override-popover'
        popover.className = 'fixed z-50 bg-gray-800 border border-gray-600 shadow-xl rounded w-48 text-white p-2 flex flex-col gap-2'

        const rect = target.getBoundingClientRect()
        popover.style.top = `${rect.bottom + 5}px`
        popover.style.left = `${rect.left}px`

        // Content based on type? 
        // We need library item type to know what to offer.
        // For now, generic overrides:

        popover.innerHTML = `
            <div class="text-[10px] font-bold text-gray-500 uppercase pb-1 border-b border-gray-700 mb-1">Item Options</div>
            
            <!-- Arrangement (Songs) -->
            <button class="text-left text-xs p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white flex justify-between group">
                Change Arrangement 
                <span class="opacity-0 group-hover:opacity-100">›</span>
            </button>
            
            <!-- Translation (Scripture) -->
            <button class="text-left text-xs p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white flex justify-between group" id="btn-trans">
                Change Translation
                <span class="opacity-0 group-hover:opacity-100">›</span>
            </button>
            
            <!-- Background -->
            <button class="text-left text-xs p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white flex justify-between group">
                Override Background
                <span class="opacity-0 group-hover:opacity-100">›</span>
            </button>
        `

        document.body.appendChild(popover)

        // Translation Click
        popover.querySelector('#btn-trans')?.addEventListener('click', () => {
            // Mock translation swap
            const translations = ['NIV', 'ESV', 'KJV', 'NASB']
            const subMenu = document.createElement('div')
            subMenu.className = 'fixed z-50 bg-gray-800 border border-gray-600 shadow-xl rounded w-24 text-white'
            subMenu.style.top = popover.style.top
            subMenu.style.left = `${parseInt(popover.style.left) + 190}px`

            subMenu.innerHTML = translations.map(t => `
                <button class="w-full text-left text-xs p-2 hover:bg-blue-600 ${item.translation_override === t ? 'text-blue-200' : 'text-gray-300'}">
                    ${t}
                </button>
            `).join('')

            document.body.appendChild(subMenu)

            subMenu.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    const t = btn.textContent?.trim()
                    // Update item
                    const index = this.currentSchedule?.items.findIndex(i => i.id === item.id)
                    if (index !== undefined && index !== -1 && this.currentSchedule) {
                        this.currentSchedule.items[index].translation_override = t || undefined
                        this.saveSchedule(`Changed translation to ${t}`)
                    }
                    subMenu.remove()
                    popover.remove()
                })
            })

            // Clean up submenu
            const closeSub = () => { subMenu.remove(); document.removeEventListener('click', closeSub) }
            setTimeout(() => document.addEventListener('click', closeSub), 0)
        })

        // Clean up popover
        const close = () => { if (!popover.contains(document.activeElement)) popover.remove(); document.removeEventListener('click', close) }
        setTimeout(() => document.addEventListener('click', close), 0)
    }
}
