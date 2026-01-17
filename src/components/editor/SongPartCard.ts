
export interface SongPartData {
    id: string
    type: string // 'Verse', 'Chorus', 'Bridge', etc.
    label: string
    lyrics: string
    background_override_id?: string // Optional per-part background
}

export class SongPartCard {
    element: HTMLElement
    data: SongPartData
    onDelete: (id: string) => void
    onUpdate: (id: string, updates: Partial<SongPartData>) => void

    constructor(data: SongPartData, onDelete: (id: string) => void, onUpdate: (id: string, updates: Partial<SongPartData>) => void) {
        this.data = data
        this.onDelete = onDelete
        this.onUpdate = onUpdate
        this.element = document.createElement('div')
        this.element.className = 'bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors group relative'
        this.render()
    }

    render() {
        const typeColors: Record<string, string> = {
            'Verse': 'border-l-4 border-blue-500',
            'Chorus': 'border-l-4 border-red-500',
            'Bridge': 'border-l-4 border-orange-500',
            'Intro': 'border-l-4 border-green-500',
            'Ending': 'border-l-4 border-gray-500',
            'Pre-Chorus': 'border-l-4 border-purple-500'
        }

        const borderClass = typeColors[this.data.type] || 'border-l-4 border-gray-500'

        this.element.className = `bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors group relative ${borderClass}`

        this.element.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div class="flex gap-2 items-center">
                    <select class="bg-gray-900 text-xs font-bold uppercase rounded p-1 border border-gray-700 text-white focus:border-blue-500 outline-none part-type-select">
                        <option value="Verse" ${this.data.type === 'Verse' ? 'selected' : ''}>Verse</option>
                        <option value="Chorus" ${this.data.type === 'Chorus' ? 'selected' : ''}>Chorus</option>
                        <option value="Pre-Chorus" ${this.data.type === 'Pre-Chorus' ? 'selected' : ''}>Pre-Chorus</option>
                        <option value="Bridge" ${this.data.type === 'Bridge' ? 'selected' : ''}>Bridge</option>
                        <option value="Intro" ${this.data.type === 'Intro' ? 'selected' : ''}>Intro</option>
                        <option value="Ending" ${this.data.type === 'Ending' ? 'selected' : ''}>Ending</option>
                        <option value="Tag" ${this.data.type === 'Tag' ? 'selected' : ''}>Tag</option>
                    </select>
                    <input type="text" class="bg-transparent border-b border-transparent hover:border-gray-600 focus:border-blue-500 text-xs text-gray-400 outline-none w-24 part-label-input" value="${this.data.label}" placeholder="Label" />
                </div>
                <button class="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity btn-delete" title="Remove Part">
                    ×
                </button>
            </div>
            <textarea class="w-full bg-gray-900 text-sm text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 outline-none resize-y min-h-[100px] font-mono part-lyrics" placeholder="Enter lyrics...">${this.data.lyrics}</textarea>
            
            <!-- Background Override Thumbnail -->
            <div class="mt-2 flex items-center gap-2">
                <div class="bg-thumb w-16 h-10 bg-gray-900 rounded border border-gray-700 flex items-center justify-center text-[10px] text-gray-500 cursor-pointer hover:border-blue-500 transition-colors" title="Override background for this part">
                    ${this.data.background_override_id ? '<span class="text-blue-400">BG Set</span>' : 'No BG'}
                </div>
                <span class="text-[10px] text-gray-600">Part-specific background</span>
            </div>
            
            <!-- Slide Visualizer -->
            <div class="mt-2 flex flex-wrap gap-2 slide-preview-container">
                 <!-- Generated slides will appear here -->
            </div>

            <div class="text-[10px] text-gray-600 mt-1 flex justify-between">
                <span>Use --- or double enter to split slides manually</span>
                <span class="word-count">${this.data.lyrics.split(/\s+/).filter(w => w).length} words</span>
            </div>
        `

        this.updateSlidePreview()

        // Bind Events
        const typeSelect = this.element.querySelector('.part-type-select') as HTMLSelectElement
        typeSelect.addEventListener('change', (e) => {
            const newType = (e.target as HTMLSelectElement).value
            // Auto update label if it matches old type scheme
            let newLabel = this.data.label
            if (this.data.label.startsWith(this.data.type)) {
                newLabel = this.data.label.replace(this.data.type, newType)
            }
            this.onUpdate(this.data.id, { type: newType, label: newLabel })
        })

        const labelInput = this.element.querySelector('.part-label-input') as HTMLInputElement
        labelInput.addEventListener('change', (e) => {
            this.onUpdate(this.data.id, { label: (e.target as HTMLInputElement).value })
        })

        const lyricsInput = this.element.querySelector('.part-lyrics') as HTMLTextAreaElement
        lyricsInput.addEventListener('input', (e) => {
            const val = (e.target as HTMLTextAreaElement).value
            this.onUpdate(this.data.id, { lyrics: val })

            // Update word count
            const count = val.split(/\s+/).filter(w => w).length
            const badge = this.element.querySelector('.word-count')
            if (badge) badge.textContent = `${count} words`

            this.updateSlidePreview()
        })

        this.element.querySelector('.btn-delete')?.addEventListener('click', () => {
            if (confirm('Delete this part?')) {
                this.onDelete(this.data.id)
            }
        })
    }

    updateSlidePreview() {
        const container = this.element.querySelector('.slide-preview-container')
        if (!container) return

        // Simple splitting logic matching backend
        // Split by double newline OR '---'
        const slides = this.data.lyrics.split(/\n\n+|---/).map(s => s.trim()).filter(s => s)

        if (slides.length === 0) {
            container.innerHTML = ''
            return
        }

        container.innerHTML = slides.map((text, i) => `
            <div class="bg-gray-700 rounded p-1.5 min-w-[60px] max-w-[120px] text-[9px] text-gray-300 border border-gray-600 relative group/slide">
                <span class="absolute -top-1.5 -left-1.5 bg-gray-900 text-gray-500 px-1 rounded text-[8px]">${i + 1}</span>
                <div class="truncate-multiline leading-tight">${text.substring(0, 50)}</div>
            </div>
        `).join('')
    }
}
