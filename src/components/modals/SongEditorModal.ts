// Modal is available if needed for future use
import { api } from '../../services/api'
import { v4 as uuidv4 } from 'uuid'
import { store } from '../../state/store'
import { SongPartCard, SongPartData } from '../editor/SongPartCard'
import { ArrangementEditor } from '../editor/ArrangementEditor'
import { SongItem } from '../../types'
import { showToast } from './ConfirmModal'
import { openMediaPicker } from './MediaPickerModal'

export class SongEditorModal {
    element: HTMLElement
    data: Partial<SongItem>
    parts: SongPartData[] = []
    arrangementEditor?: ArrangementEditor
    private hasChanges: boolean = false
    private originalDataHash: string = ''

    // Column widths in percentage
    col1Width: number = 20
    col2Width: number = 40
    col3Width: number = 40

    dragging: 'col1' | 'col2' | null = null

    constructor(existingSong?: SongItem) {
        this.data = existingSong ? { ...existingSong } : {
            id: uuidv4(),
            type: 'song',
            title: '',
            artist: '',
            key: '',
            tempo: 0,
            time_signature: '4/4',
            arrangements: []
        }

        // Hydrate parts if existing
        if (existingSong && existingSong.parts) {
            this.parts = existingSong.parts.map(p => ({
                id: p.id,
                type: p.type,
                label: p.label,
                lyrics: p.lyrics
            }))
        } else {
            // Default blank part
            this.parts = [
                { id: uuidv4(), type: 'Verse', label: 'V 1', lyrics: '' }
            ]
        }

        this.element = document.createElement('div')
        this.element.className = 'fixed inset-0 z-50 bg-[#09090b] flex flex-col text-sm text-zinc-300 font-sans'

        // Store original hash for change detection
        this.originalDataHash = JSON.stringify(this.parts)

        this.render()
        this.updateBackgroundPreview() // Initial render of bg
        document.body.appendChild(this.element)

        this.attachResizeListeners()
    }

    render() {
        const partsText = this.parts.length === 1 ? '1 PART' : `${this.parts.length} PARTS`

        this.element.innerHTML = `
            <!-- BODY (No top header - all controls in columns) -->
            <div class="flex-1 flex overflow-hidden relative" id="editor-body">
                
                <!-- COL 1: METADATA -->
                <div class="flex flex-col border-r border-zinc-800 bg-[#09090b]" style="width: ${this.col1Width}%" id="col-1">
                    <!-- Header with Back and Parts Counter -->
                    <div class="flex items-center justify-between h-12 border-b border-zinc-800 shrink-0 px-2 bg-[#09090b]">
                        <button id="btn-back" class="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white rounded hover:bg-zinc-800 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        
                        <div class="flex items-center gap-3">
                             <div class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider px-2" id="parts-counter">${partsText}</div>
                        </div>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

                        
                        <!-- MAIN INFO -->
                        <div class="space-y-4">
                            <div>
                                <label class="text-[10px] items-center gap-1 text-zinc-500 font-bold uppercase mb-1 flex">Title <span class="text-red-500">*</span></label>
                                <input type="text" id="input-title" class="w-full bg-zinc-800 border border-zinc-700 focus:border-zinc-500 rounded-sm p-2 text-sm text-white focus:ring-0 outline-none transition-colors placeholder-zinc-600 font-bold" placeholder="Amazing Grace" value="${this.data.title || ''}" />
                            </div>
                            <div>
                                <label class="text-[10px] items-center gap-1 text-zinc-500 font-bold uppercase mb-1 flex">Artist <span class="text-red-500">*</span></label>
                                <input type="text" id="input-artist" class="w-full bg-zinc-800 border border-zinc-700 focus:border-zinc-500 rounded-sm p-2 text-sm text-white focus:ring-0 outline-none transition-colors placeholder-zinc-600" placeholder="John Newton" value="${this.data.artist || ''}" />
                            </div>
                        </div>

                        <div class="h-px bg-zinc-800 w-full"></div>

                        <!-- PROPERTIES -->
                        <div>
                            <h3 class="text-xs font-bold text-zinc-400 uppercase mb-4">Properties</h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="text-[10px] text-zinc-600 font-bold uppercase mb-1 block">KEY</label>
                                    <input type="text" id="input-key" class="w-full bg-zinc-800 border border-zinc-700 focus:border-zinc-500 rounded-sm p-2 text-xs text-zinc-300 focus:ring-0 outline-none font-mono" value="${this.data.key || ''}" />
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="text-[10px] text-zinc-600 font-bold uppercase mb-1 block">TEMPO</label>
                                        <input type="number" id="input-tempo" class="w-full bg-zinc-800 border border-zinc-700 focus:border-zinc-500 rounded-sm p-2 text-xs text-zinc-300 focus:ring-0 outline-none font-mono" value="${this.data.tempo || ''}" />
                                    </div>
                                    <div>
                                        <label class="text-[10px] text-zinc-600 font-bold uppercase mb-1 block">TIME SIG</label>
                                        <input type="text" id="input-timesig" class="w-full bg-zinc-800 border border-zinc-700 focus:border-zinc-500 rounded-sm p-2 text-xs text-zinc-300 focus:ring-0 outline-none font-mono" value="${this.data.time_signature || ''}" />
                                    </div>
                                </div>
                                <div>
                                    <label class="text-[10px] text-zinc-600 font-bold uppercase mb-1 block">CCLI #</label>
                                    <input type="text" id="input-ccli" class="w-full bg-zinc-800 border border-zinc-700 focus:border-zinc-500 rounded-sm p-2 text-xs text-zinc-300 focus:ring-0 outline-none font-mono" value="${this.data.ccli_number || ''}" />
                                </div>
                            </div>
                        </div>

                        <div class="h-px bg-zinc-800 w-full"></div>

                        <!-- BACKGROUND -->
                        <div>
                             <h3 class="text-xs font-bold text-zinc-400 uppercase mb-3">Default Background</h3>
                             <div id="bg-picker-trigger" class="aspect-video bg-zinc-900/50 rounded border border-zinc-800 flex items-center justify-center text-zinc-700 text-xs cursor-pointer hover:border-zinc-600 transition-colors hover:text-zinc-500 border-dashed overflow-hidden relative group">
                                <span class="group-hover:opacity-0 transition-opacity">Drop Media Here</span>
                             </div>
                        </div>

                        <!-- DELETE BUTTON (Pushed to bottom) -->
                        <div class="mt-auto">
                             <button id="btn-delete-song" class="w-full h-10 border-t border-zinc-800 bg-zinc-900/50 hover:bg-red-600/10 text-zinc-500 hover:text-red-500 hover:border-red-900/30 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2 group">
                                <svg class="w-4 h-4 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                Delete Song
                             </button>
                        </div>
                    </div>
                </div>

                <!-- RESIZER 1 -->
                <div class="w-1 bg-[#09090b] hover:bg-blue-600 cursor-col-resize z-10 flex-none transition-colors" id="resizer-1"></div>

                <!-- COL 2: PARTS -->
                <div class="flex flex-col bg-[#0c0c0e] relative" style="width: ${this.col2Width}%" id="col-2">
                    <!-- Header with Add Buttons -->
                    <div class="flex flex-col gap-2 p-2 border-b border-zinc-800 bg-[#09090b] shrink-0">
                        <div class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider px-1">ADD SONG PART</div>
                         <div class="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                            <button class="btn-add-part flex-1 py-1.5 min-w-[30px] text-[9px] font-bold text-white uppercase bg-emerald-600 hover:bg-emerald-500 rounded transition-colors" data-type="Intro">INT</button>
                            <button class="btn-add-part flex-1 py-1.5 min-w-[30px] text-[9px] font-bold text-white uppercase bg-blue-600 hover:bg-blue-500 rounded transition-colors" data-type="Verse">V</button>
                            <button class="btn-add-part flex-1 py-1.5 min-w-[30px] text-[9px] font-bold text-white uppercase bg-violet-600 hover:bg-violet-500 rounded transition-colors" data-type="Pre-Chorus">PCH</button>
                            <button class="btn-add-part flex-1 py-1.5 min-w-[30px] text-[9px] font-bold text-white uppercase bg-rose-600 hover:bg-rose-500 rounded transition-colors" data-type="Chorus">CH</button>
                            <button class="btn-add-part flex-1 py-1.5 min-w-[30px] text-[9px] font-bold text-white uppercase bg-amber-600 hover:bg-amber-500 rounded transition-colors" data-type="Bridge">BR</button>
                            <button class="btn-add-part flex-1 py-1.5 min-w-[30px] text-[9px] font-bold text-white uppercase bg-yellow-500 hover:bg-yellow-400 rounded transition-colors" data-type="Tag">TAG</button>
                            <button class="btn-add-part flex-1 py-1.5 min-w-[30px] text-[9px] font-bold text-white uppercase bg-cyan-600 hover:bg-cyan-500 rounded transition-colors" data-type="Coda">COD</button>
                            <button class="btn-add-part flex-1 py-1.5 min-w-[30px] text-[9px] font-bold text-white uppercase bg-slate-600 hover:bg-slate-500 rounded transition-colors" data-type="Ending">END</button>
                        </div>
                    </div>
                    
                    <!-- Parts List -->
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-3" id="scroll-container">
                        <div id="parts-container" class="space-y-3">
                            <!-- Parts mount here -->
                        </div>
                    </div>
                </div>

                <!-- RESIZER 2 -->
                <div class="w-1 bg-[#09090b] hover:bg-blue-600 cursor-col-resize z-10 flex-none transition-colors" id="resizer-2"></div>

                <!-- COL 3: ARRANGEMENT -->
                <div class="flex-1 bg-[#09090b] border-l border-zinc-800 flex flex-col" id="arrangement-sidebar-mount" style="min-width: 0">
                    <!-- Arrangement Editor Mounts Here -->
                </div>
            </div>
        `

        this.attachEventListeners()
        this.renderParts()
        this.renderArrangementEditor()
    }

    attachResizeListeners() {
        const body = this.element.querySelector('#editor-body') as HTMLElement
        const resizer1 = this.element.querySelector('#resizer-1') as HTMLElement
        const resizer2 = this.element.querySelector('#resizer-2') as HTMLElement

        // Helper to get percentage from pixels
        const getPercent = (px: number) => (px / body.clientWidth) * 100

        const handleMouseMove = (e: MouseEvent) => {
            if (!this.dragging) return

            const bodyRect = body.getBoundingClientRect()
            const relativeX = e.clientX - bodyRect.left
            const percentX = getPercent(relativeX)

            if (this.dragging === 'col1') {
                // Min width 15%, Max width 40%
                const newWidth = Math.max(15, Math.min(40, percentX))

                this.col1Width = newWidth

            } else if (this.dragging === 'col2') {
                const col1Pixels = (this.col1Width / 100) * body.clientWidth

                const newCol2Pixels = relativeX - col1Pixels
                const newCol2Percent = getPercent(newCol2Pixels)

                // Min 20%, Max (Remaining - 20%)
                const maxCol2 = 100 - this.col1Width - 20 // Leave 20% for Col 3

                this.col2Width = Math.max(20, Math.min(maxCol2, newCol2Percent))
            }

            this.updateColumnWidths()
        }

        const handleMouseUp = () => {
            this.dragging = null
            document.body.style.cursor = 'default'
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }

        resizer1.addEventListener('mousedown', (e) => {
            e.preventDefault()
            this.dragging = 'col1'
            document.body.style.cursor = 'col-resize'
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        })

        resizer2.addEventListener('mousedown', (e) => {
            e.preventDefault()
            this.dragging = 'col2'
            document.body.style.cursor = 'col-resize'
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        })
    }

    updateColumnWidths() {
        const col1 = this.element.querySelector('#col-1') as HTMLElement
        const col2 = this.element.querySelector('#col-2') as HTMLElement

        if (col1) col1.style.width = `${this.col1Width}%`
        if (col2) col2.style.width = `${this.col2Width}%`
        // Col 3 is flex-1
    }

    renderArrangementEditor() {
        const container = this.element.querySelector('#arrangement-sidebar-mount')
        if (!container) return
        container.innerHTML = ''

        // ArrangementEditor expects full Arrangement objects, not just sequences
        const initialArrangements = this.data.arrangements && this.data.arrangements.length > 0
            ? this.data.arrangements
            : [{
                id: uuidv4(),
                name: 'Default',
                is_default: true,
                sequence: this.parts.map(p => p.id)
            }]

        this.arrangementEditor = new ArrangementEditor(
            this.parts,
            initialArrangements,
            (updatedArrangements) => {
                // Update internal data state immediately with full arrangements
                this.data.arrangements = updatedArrangements
            },
            () => this.save() // Pass save callback
        )
        container.appendChild(this.arrangementEditor.element)
    }

    renderParts() {
        const container = this.element.querySelector('#parts-container')
        if (!container) return
        container.innerHTML = ''

        this.parts.forEach(part => {
            const card = new SongPartCard(
                part,
                (id) => this.deletePart(id),
                (id, updates) => this.updatePart(id, updates)
            )
            container.appendChild(card.element)
        })
    }

    addPart(type: string = 'Verse') {
        // Auto-numbering for all types
        const typeCount = this.parts.filter(p => p.type === type).length
        const num = typeCount + 1

        // Create short label like "V 1", "C 2", "B 1"
        const shortLabels: Record<string, string> = {
            'Intro': 'INT',
            'Verse': 'V',
            'Pre-Chorus': 'PCH',
            'Chorus': 'CH',
            'Bridge': 'BR',
            'Tag': 'TAG',
            'Coda': 'COD',
            'Ending': 'END'
        }
        const shortLabel = shortLabels[type] || type.charAt(0)
        const label = `${shortLabel} ${num}`

        const newPart = {
            id: uuidv4(),
            type,
            label,
            lyrics: '' // Empty lyrics - no auto title
        }
        this.parts.push(newPart)

        // Update parts counter with singular/plural
        const counter = this.element.querySelector('#parts-counter')
        if (counter) {
            const text = this.parts.length === 1 ? '1 PART' : `${this.parts.length} PARTS`
            counter.textContent = text
        }

        this.hasChanges = true
        this.renderParts() // Re-render parts list only

        // Auto scroll to bottom
        const container = this.element.querySelector('#scroll-container')
        if (container) setTimeout(() => container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' }), 50)

        // Update Arrangement Editor Pool
        this.arrangementEditor?.updateParts(this.parts)
    }

    deletePart(id: string) {
        this.parts = this.parts.filter(p => p.id !== id)

        // Update parts counter with singular/plural
        const counter = this.element.querySelector('#parts-counter')
        if (counter) {
            const text = this.parts.length === 1 ? '1 PART' : `${this.parts.length} PARTS`
            counter.textContent = text
        }

        this.hasChanges = true
        this.renderParts()
        // Update Arrangement Editor Pool and clean sequence
        this.arrangementEditor?.updateParts(this.parts)
    }

    updatePart(id: string, updates: Partial<SongPartData>) {
        const index = this.parts.findIndex(p => p.id === id)
        if (index !== -1) {
            this.parts[index] = { ...this.parts[index], ...updates }
            // Note: We don't re-render everything on typing to maintain focus. 
            // The Card component handles its own DOM updates. We just sync state here.

            // Should we update arrangement editor UI labels?
            // Yes, triggering updateParts will re-render list with new labels
            this.arrangementEditor?.updateParts(this.parts)
        }
    }

    attachEventListeners() {
        this.element.querySelector('#btn-back')?.addEventListener('click', () => this.close())
        this.element.querySelector('#btn-delete-song')?.addEventListener('click', () => this.deleteSong())

        // Metadata inputs
        const bindInput = (id: string, key: keyof SongItem) => {
            this.element.querySelector(id)?.addEventListener('input', (e) => {
                // @ts-ignore
                this.data[key] = (e.target as HTMLInputElement).value
            })
        }
        bindInput('#input-title', 'title')
        bindInput('#input-artist', 'artist')
        bindInput('#input-key', 'key')
        bindInput('#input-ccli', 'ccli_number')
        // bindInput('#input-tempo', 'tempo') // tempo is number

        // Manual bind for number inputs
        this.element.querySelector('#input-tempo')?.addEventListener('input', (e) => {
            this.data.tempo = parseInt((e.target as HTMLInputElement).value) || 0
        })

        // Add Part Buttons
        this.element.querySelectorAll('.btn-add-part').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = (e.currentTarget as HTMLElement).dataset.type
                // Handle Custom
                if (type === 'Custom') {
                    this.addPart('Verse') // Default to Verse for now or prompt
                } else {
                    this.addPart(type)
                }
            })
        })
        // Save button removed from here, now in ArrangementEditor but triggered via callback

        // Background Picker
        this.element.querySelector('#bg-picker-trigger')?.addEventListener('click', () => {
            openMediaPicker({
                title: 'Select Default Background',
                onSelect: (item) => {
                    this.data.default_background_id = item.id
                    this.updateBackgroundPreview()
                    this.hasChanges = true
                }
            })
        })
    }

    updateBackgroundPreview() {
        const container = this.element.querySelector('#bg-picker-trigger')
        if (!container) return

        const bgId = this.data.default_background_id
        if (!bgId) {
            container.innerHTML = '<span class="group-hover:opacity-0 transition-opacity">Select Background</span>'
            return
        }

        // Find item in store
        const item = store.library.find(i => i.id === bgId)
        if (!item) {
            container.innerHTML = '<span class="text-red-500 text-[10px]">Item Missing</span>'
            return
        }

        // Render Thumbnail
        let content = ''
        if (item.type === 'image') {
            content = `<img src="${(item as any).source_url}" class="w-full h-full object-cover" />`
        } else if (item.type === 'video') {
            if ((item as any).thumbnail_path) {
                content = `<img src="${(item as any).thumbnail_path}" class="w-full h-full object-cover" />`
            } else {
                // Fallback
                content = `<div class="w-full h-full bg-zinc-800 flex items-center justify-center"><span class="text-2xl">🎬</span></div>`
            }
        }

        container.innerHTML = `
            ${content}
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span class="text-xs font-bold text-white">Change</span>
            </div>
            <div class="absolute top-1 right-1 bg-black/60 px-1 rounded text-[9px] text-white opacity-60">
                ${item.title}
            </div>
        `
    }

    async deleteSong() {
        if (!this.data.id) return

        // Show custom delete confirmation modal
        const modal = document.createElement('div')
        modal.className = 'fixed inset-0 z-[60] bg-black/80 flex items-center justify-center'
        modal.innerHTML = `
            <div class="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
                <h3 class="text-lg font-bold text-white mb-2">Delete Song?</h3>
                <p class="text-sm text-zinc-400 mb-6">Are you sure you want to delete this song? This cannot be undone.</p>
                <div class="flex gap-3 justify-end">
                    <button id="btn-cancel-delete" class="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
                    <button id="btn-confirm-delete" class="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded font-medium transition-colors">Delete Song</button>
                </div>
            </div>
        `

        modal.querySelector('#btn-cancel-delete')?.addEventListener('click', () => modal.remove())
        modal.querySelector('#btn-confirm-delete')?.addEventListener('click', async () => {
            modal.remove()
            try {
                await api.library.delete(this.data.id!)
                await store.refreshLibrary()
                showToast({ message: 'Song deleted successfully', type: 'info' })
                this.element.remove()
            } catch (e: any) {
                showToast({ message: 'Failed to delete song: ' + e.message, type: 'error' })
            }
        })

        document.body.appendChild(modal)
    }

    async save() {
        // Validation
        if (!this.data.title) return showToast({ message: 'Title is required', type: 'warning' })

        this.data.parts = this.parts

        // If new arrangement needed (default)
        if (!this.data.arrangements || this.data.arrangements.length === 0) {
            this.data.arrangements = [{
                id: uuidv4(),
                name: 'Default',
                is_default: true,
                sequence: this.parts.map(p => p.id)
            }]
        }

        const isNew = !this.data.created_at // Heuristic

        try {
            if (isNew) {
                // If new, ensure sequence matches parts if empty
                if (this.data.arrangements[0].sequence.length === 0 && this.parts.length > 0) {
                    this.data.arrangements[0].sequence = this.parts.map(p => p.id)
                }

                await api.library.create(this.data as any)
            } else {
                await api.library.update(this.data.id!, this.data)
            }
            await store.refreshLibrary()

            // Saved successfully, reset changes to avoid Discard modal
            this.hasChanges = false
            this.originalDataHash = JSON.stringify(this.parts)

            this.close()
        } catch (e: any) {
            showToast({ message: 'Failed to save: ' + e.message, type: 'error' })
        }
    }

    close() {
        // Check if there are unsaved changes
        const currentHash = JSON.stringify(this.parts)
        const hasContentChanges = currentHash !== this.originalDataHash || this.hasChanges

        if (hasContentChanges) {
            // Show custom exit confirmation modal
            const modal = document.createElement('div')
            modal.className = 'fixed inset-0 z-[60] bg-black/80 flex items-center justify-center'
            modal.innerHTML = `
                <div class="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
                    <h3 class="text-lg font-bold text-white mb-2">Discard Changes?</h3>
                    <p class="text-sm text-zinc-400 mb-6">You have unsaved changes. Are you sure you want to exit?</p>
                    <div class="flex gap-3 justify-end">
                        <button id="btn-cancel-exit" class="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
                        <button id="btn-confirm-exit" class="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded font-medium transition-colors">Discard & Exit</button>
                    </div>
                </div>
            `

            modal.querySelector('#btn-cancel-exit')?.addEventListener('click', () => modal.remove())
            modal.querySelector('#btn-confirm-exit')?.addEventListener('click', () => {
                modal.remove()
                this.element.remove()
            })

            document.body.appendChild(modal)
        } else {
            this.element.remove()
        }
    }
}

export function openSongEditor(existingSong?: SongItem) {
    new SongEditorModal(existingSong)
}
