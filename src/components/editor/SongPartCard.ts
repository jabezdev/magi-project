
export interface SongPartData {
    id: string
    type: string // 'Verse', 'Chorus', 'Bridge', etc.
    label: string
    lyrics: string
    background_override_id?: string // Optional per-part background
}

// Color mapping for part types - now just for accents, not dropdown
const TYPE_COLORS: Record<string, string> = {
    'Intro': 'bg-emerald-600',
    'Verse': 'bg-blue-600',
    'Pre-Chorus': 'bg-violet-600',
    'Chorus': 'bg-rose-600',
    'Bridge': 'bg-amber-600',
    'Tag': 'bg-yellow-500',
    'Coda': 'bg-cyan-600',
    'Ending': 'bg-slate-600'
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
        this.element.className = 'bg-zinc-900 border border-zinc-800 group relative'
        this.render()
    }

    render() {
        const accentColor = TYPE_COLORS[this.data.type] || 'bg-zinc-600'
        const slideCount = this.getSlideCount()

        this.element.innerHTML = `
            <!-- Header Bar with colored accent -->
            <div class="flex items-stretch border-b border-zinc-800 h-9">
                <!-- Color Accent Bar -->
                <div class="w-1.5 ${accentColor} shrink-0"></div>
                
                <!-- Type Selector (Dark background, wider for PRE-CHORUS) -->
                <select class="bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold uppercase w-28 px-2 text-zinc-300 border-r border-zinc-900 outline-none cursor-pointer part-type-select transition-colors">
                    <option value="Intro" ${this.data.type === 'Intro' ? 'selected' : ''}>INTRO</option>
                    <option value="Verse" ${this.data.type === 'Verse' ? 'selected' : ''}>VERSE</option>
                    <option value="Pre-Chorus" ${this.data.type === 'Pre-Chorus' ? 'selected' : ''}>PRE-CHORUS</option>
                    <option value="Chorus" ${this.data.type === 'Chorus' ? 'selected' : ''}>CHORUS</option>
                    <option value="Bridge" ${this.data.type === 'Bridge' ? 'selected' : ''}>BRIDGE</option>
                    <option value="Tag" ${this.data.type === 'Tag' ? 'selected' : ''}>TAG</option>
                    <option value="Coda" ${this.data.type === 'Coda' ? 'selected' : ''}>CODA</option>
                    <option value="Ending" ${this.data.type === 'Ending' ? 'selected' : ''}>ENDING</option>
                </select>

                <!-- Label Input -->
                <input type="text" class="flex-1 bg-transparent px-3 text-xs text-zinc-200 outline-none border-r border-zinc-800 min-w-0 focus:bg-zinc-800/50 part-label-input" value="${this.data.label}" placeholder="Label" />

                <!-- Slide Count -->
                <div class="text-[10px] text-zinc-300 font-bold w-16 text-right pr-2 flex items-center justify-end">
                    ${slideCount} ${slideCount === 1 ? 'slide' : 'slides'}
                </div>
                <!-- Background Override (Full text, wider) -->
                <button class="px-3 h-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors bg-thumb-btn border-l border-zinc-800 text-center leading-tight whitespace-nowrap" title="Override Background">
                    <span class="text-[9px] font-bold uppercase">OVERRIDE<br>BACKGROUND</span>
                </button>

                <!-- Delete Button -->
                <button class="w-9 h-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-600 transition-colors btn-delete border-l border-zinc-800" title="Remove Part">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>

            <!-- Lyrics Textarea (Auto-resize, min 2 lines) -->
            <textarea class="w-full bg-transparent text-sm text-zinc-100 p-4 border-none outline-none resize-none font-mono leading-relaxed part-lyrics placeholder-zinc-600" placeholder="Enter lyrics..." style="min-height: 3.5rem; overflow: hidden;">${this.data.lyrics}</textarea>
        `

        // Bind Events
        const typeSelect = this.element.querySelector('.part-type-select') as HTMLSelectElement
        typeSelect.addEventListener('change', (e) => {
            const newType = (e.target as HTMLSelectElement).value
            this.data.type = newType // Update local data for accent color
            this.onUpdate(this.data.id, { type: newType })
            // Re-render to update accent color
            this.render()
        })

        const labelInput = this.element.querySelector('.part-label-input') as HTMLInputElement
        labelInput.addEventListener('change', (e) => {
            this.onUpdate(this.data.id, { label: (e.target as HTMLInputElement).value })
        })

        const lyricsInput = this.element.querySelector('.part-lyrics') as HTMLTextAreaElement

        // Auto-resize function
        const autoResize = () => {
            lyricsInput.style.height = 'auto'
            lyricsInput.style.height = Math.max(56, lyricsInput.scrollHeight) + 'px' // min 56px ~2 lines
        }

        lyricsInput.addEventListener('input', (e) => {
            const val = (e.target as HTMLTextAreaElement).value
            this.onUpdate(this.data.id, { lyrics: val })

            // Update slide count
            const count = this.getSlideCount(val)
            const slideBadge = this.element.querySelector('.slide-count')
            if (slideBadge) slideBadge.textContent = `${count} slide${count !== 1 ? 's' : ''}`

            // Auto-resize textarea
            autoResize()
        })

        // Initial resize
        setTimeout(autoResize, 0)

        // Delete without confirmation
        this.element.querySelector('.btn-delete')?.addEventListener('click', () => {
            this.onDelete(this.data.id)
        })
    }

    getSlideCount(lyrics?: string): number {
        const text = lyrics ?? this.data.lyrics
        // Split on single blank line (one or more empty lines) or ---
        return text.split(/\n\s*\n|---/).map(s => s.trim()).filter(s => s).length || 1
    }
}
