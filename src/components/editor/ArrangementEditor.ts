import { SongPartData } from './SongPartCard'
import { v4 as uuidv4 } from 'uuid'

export interface Arrangement {
    id: string
    name: string
    is_default: boolean
    sequence: string[] // Part IDs
}

// Color mapping for part types
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

export class ArrangementEditor {
    element: HTMLElement
    parts: SongPartData[]
    arrangements: Arrangement[] = []
    onUpdate: (arrangements: Arrangement[]) => void
    onSave?: () => void

    // Drag State
    private draggedPartId: string | null = null
    private draggedSource: 'pool' | 'sequence' = 'pool'
    private draggedArrId: string | null = null // For reordering sequences
    private draggedSeqIndex: number = -1

    private draggedArrangementId: string | null = null // For reordering columns

    private selectedArrangementId: string = ''

    constructor(
        parts: SongPartData[],
        initialArrangements: Arrangement[],
        onUpdate: (arrangements: Arrangement[]) => void,
        onSave?: () => void
    ) {
        this.parts = parts
        this.arrangements = initialArrangements.length > 0 ? [...initialArrangements] : [
            { id: uuidv4(), name: 'Original', is_default: true, sequence: parts.map(p => p.id) }
        ]
        this.selectedArrangementId = this.arrangements[0]?.id || ''
        this.onUpdate = onUpdate
        this.onSave = onSave
        this.element = document.createElement('div')
        this.element.className = 'flex flex-col h-full bg-[#09090b]'
        this.render()
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
        const name = `Arrangement ${this.arrangements.length + 1}`
        const newArr: Arrangement = {
            id: uuidv4(),
            name,
            is_default: false,
            sequence: [] // Empty sequence for new arrangements
        }
        this.arrangements.push(newArr)
        this.selectedArrangementId = newArr.id
        this.onUpdate(this.arrangements)
        this.render()
    }

    deleteArrangement(arrId: string) {
        if (this.arrangements.length <= 1) return
        const wasDefault = this.arrangements.find(a => a.id === arrId)?.is_default
        const wasSelected = this.selectedArrangementId === arrId
        this.arrangements = this.arrangements.filter(a => a.id !== arrId)
        if (wasDefault && this.arrangements.length > 0) {
            this.arrangements[0].is_default = true
        }
        if (wasSelected && this.arrangements.length > 0) {
            this.selectedArrangementId = this.arrangements[0].id
        }
        this.onUpdate(this.arrangements)
        this.render()
    }

    setDefaultArrangement(arrId: string) {
        this.arrangements.forEach(arr => {
            arr.is_default = arr.id === arrId
        })
        this.onUpdate(this.arrangements)
        this.render()
    }

    selectArrangement(arrId: string) {
        this.selectedArrangementId = arrId
        this.render()
    }

    addPartToSelected(partId: string) {
        const arr = this.arrangements.find(a => a.id === this.selectedArrangementId)
        if (arr) {
            arr.sequence.push(partId)
            this.onUpdate(this.arrangements)
            this.render()
        }
    }

    render() {
        this.element.innerHTML = `
            <!-- Header with Default Selector and Save -->
            <div class="flex items-stretch h-10 border-b border-zinc-800 bg-[#09090b] shrink-0">
                <div class="px-3 flex items-center bg-zinc-800/50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-r border-zinc-800 whitespace-nowrap">SELECT DEFAULT</div>
                <select id="default-arr-select" class="w-1/3 bg-zinc-800 text-xs text-zinc-300 px-3 outline-none cursor-pointer hover:bg-zinc-700 border-r border-zinc-800 transition-colors">
                    ${this.arrangements.map(a => `
                        <option value="${a.id}" ${a.is_default ? 'selected' : ''}>${a.name}</option>
                    `).join('')}
                </select>
                <div class="flex-1"></div>
                ${this.onSave ? `
                    <button id="btn-save-arr" class="px-6 h-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider border-l border-zinc-800 transition-colors">Save</button>
                ` : ''}
            </div>
            
            <!-- Available Parts Pool -->
            <div class="border-b border-zinc-800 bg-[#0c0c0e] p-2 shrink-0">
                <div class="text-[9px] text-zinc-600 font-bold uppercase mb-2 tracking-wider">Click to add to selected arrangement</div>
                <div class="flex flex-wrap gap-1.5" id="available-pool">
                    <!-- Pool Items -->
                </div>
            </div>

            <!-- Arrangements Container (Horizontal scroll) -->
            <div class="flex-1 overflow-x-auto overflow-y-hidden p-3" id="arrangements-container">
                <div class="flex gap-3 h-full" id="arrangements-list">
                    <!-- Arrangement columns -->
                </div>
            </div>
        `

        this.renderPool()
        this.renderArrangements()

        this.element.querySelector('#default-arr-select')?.addEventListener('change', (e) => {
            const selectedId = (e.target as HTMLSelectElement).value
            this.setDefaultArrangement(selectedId)
        })

        if (this.onSave) {
            this.element.querySelector('#btn-save-arr')?.addEventListener('click', () => {
                this.onSave?.()
            })
        }
    }

    renderPool() {
        const container = this.element.querySelector('#available-pool')
        if (!container) return
        container.innerHTML = ''

        this.parts.forEach(part => {
            const color = TYPE_COLORS[part.type] || 'bg-zinc-600'
            const btn = document.createElement('button')
            btn.className = `${color} px-3 py-1.5 text-[10px] font-bold text-white uppercase rounded transition-opacity hover:opacity-80`
            btn.textContent = part.label
            btn.setAttribute('draggable', 'true')

            btn.addEventListener('click', () => this.addPartToSelected(part.id))

            btn.addEventListener('dragstart', (e) => {
                this.draggedPartId = part.id
                this.draggedSource = 'pool'
                this.draggedArrId = null
                e.dataTransfer?.setData('text/plain', part.id)
                e.dataTransfer?.setData('type', 'part') // Distinguish from column drag
            })

            container.appendChild(btn)
        })
    }

    renderArrangements() {
        const list = this.element.querySelector('#arrangements-list')
        if (!list) return
        list.innerHTML = ''

        // Drop zone for reordering arrangements (whole list)
        list.addEventListener('dragover', (e) => {
            e.preventDefault() // Allow drop
        })
        list.addEventListener('drop', (e) => {
            e.preventDefault()
            const type = (e as DragEvent).dataTransfer?.getData('type')
            if (type === 'column' && this.draggedArrangementId) {
                // Find drop target index
                const target = (e.target as HTMLElement).closest('[data-arr-id]')
                if (target) {
                    const targetId = target.getAttribute('data-arr-id')
                    const fromIndex = this.arrangements.findIndex(a => a.id === this.draggedArrangementId)
                    const toIndex = this.arrangements.findIndex(a => a.id === targetId)

                    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
                        const [moved] = this.arrangements.splice(fromIndex, 1)
                        this.arrangements.splice(toIndex, 0, moved)
                        this.onUpdate(this.arrangements)
                        this.renderArrangements()
                    }
                }
                this.draggedArrangementId = null
            }
        })

        this.arrangements.forEach((arr) => {
            const isSelected = arr.id === this.selectedArrangementId
            const col = document.createElement('div')
            col.className = `flex flex-col bg-zinc-900/50 border-2 ${isSelected ? 'border-blue-500' : 'border-zinc-800'} min-w-[160px] max-w-[200px] shrink-0 h-full relative group/card overflow-hidden cursor-pointer transition-colors select-none`
            col.setAttribute('data-arr-id', arr.id)
            col.setAttribute('draggable', 'true') // Column draggable

            // Column Drag Events
            col.addEventListener('dragstart', (e) => {
                // If dragging a part handle inside, don't drag column
                if ((e.target as HTMLElement).getAttribute('data-part-handle') || (e.target as HTMLElement).closest('[data-part-handle]')) return

                this.draggedArrangementId = arr.id
                e.dataTransfer?.setData('type', 'column')
                e.dataTransfer?.setData('text/plain', arr.id)
                e.stopPropagation()
            })

            // Click to select
            col.addEventListener('click', (e) => {
                if ((e.target as HTMLElement).tagName !== 'TEXTAREA' && !(e.target as HTMLElement).closest('.delete-area')) {
                    this.selectArrangement(arr.id)
                }
            })

            // Header (Flush, no gap)
            const header = document.createElement('div')
            header.className = 'relative bg-zinc-800/20 shrink-0'

            const nameInput = document.createElement('textarea')
            nameInput.value = arr.name
            nameInput.className = 'w-full bg-transparent px-2 py-3 text-xs text-white font-bold outline-none resize-none overflow-hidden border-none focus:bg-zinc-800/50 relative z-20'
            nameInput.rows = 1
            nameInput.style.minHeight = '40px' // Slightly taller

            const autoResize = () => {
                nameInput.style.height = 'auto'
                nameInput.style.height = nameInput.scrollHeight + 'px'
            }
            nameInput.addEventListener('input', autoResize)
            nameInput.addEventListener('change', () => {
                arr.name = nameInput.value
                this.onUpdate(this.arrangements)
                const select = this.element.querySelector('#default-arr-select') as HTMLSelectElement
                if (select) {
                    const option = select.querySelector(`option[value="${arr.id}"]`)
                    if (option) option.textContent = arr.name
                }
            })
            // Prevent drag when interacting with input
            nameInput.addEventListener('mousedown', (e) => e.stopPropagation())

            setTimeout(autoResize, 0)
            header.appendChild(nameInput)

            // Slashed Default Badge (Star only)
            if (arr.is_default) {
                const badge = document.createElement('div')
                // Position tweak: absolute values
                badge.className = 'absolute z-10 pointer-events-none'
                badge.style.top = '-4px'
                badge.style.right = '-8px'

                // Slashed shape small with Backslash direction: polygon(0 0, 100% 0, 100% 100%, 10px 100%)
                badge.innerHTML = `
                    <div class="bg-blue-600 text-white text-[10px] font-bold w-6 h-4 flex items-center justify-center shadow-sm" style="clip-path: polygon(0 0, 100% 0, 100% 100%, 10px 100%);">
                        ★
                    </div>
                `
                header.appendChild(badge)
            }
            col.appendChild(header)

            // Sequence List (Vertical)
            const seqList = document.createElement('div')
            seqList.className = 'flex-1 overflow-y-auto p-1 space-y-1 arr-sequence'

            // Drop Logic with Indicator
            let dropIndicator: HTMLElement | null = null

            const removeIndicator = () => {
                if (dropIndicator) {
                    dropIndicator.remove()
                    dropIndicator = null
                }
            }

            seqList.addEventListener('dragover', (e) => {
                e.preventDefault()
                e.stopPropagation()
                const type = e.dataTransfer?.getData('type')
                if (type !== 'part') return

                // Determine insertion index based on mouse Y
                const children = Array.from(seqList.children).filter(c => !c.classList.contains('drop-indicator') && !c.classList.contains('empty-msg'))

                let insertIndex = children.length

                // If empty or only empty msg
                if (children.length > 0) {
                    let minDist = Number.MAX_VALUE

                    children.forEach((child, index) => {
                        const rect = child.getBoundingClientRect()
                        // Calculate distance to center line of item
                        const dist = Math.abs(e.clientY - (rect.top + rect.height / 2))
                        if (dist < minDist) {
                            minDist = dist
                            if (e.clientY < rect.top + rect.height / 2) {
                                insertIndex = index
                            } else {
                                insertIndex = index + 1
                            }
                        }
                    })
                }

                // Create or move indicator
                if (!dropIndicator) {
                    dropIndicator = document.createElement('div')
                    dropIndicator.className = 'drop-indicator h-1 bg-white rounded-full my-1 shadow-[0_0_4px_rgba(255,255,255,0.8)]'
                }

                if (insertIndex >= children.length) {
                    seqList.appendChild(dropIndicator)
                } else {
                    seqList.insertBefore(dropIndicator, children[insertIndex])
                }

                seqList.classList.add('bg-blue-500/5')
            })

            seqList.addEventListener('dragleave', (e) => {
                // Only remove if leaving the list container completely
                const rect = seqList.getBoundingClientRect()
                if (e.clientX < rect.left || e.clientX >= rect.right || e.clientY < rect.top || e.clientY >= rect.bottom) {
                    removeIndicator()
                    seqList.classList.remove('bg-blue-500/5')
                }
            })

            seqList.addEventListener('drop', (e) => {
                e.preventDefault()
                e.stopPropagation()
                removeIndicator()
                seqList.classList.remove('bg-blue-500/5')

                const type = e.dataTransfer?.getData('type')
                if (type !== 'part') return

                // Calculate insertion index
                const children = Array.from(seqList.children).filter(c => !c.classList.contains('drop-indicator') && !c.classList.contains('empty-msg'))
                let insertIndex = children.length

                if (children.length > 0) {
                    // Check against last child bottom
                    const last = children[children.length - 1].getBoundingClientRect()
                    if (e.clientY < last.bottom) {
                        // Find exact spot
                        for (let i = 0; i < children.length; i++) {
                            const rect = children[i].getBoundingClientRect()
                            if (e.clientY < rect.top + rect.height / 2) {
                                insertIndex = i
                                break
                            }
                        }
                    }
                }

                if (this.draggedSource === 'sequence' && this.draggedArrId === arr.id) {
                    // Reorder within same
                    const fromIndex = this.draggedSeqIndex
                    let toIndex = insertIndex
                    // adjust index
                    if (fromIndex < toIndex) toIndex--
                    if (toIndex < 0) toIndex = 0

                    const movedId = arr.sequence[fromIndex]
                    arr.sequence.splice(fromIndex, 1)
                    arr.sequence.splice(toIndex, 0, movedId)
                } else if (this.draggedPartId) {
                    // Add new or move from other
                    arr.sequence.splice(insertIndex, 0, this.draggedPartId)
                }

                this.draggedPartId = null
                this.draggedArrId = null
                this.onUpdate(this.arrangements)
                this.renderArrangements()
            })

            if (arr.sequence.length === 0) {
                const emptyMsg = document.createElement('div')
                emptyMsg.className = 'empty-msg text-zinc-700 text-[9px] text-center py-4 italic pointer-events-none'
                emptyMsg.textContent = 'Drop Parts Here'
                seqList.appendChild(emptyMsg)
            }

            arr.sequence.forEach((partId, seqIndex) => {
                const part = this.parts.find(p => p.id === partId)
                if (!part) return

                const color = TYPE_COLORS[part.type] || 'bg-zinc-600'
                const item = document.createElement('div')
                item.className = `${color} flex items-center rounded text-[9px] font-bold text-white uppercase group cursor-move relative`
                item.setAttribute('draggable', 'true')
                item.setAttribute('data-part-handle', 'true')

                // Label
                const labelSpan = document.createElement('span')
                labelSpan.className = 'flex-1 truncate px-2 py-1.5 pointer-events-none'
                labelSpan.textContent = part.label
                item.appendChild(labelSpan)

                // Remove Button (Updated Styling)
                // Remove gray fill (using transparent), bigger X (w-5 h-5), white line separator
                const removeBtn = document.createElement('button')
                removeBtn.className = 'w-8 h-full flex items-center justify-center text-zinc-300 hover:text-white border-l border-white/20 transition-colors'
                removeBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>'
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation()
                    arr.sequence.splice(seqIndex, 1)
                    this.onUpdate(this.arrangements)
                    this.renderArrangements()
                })
                item.appendChild(removeBtn)

                item.addEventListener('dragstart', (e) => {
                    this.draggedPartId = partId
                    this.draggedSource = 'sequence'
                    this.draggedArrId = arr.id
                    this.draggedSeqIndex = seqIndex
                    e.dataTransfer?.setData('text/plain', partId)
                    e.dataTransfer?.setData('type', 'part')
                    e.stopPropagation()
                })

                seqList.appendChild(item)
            })

            col.appendChild(seqList)

            // Delete Slide-up
            if (this.arrangements.length > 1) {
                const deleteArea = document.createElement('div')
                deleteArea.className = 'delete-area absolute bottom-0 left-0 right-0 h-7 bg-red-600 flex items-center justify-center text-white text-[9px] font-bold uppercase cursor-pointer hover:bg-red-500 transition-all translate-y-full group-hover/card:translate-y-0'
                deleteArea.innerHTML = `Delete`
                deleteArea.addEventListener('click', (e) => {
                    e.stopPropagation()
                    this.deleteArrangement(arr.id)
                })
                col.appendChild(deleteArea)
            }

            list.appendChild(col)
        })

        // Add Button
        const addCol = document.createElement('button')
        addCol.className = 'flex flex-col items-center justify-center bg-zinc-900/30 border-2 border-dashed border-zinc-700 hover:border-zinc-500 min-w-[100px] h-full shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer'
        addCol.innerHTML = `
            <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span class="text-[9px] font-bold uppercase">New</span>
        `
        addCol.addEventListener('click', () => this.addArrangement())
        list.appendChild(addCol)
    }
}
