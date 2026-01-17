// Modal is available if needed for future use
import { api } from '../../services/api'
import { v4 as uuidv4 } from 'uuid'
import { store } from '../../state/store'
import { SongPartCard, SongPartData } from '../editor/SongPartCard'
import { ArrangementEditor } from '../editor/ArrangementEditor'
import { SongItem } from '../../types'
import { showToast } from './ConfirmModal'

export class SongEditorModal {
    element: HTMLElement
    data: Partial<SongItem>
    parts: SongPartData[] = []
    arrangementEditor?: ArrangementEditor

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
                { id: uuidv4(), type: 'Verse', label: 'Verse 1', lyrics: '' }
            ]
        }

        this.element = document.createElement('div')
        this.element.className = 'fixed inset-0 z-50 bg-[#09090b] flex flex-col'
        this.render()
        document.body.appendChild(this.element)
    }

    render() {
        this.element.innerHTML = `
            <!-- HEADER -->
            <div class="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#18181b]">
                <div class="flex items-center gap-4">
                    <button id="btn-back" class="text-zinc-400 hover:text-white transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <div>
                        <input type="text" id="input-title" class="bg-transparent text-xl font-bold text-white placeholder-zinc-600 outline-none w-96 border-none focus:ring-0 p-0" placeholder="Song Title" value="${this.data.title || ''}" />
                        <input type="text" id="input-artist" class="bg-transparent text-sm text-zinc-400 placeholder-zinc-600 outline-none w-full border-none focus:ring-0 p-0 block" placeholder="Artist Name" value="${this.data.artist || ''}" />
                    </div>
                </div>
                <div class="flex items-center gap-3">
                     <span class="text-xs text-zinc-500 uppercase tracking-wider mr-4">Song Editor</span>
                     <button id="btn-save" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold text-sm transition-colors shadow-lg shadow-blue-500/20">
                        Save Changes
                     </button>
                </div>
            </div>

            <!-- BODY -->
            <div class="flex-1 flex overflow-hidden">
                <!-- LEFT SIDEBAR: METADATA -->
                <div class="w-64 bg-[#18181b] border-r border-zinc-800 p-4 flex flex-col gap-6 overflow-y-auto">
                    <div>
                        <h3 class="text-xs font-bold text-zinc-500 uppercase mb-3">Properties</h3>
                        <div class="space-y-3">
                            <div>
                                <label class="text-[10px] text-zinc-500 block mb-1">KEY</label>
                                <input type="text" id="input-key" class="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm" placeholder="C" value="${this.data.key || ''}" />
                            </div>
                            <div>
                                <label class="text-[10px] text-zinc-500 block mb-1">TEMPO (BPM)</label>
                                <input type="number" id="input-tempo" class="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm" placeholder="120" value="${this.data.tempo || ''}" />
                            </div>
                            <div>
                                <label class="text-[10px] text-zinc-500 block mb-1">TIME SIG</label>
                                <input type="text" id="input-timesig" class="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm" placeholder="4/4" value="${this.data.time_signature || ''}" />
                            </div>
                            <div>
                                <label class="text-[10px] text-zinc-500 block mb-1">CCLI #</label>
                                <input type="text" id="input-ccli" class="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm" placeholder="123456" value="${this.data.ccli_number || ''}" />
                            </div>
                        </div>
                    </div>

                    <div>
                         <h3 class="text-xs font-bold text-zinc-500 uppercase mb-3">Background</h3>
                         <div class="aspect-video bg-zinc-900 rounded border border-zinc-700 flex items-center justify-center text-zinc-600 text-xs cursor-pointer hover:border-zinc-500 transition-colors">
                            Drop / Click
                         </div>
                    </div>
                </div>

                <!-- MAIN CONTENT: PARTS -->
                <div class="flex-1 bg-[#09090b] relative flex flex-col overflow-hidden">
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-8 pb-32" id="scroll-container">
                        <div class="max-w-4xl mx-auto">
                            <h2 class="text-lg font-bold text-white mb-6">Parts</h2>

                            <div id="parts-container" class="space-y-4">
                                <!-- Parts mount here -->
                            </div>
                        </div>
                    </div>

                    <!-- STICKY ADD BAR -->
                    <div class="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-[#18181b] border border-zinc-700 rounded-full px-6 py-3 shadow-2xl flex gap-3 items-center z-10 glass">
                        <span class="text-xs font-bold text-zinc-500 uppercase mr-2">Add Part</span>
                        <button class="btn-add-part px-3 py-1 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 rounded text-xs border border-zinc-600 transition-colors" data-type="Verse">Verse</button>
                        <button class="btn-add-part px-3 py-1 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 rounded text-xs border border-zinc-600 transition-colors" data-type="Chorus">Chorus</button>
                        <button class="btn-add-part px-3 py-1 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 rounded text-xs border border-zinc-600 transition-colors" data-type="Bridge">Bridge</button>
                        <button class="btn-add-part px-3 py-1 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 rounded text-xs border border-zinc-600 transition-colors" data-type="Tag">Tag</button>
                        <div class="w-px h-4 bg-zinc-700 mx-1"></div>
                        <button class="btn-add-part px-3 py-1 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 rounded text-xs border border-zinc-600 transition-colors" data-type="Custom">+ Custom</button>
                    </div>
                </div>

                <!-- RIGHT SIDEBAR: ARRANGEMENT -->
                <div class="w-64 bg-[#18181b] border-l border-zinc-800 flex flex-col" id="arrangement-sidebar-mount">
                </div>
            </div>
        `

        this.attachEventListeners()
        this.renderParts()
        this.renderArrangementEditor()
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
            }
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
        let label = type
        // Simple auto-numbering logic
        if (type === 'Verse') {
            const verseCount = this.parts.filter(p => p.type === 'Verse').length
            label = `Verse ${verseCount + 1}`
        }

        const newPart = {
            id: uuidv4(),
            type,
            label,
            lyrics: ''
        }
        this.parts.push(newPart)
        this.renderParts()

        // Auto scroll to bottom
        const container = this.element.querySelector('#scroll-container')
        if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })

        // Update Arrangement Editor Pool
        this.arrangementEditor?.updateParts(this.parts)
    }

    deletePart(id: string) {
        this.parts = this.parts.filter(p => p.id !== id)
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

        // Add Part Buttons
        this.element.querySelectorAll('.btn-add-part').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = (e.target as HTMLElement).dataset.type
                // Handle Custom
                if (type === 'Custom') {
                    this.addPart('Verse') // Default to Verse for now or prompt
                } else {
                    this.addPart(type)
                }
            })
        })

        // Save
        this.element.querySelector('#btn-save')?.addEventListener('click', () => this.save())
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

        // Just blindly create default arrangement sequence from parts list top-to-bottom for now
        // Phase 3.2 will make this editable
        this.data.arrangements[0].sequence = this.parts.map(p => p.id)

        const isNew = !this.data.created_at // Heuristic

        try {
            if (isNew) {
                await api.library.create(this.data as any)
            } else {
                await api.library.update(this.data.id!, this.data)
            }
            await store.refreshLibrary()
            this.close()
        } catch (e: any) {
            showToast({ message: 'Failed to save: ' + e.message, type: 'error' })
        }
    }

    close() {
        this.element.remove()
    }
}

export function openSongEditor(existingSong?: SongItem) {
    new SongEditorModal(existingSong)
}
