import { SongPartData } from './SongPartCard'
import { v4 as uuidv4 } from 'uuid'

export interface Arrangement {
    id: string
    name: string
    is_default: boolean
    sequence: string[] // Part IDs
}

export class ArrangementEditor {
    element: HTMLElement
    parts: SongPartData[]
    arrangements: Arrangement[] = []
    activeArrangementId: string = ''
    onUpdate: (arrangements: Arrangement[]) => void

    constructor(parts: SongPartData[], initialArrangements: Arrangement[], onUpdate: (arrangements: Arrangement[]) => void) {
        this.parts = parts
        this.arrangements = initialArrangements.length > 0 ? [...initialArrangements] : [
            { id: uuidv4(), name: 'Default', is_default: true, sequence: parts.map(p => p.id) }
        ]
        this.activeArrangementId = this.arrangements[0]?.id || ''
        this.onUpdate = onUpdate
        this.element = document.createElement('div')
        this.element.className = 'flex flex-col h-full'
        this.render()
    }

    get activeArrangement(): Arrangement | undefined {
        return this.arrangements.find(a => a.id === this.activeArrangementId)
    }

    get sequence(): string[] {
        return this.activeArrangement?.sequence || []
    }

    updateParts(parts: SongPartData[]) {
        this.parts = parts
        // Clean sequences of deleted parts
        this.arrangements.forEach(arr => {
            arr.sequence = arr.sequence.filter(id => this.parts.find(p => p.id === id))
        })
        this.render()
    }

    addArrangement() {
        const name = prompt('Arrangement name:', `Arrangement ${this.arrangements.length + 1}`)
        if (!name) return

        const newArr: Arrangement = {
            id: uuidv4(),
            name,
            is_default: false,
            sequence: this.parts.map(p => p.id)
        }
        this.arrangements.push(newArr)
        this.activeArrangementId = newArr.id
        this.onUpdate(this.arrangements)
        this.render()
    }

    render() {
        this.element.innerHTML = `
            <div class="p-4 border-b border-gray-800 bg-[#18181b]">
                <h3 class="text-xs font-bold text-gray-500 uppercase mb-2">Arrangement</h3>
                <div class="flex gap-2">
                    <select id="arr-select" class="flex-1 bg-gray-900 border border-gray-700 rounded p-1 text-xs text-white outline-none">
                        ${this.arrangements.map(a => `
                            <option value="${a.id}" ${a.id === this.activeArrangementId ? 'selected' : ''}>
                                ${a.name}${a.is_default ? ' (Default)' : ''}
                            </option>
                        `).join('')}
                    </select>
                    <button id="btn-add-arr" class="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white">+</button>
                </div>
            </div>
            
            <div class="flex-1 overflow-y-auto p-4 space-y-2 bg-[#18181b] custom-scrollbar" id="sequence-list">
                <!-- Sequence Items -->
            </div>

            <div class="p-4 border-t border-gray-800 bg-[#18181b]">
                 <div class="text-[10px] text-gray-500 text-center mb-2">Available Parts</div>
                 <div class="flex flex-wrap gap-2 justify-center" id="available-pool">
                    <!-- Pool Items -->
                 </div>
                 <button id="btn-reset" class="w-full mt-4 text-xs text-gray-500 hover:text-white border border-gray-700 rounded py-1">
                    Reset to All Parts
                 </button>
            </div>
        `

        this.renderSequence()
        this.renderPool()

        // Arrangement Select
        this.element.querySelector('#arr-select')?.addEventListener('change', (e) => {
            this.activeArrangementId = (e.target as HTMLSelectElement).value
            this.render()
        })

        // Add Arrangement
        this.element.querySelector('#btn-add-arr')?.addEventListener('click', () => this.addArrangement())

        // Reset
        this.element.querySelector('#btn-reset')?.addEventListener('click', () => {
            const arr = this.activeArrangement
            if (arr) {
                arr.sequence = this.parts.map(p => p.id)
                this.onUpdate(this.arrangements)
                this.render()
            }
        })
    }

    renderSequence() {
        const container = this.element.querySelector('#sequence-list')
        if (!container) return
        container.innerHTML = ''

        const sequence = this.sequence
        if (sequence.length === 0) {
            container.innerHTML = '<div class="text-gray-600 text-xs text-center py-4">Empty Sequence</div>'
            return
        }

        sequence.forEach((partId, index) => {
            const part = this.parts.find(p => p.id === partId)
            if (!part) return

            const el = document.createElement('div')
            el.className = `p-2 rounded bg-gray-800 border-l-4 border-gray-600 flex justify-between items-center group cursor-move select-none hover:bg-gray-750 transition-colors`

            if (part.type === 'Verse') el.classList.replace('border-gray-600', 'border-blue-500')
            if (part.type === 'Chorus') el.classList.replace('border-gray-600', 'border-red-500')
            if (part.type === 'Bridge') el.classList.replace('border-gray-600', 'border-orange-500')
            if (part.type === 'Tag') el.classList.replace('border-gray-600', 'border-purple-500')
            if (part.type === 'Pre-Chorus') el.classList.replace('border-gray-600', 'border-purple-500')

            el.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-gray-300 w-4">${index + 1}</span>
                    <div class="flex flex-col">
                        <span class="text-xs font-bold text-white">${part.label}</span>
                        <span class="text-[10px] text-gray-500 truncate w-24">${part.lyrics.substring(0, 15)}...</span>
                    </div>
                </div>
                <button class="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100" data-index="${index}">×</button>
            `

            el.querySelector('button')?.addEventListener('click', () => {
                const arr = this.activeArrangement
                if (arr) {
                    arr.sequence.splice(index, 1)
                    this.onUpdate(this.arrangements)
                    this.renderSequence()
                }
            })

            container.appendChild(el)
        })
    }

    renderPool() {
        const container = this.element.querySelector('#available-pool')
        if (!container) return
        container.innerHTML = ''

        this.parts.forEach(part => {
            const btn = document.createElement('button')
            btn.className = 'px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-[10px] text-gray-300'
            btn.textContent = part.label

            btn.addEventListener('click', () => {
                const arr = this.activeArrangement
                if (arr) {
                    arr.sequence.push(part.id)
                    this.onUpdate(this.arrangements)
                    this.renderSequence()
                }
            })

            container.appendChild(btn)
        })
    }
}
