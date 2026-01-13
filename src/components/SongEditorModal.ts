import { ICONS } from '../constants/icons'
import { fetchSongById, saveSong } from '../services/api'
import type { Song } from '../types'
import { fetchSongs } from '../services/api'
import { state, updateState } from '../state'
import { DEFAULT_PART_COLORS } from '../constants/defaults'
import { getContrastColor } from '../utils/colors'

// Helper to escape HTML
function escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

// Auto-resize textarea
function autoResize(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto'
    textarea.style.height = Math.max(100, textarea.scrollHeight) + 'px'
}

export async function openSongEditor(songId?: number): Promise<void> {
    // Load song data if editing, else create new
    let song: Song
    if (songId) {
        const fetched = await fetchSongById(songId)
        if (!fetched) {
            alert('Song not found')
            return
        }
        song = fetched
    } else {
        song = {
            id: 0,
            title: '',
            artist: '',
            parts: [],
            variations: []
        }
    }

    // -- LOGIC --
    const getPartColor = (id: string): string => {
        const type = id.split(' ')[0] // e.g. "V"
        // Try state settings first, then fall back to defaults
        if (state.partColors && state.partColors[type]) {
            return state.partColors[type]
        }
        return DEFAULT_PART_COLORS[type] || '#64748b'
    }

    // Generate Add Part Buttons
    const partTypes = [
        { id: 'IN', label: 'Intro' },
        { id: 'V', label: 'Verse' },
        { id: 'pCH', label: 'Pre-Chorus' },
        { id: 'CH', label: 'Chorus' },
        { id: 'BR', label: 'Bridge' },
        { id: 'TAG', label: 'Tag' },
        { id: 'OUT', label: 'Outro' }
    ]

    const addPartsButtonsHtml = partTypes.map(pt => {
        const color = getPartColor(pt.id)
        const textColor = getContrastColor(color)
        return `<button class="btn-add-part" data-type="${pt.id}" style="--btn-color: ${color}; color: ${textColor} !important;">${pt.label}</button>`
    }).join('')

    // Create Modal HTML
    const modal = document.createElement('div')
    modal.className = 'modal-overlay'
    modal.innerHTML = `
    <div class="modal-content song-editor-modal">
      <div class="modal-header">
        <div class="header-section-left">
            <div class="modal-title-group">
                <span class="modal-icon">${ICONS.music}</span>
                <h2>${song.id ? 'Edit Song' : 'New Song'}</h2>
            </div>
        </div>
        <div class="header-section-center" style="justify-content: flex-start; padding-left: 1rem;">
             <div class="header-song-inputs">
                <input type="text" id="song-title" class="header-input title" value="${escapeHtml(song.title)}" placeholder="Song Title" />
                <span class="header-input-divider">-</span>
                <input type="text" id="song-artist" class="header-input artist" value="${escapeHtml(song.artist || '')}" placeholder="Artist" />
            </div>
            <div id="status-bar" class="status-bar" style="margin: 0; margin-left: auto;"></div>
        </div>
        <div class="header-section-right">
            <button class="btn-ghost cancel-btn flush-btn">Cancel</button>
            <button class="btn-primary save-btn flush-btn">${ICONS.save} Save</button>
        </div>
      </div>
      
      <div class="modal-body">
        <!-- Top: Song Information -->
        <!-- Top: Song Information (Moved to Header) -->
        <!-- <div class="editor-section song-info-section"></div> -->

        <!-- Bottom: Parts & Arrangements side by side -->
        <div class="editor-layout">
          <!-- Left: Parts -->
          <div class="editor-main">
            <div class="editor-section parts-section">
              <div class="section-header">
                <h3>Parts</h3>
                <div class="add-parts-toolbar" style="margin: 0; border: none; background: transparent; padding: 0;">
                    ${addPartsButtonsHtml}
                </div>
              </div>
              
              <div class="parts-list" id="parts-container">
                <!-- Parts will be rendered here -->
              </div>
              <div class="empty-parts-message" id="empty-parts" style="display: none;">
                <p>No parts yet. Click "Add Part" to create your first verse or chorus.</p>
              </div>
            </div>
          </div>

          <!-- Resizer -->
          <div class="editor-resizer" id="editor-resizer"></div>

          <!-- Right: Arrangements -->
          <div class="editor-sidebar">
            <div class="editor-section arrangements-section">
                <!-- Top: Available Parts to Add -->
                <div class="available-parts-section">
                    <label>Add to Arrangement:</label>
                    <div class="available-parts-chips" id="available-parts">
                        <!-- Available parts chips -->
                    </div>
                </div>

                <div class="resizer-separator"></div>

                <div class="section-header">
                    <h3>Arrangements</h3>
                </div>
              
                <div class="arrangement-editor-list" id="active-arrangement-list">
                    <!-- Horizontal list of arrangement columns -->
                </div>
            </div>
          </div>
        </div>
      </div>

      </div>
    </div>
  `

    document.body.appendChild(modal)

    // Prevent body scroll
    document.body.style.overflow = 'hidden'

    // -- LOGIC --
    let currentSong: Song = JSON.parse(JSON.stringify(song)) // Deep copy
    // Ensure at least one arrangement exists
    if (currentSong.variations.length === 0) {
        currentSong.variations.push({ id: Date.now(), name: 'Default', arrangement: [] })
    }

    let activeVariationIndex = 0
    let draggedPartIndex: number | null = null

    let isHandleDrag = false



    // getPartColor moved to top

    const renderParts = () => {
        const container = modal.querySelector('#parts-container') as HTMLElement
        const emptyMsg = modal.querySelector('#empty-parts') as HTMLElement
        if (!container) return

        if (currentSong.parts.length === 0) {
            container.innerHTML = ''
            emptyMsg.style.display = 'block'
            return
        }
        emptyMsg.style.display = 'none'

        container.innerHTML = currentSong.parts.map((part, index) => `
        <div class="part-item" data-index="${index}" draggable="true">
            <div class="part-drag-handle" title="Drag to reorder">${ICONS.grip}</div>
            <div class="part-content-wrapper">
                <div class="part-header-row">
                    ${(() => {
                const color = getPartColor(part.id)
                const textColor = getContrastColor(color)
                return `<div class="part-id-badge" style="background: ${color}">
                            <input type="text" class="part-id-input" value="${escapeHtml(part.id)}" placeholder="ID" title="Part ID (e.g. v1, ch)" style="color: ${textColor} !important;" />
                        </div>`
            })()}
                    <input type="text" class="part-label-input" value="${escapeHtml(part.label || '')}" placeholder="Part name (e.g. Verse 1, Chorus)" />
                    <div class="part-actions">
                        <div class="slide-count" style="width: auto; padding: 0 0.5rem; text-align: center; color: var(--text-muted); font-size: 0.75rem;">${part.slides.filter(s => s.trim()).length} slide${part.slides.filter(s => s.trim()).length !== 1 ? 's' : ''}</div>
                        <button class="btn-icon move-up-btn" title="Move Up" ${index === 0 ? 'disabled' : ''}>${ICONS.chevronUp}</button>
                        <button class="btn-icon move-down-btn" title="Move Down" ${index === currentSong.parts.length - 1 ? 'disabled' : ''}>${ICONS.chevronDown}</button>
                        <button class="btn-icon delete-part-btn" title="Delete Part">${ICONS.trash}</button>
                    </div>
                </div>
                <div class="part-lyrics">
                    <textarea class="part-content" placeholder="Enter lyrics here...&#10;&#10;Use a blank line to create a new slide.">${escapeHtml(part.slides.join('\n\n'))}</textarea>
                </div>
            </div>
        </div>
      `).join('')

        // Auto-resize all textareas
        container.querySelectorAll('.part-content').forEach(ta => {
            autoResize(ta as HTMLTextAreaElement)
        })

        // Attach listeners
        container.querySelectorAll('.part-item').forEach((item) => {
            const index = parseInt(item.getAttribute('data-index') || '0')
            const idInput = item.querySelector('.part-id-input') as HTMLInputElement
            const labelInput = item.querySelector('.part-label-input') as HTMLInputElement
            const contentInput = item.querySelector('.part-content') as HTMLTextAreaElement
            const deleteBtn = item.querySelector('.delete-part-btn')
            const moveUpBtn = item.querySelector('.move-up-btn')
            const moveDownBtn = item.querySelector('.move-down-btn')

            // Drag events for parts - Handle Only
            const handle = item.querySelector('.part-drag-handle') as HTMLElement

            handle.addEventListener('mousedown', () => { isHandleDrag = true })
            handle.addEventListener('mouseup', () => { isHandleDrag = false })

            item.addEventListener('dragstart', (e) => {
                if (!isHandleDrag) {
                    e.preventDefault()
                    return
                }
                draggedPartIndex = index
                    ; (item as HTMLElement).classList.add('dragging')
                    ; (e as DragEvent).dataTransfer?.setData('text/plain', 'part')
            })

            item.addEventListener('dragend', () => {
                isHandleDrag = false
                draggedPartIndex = null
                    ; (item as HTMLElement).classList.remove('dragging')
                container.querySelectorAll('.part-item').forEach(el => el.classList.remove('drag-over'))
            })

            item.addEventListener('dragover', (e) => {
                e.preventDefault()
                if (draggedPartIndex !== null && draggedPartIndex !== index) {
                    item.classList.add('drag-over')
                }
            })

            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over')
            })

            item.addEventListener('drop', (e) => {
                e.preventDefault()
                item.classList.remove('drag-over')
                if (draggedPartIndex !== null && draggedPartIndex !== index) {
                    const [movedPart] = currentSong.parts.splice(draggedPartIndex, 1)
                    currentSong.parts.splice(index, 0, movedPart)
                    renderParts()
                    renderAvailableParts()
                    // Re-render arrangement to reflect potential label changes if IDs change? (IDs stay part of object)
                }
            })

            idInput?.addEventListener('input', (e) => {
                const val = (e.target as HTMLInputElement).value
                currentSong.parts[index].id = val
                // Update badge color
                const badge = item.querySelector('.part-id-badge') as HTMLElement
                if (badge) {
                    const newColor = getPartColor(val)
                    badge.style.background = newColor
                    const input = badge.querySelector('.part-id-input') as HTMLElement
                    if (input) input.style.color = getContrastColor(newColor)
                }
                renderAvailableParts()
                // renderVariations - handled by renderArrangementEditor in new logic
                renderArrangementEditor()
            })

            labelInput?.addEventListener('input', (e) => {
                currentSong.parts[index].label = (e.target as HTMLInputElement).value
            })

            contentInput?.addEventListener('input', (e) => {
                const text = (e.target as HTMLTextAreaElement).value
                currentSong.parts[index].slides = text.split(/\n\n+/).filter(s => s.trim().length > 0)
                autoResize(e.target as HTMLTextAreaElement)
                // Update slide count
                const countEl = item.querySelector('.slide-count')
                if (countEl) {
                    const count = currentSong.parts[index].slides.length
                    countEl.textContent = `${count} slide${count !== 1 ? 's' : ''}`
                }
            })

            deleteBtn?.addEventListener('click', () => {
                if (currentSong.parts.length === 1 || confirm('Delete this part?')) {
                    currentSong.parts.splice(index, 1)
                    renderParts()
                    renderAvailableParts()
                    renderArrangementEditor()
                }
            })

            moveUpBtn?.addEventListener('click', () => {
                if (index > 0) {
                    [currentSong.parts[index - 1], currentSong.parts[index]] =
                        [currentSong.parts[index], currentSong.parts[index - 1]]
                    renderParts()
                }
            })

            moveDownBtn?.addEventListener('click', () => {
                if (index < currentSong.parts.length - 1) {
                    [currentSong.parts[index], currentSong.parts[index + 1]] =
                        [currentSong.parts[index + 1], currentSong.parts[index]]
                    renderParts()
                }
            })
        })

        renderAvailableParts()
    }

    const renderAvailableParts = () => {
        const container = modal.querySelector('#available-parts') as HTMLElement
        if (!container) return

        if (currentSong.parts.length === 0) {
            container.innerHTML = '<span class="no-parts-hint">Add parts first</span>'
            return
        }

        container.innerHTML = currentSong.parts.map((part) => {
            const color = getPartColor(part.id)
            const textColor = getContrastColor(color)
            return `<button class="part-chip" data-id="${escapeHtml(part.id)}" style="--chip-color: ${color}; color: ${textColor} !important;">
                ${escapeHtml(part.id)}
            </button>`
        }).join('')

        // Attach click listeners
        container.querySelectorAll('.part-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const partId = (chip as HTMLElement).getAttribute('data-id')
                if (partId && currentSong.variations.length > 0) {
                    // Add to ACTIVE arrangement
                    currentSong.variations[activeVariationIndex].arrangement.push(partId)
                    renderArrangementEditor()
                }
            })
        })
    }

    // New Renders for Arrangements (Side-by-Side Columns)
    const renderArrangementEditor = () => {
        const listContainer = modal.querySelector('#active-arrangement-list') as HTMLElement
        if (!listContainer) return

        // Render Columns
        listContainer.innerHTML = currentSong.variations.map((v, i) => `
            <div class="arrangement-column ${i === activeVariationIndex ? 'active' : ''}" data-index="${i}">
                <div class="arrangement-column-header">
                    <span class="arr-name" contenteditable="true" title="Click to edit name" data-index="${i}">${escapeHtml(v.name)}</span>
                    <button class="btn-icon delete-var-btn" title="Delete Arrangement" data-index="${i}">&times;</button>
                </div>
                <div class="arrangement-column-items" data-index="${i}">
                    ${v.arrangement.map((partId, partIdx) => {
            const bgColor = getPartColor(partId)
            const textColor = getContrastColor(bgColor)
            return `<div class="arrangement-list-item" data-var-index="${i}" data-part-index="${partIdx}" draggable="true" style="background: ${bgColor}; border: none; padding-left: 0.5rem;">
                            <span class="arr-item-name" style="color: ${textColor};">${escapeHtml(partId)}</span>
                            <button class="btn-icon remove-arr-item-btn" title="Remove" style="color: ${textColor}; opacity: 0.8;">&times;</button>
                        </div>`
        }).join('')}
                    ${v.arrangement.length === 0 ? '<div class="empty-col-message" style="font-size: 0.7rem; color: #888; text-align: center; padding: 1rem;">Drop parts here</div>' : ''}
                </div>
            </div>
        `).join('') + `
            <button class="arrangement-column add-new-column-btn" style="min-width: 60px; width: 60px; justify-content: center; align-items: center; border: 2px dashed var(--border-color); cursor: pointer; background: transparent; color: var(--text-muted);">
                ${ICONS.plus}
            </button>
        `

        // Add New Variation
        listContainer.querySelector('.add-new-column-btn')?.addEventListener('click', () => {
            currentSong.variations.push({ id: Date.now(), name: `Arrangement ${currentSong.variations.length + 1}`, arrangement: [] })
            activeVariationIndex = currentSong.variations.length - 1
            renderArrangementEditor()
        })

        // Column Listeners
        listContainer.querySelectorAll('.arrangement-column').forEach(col => {
            const varIdx = parseInt(col.getAttribute('data-index') || '-1')
            if (varIdx === -1) return // Add button logic handled above

            // Activate on click (capture phase or specific targets?)
            col.addEventListener('mousedown', (e) => {
                // If not clicking interactive elements
                if (!(e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('.arr-name')) {
                    if (activeVariationIndex !== varIdx) {
                        activeVariationIndex = varIdx
                        renderArrangementEditor()
                    }
                }
            })

            // Delete Variation
            col.querySelector('.delete-var-btn')?.addEventListener('click', (e) => {
                e.preventDefault()
                if (currentSong.variations.length <= 1) {
                    alert('Cannot delete the last arrangement.')
                    return
                }
                if (confirm('Delete this arrangement?')) {
                    currentSong.variations.splice(varIdx, 1)
                    if (activeVariationIndex >= currentSong.variations.length) {
                        activeVariationIndex = currentSong.variations.length - 1
                    }
                    renderArrangementEditor()
                }
            })

            // Rename Variation
            const nameSpan = col.querySelector('.arr-name')
            nameSpan?.addEventListener('blur', (e) => {
                const newName = (e.target as HTMLElement).innerText.trim()
                if (newName) {
                    currentSong.variations[varIdx].name = newName
                } else {
                    (e.target as HTMLElement).innerText = currentSong.variations[varIdx].name // Revert if empty
                }
            })
            // Prevent enter key new line and stop propagation for space
            nameSpan?.addEventListener('keydown', (e: any) => {
                e.stopPropagation()
                if (e.key === 'Enter') {
                    e.preventDefault()
                    e.target.blur()
                }
            })

            // Drop Target for Column (to add partials from toolbar or reorder)
            const itemsContainer = col.querySelector('.arrangement-column-items') as HTMLElement

            // Drag Over Column
            itemsContainer.addEventListener('dragover', (e) => {
                e.preventDefault()
                itemsContainer.style.background = 'var(--bg-hover)'
            })
            itemsContainer.addEventListener('dragleave', () => {
                itemsContainer.style.background = ''
            })
            itemsContainer.addEventListener('drop', (e) => {
                e.preventDefault()
                itemsContainer.style.background = ''

                // Check what we are dropping
                // If dropping a part from library (add-part logic via drag?)
                // Currently "Add Part" buttons are click-only. 
                // But available parts chips are draggable? Wait, I removed drag logic from available parts chips in previous cleanup?
                // Let's check renderAvailableParts logic. It attaches click listener. 
                // Available parts chips usually draggable? I need to check renderAvailableParts. 

                // Assuming we support reordering within column or moving between columns.
            })
        })

        // Item Listeners (Drag/Remove)
        listContainer.querySelectorAll('.arrangement-list-item').forEach(item => {
            const varIdx = parseInt(item.getAttribute('data-var-index') || '0')
            const partIdx = parseInt(item.getAttribute('data-part-index') || '0')

            // Remove
            item.querySelector('.remove-arr-item-btn')?.addEventListener('click', () => {
                currentSong.variations[varIdx].arrangement.splice(partIdx, 1)
                renderArrangementEditor()
            })

            // Drag Start
            item.addEventListener('dragstart', (e) => {
                // draggedArrangementItemIndex = partIdx // Save index (unused, using dataTransfer)
                // We need to know WHICH variation it came from
                if ((e as DragEvent).dataTransfer) {
                    (e as DragEvent).dataTransfer?.setData('text/plain', JSON.stringify({ varIdx, partIdx }))
                }
                (item as HTMLElement).classList.add('dragging')
            })

            item.addEventListener('dragend', () => {
                // draggedArrangementItemIndex = null
                ; (item as HTMLElement).classList.remove('dragging')
                document.querySelectorAll('.arrangement-list-item').forEach(el => el.classList.remove('drag-over'))
            })

            // Drag Over (Reordering)
            item.addEventListener('dragover', (e) => {
                e.preventDefault()
                e.stopPropagation() // Stop column drop
                // const data = (e as DragEvent).dataTransfer?.getData('text/plain')
                // Only allow reorder within same list or move?
                // Let's implement move between lists support!
                item.classList.add('drag-over')
            })

            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over')
            })

            item.addEventListener('drop', (e) => {
                e.preventDefault()
                e.stopPropagation()
                item.classList.remove('drag-over')

                try {
                    const data = JSON.parse((e as DragEvent).dataTransfer?.getData('text/plain') || '{}')
                    if (data.varIdx !== undefined && data.partIdx !== undefined) {
                        // Move logic
                        const sourceVar = currentSong.variations[data.varIdx]
                        const targetVar = currentSong.variations[varIdx]

                        const [movedPart] = sourceVar.arrangement.splice(data.partIdx, 1)

                        targetVar.arrangement.splice(partIdx, 0, movedPart)
                        renderArrangementEditor()
                    }
                } catch (err) { }
            })
        })
    }

    // Initial Render
    renderParts()
    renderArrangementEditor()

    // -- Event Listeners --

    // Close modal
    const closeModal = () => {
        document.body.style.overflow = ''
        modal.remove()
    }

    // Close on X button
    modal.querySelector('.close-modal-btn')?.addEventListener('click', closeModal)
    modal.querySelector('.cancel-btn')?.addEventListener('click', closeModal)

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal()
        }
    })

    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            closeModal()
            document.removeEventListener('keydown', handleEscape)
        }
    }
    document.addEventListener('keydown', handleEscape)

    // Add Specific Part Buttons
    modal.querySelectorAll('.btn-add-part').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = (e.currentTarget as HTMLElement).getAttribute('data-type') || 'v'

            // Shorthand map and Label Map
            const map: any = {
                'V': { short: 'V', label: 'Verse' },
                'CH': { short: 'CH', label: 'Chorus' },
                'pCH': { short: 'pCH', label: 'Pre-Chorus' },
                'BR': { short: 'BR', label: 'Bridge' },
                'TAG': { short: 'TAG', label: 'Tag' },
                'IN': { short: 'IN', label: 'Intro' },
                'OUT': { short: 'OUT', label: 'Outro' }
            }

            const info = map[type]
            // Auto Numbering
            // Count existing parts of this type
            const existing = currentSong.parts.filter(p => p.id.startsWith(info.short))
            // Find max number
            let maxNum = 0
            existing.forEach(p => {
                const parts = p.id.split(' ')
                if (parts.length > 1) {
                    const num = parseInt(parts[1])
                    if (!isNaN(num) && num > maxNum) maxNum = num
                }
            })
            const nextNum = maxNum + 1

            const newId = `${info.short} ${nextNum}`
            const newLabel = `${info.label} ${nextNum}`

            currentSong.parts.push({ id: newId, label: newLabel, slides: [''] })
            renderParts()

            // Scroll to new part
            setTimeout(() => {
                const container = modal.querySelector('#parts-container')
                const lastPart = container?.querySelector('.part-item:last-child')
                lastPart?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                const labelInput = lastPart?.querySelector('.part-label-input') as HTMLInputElement
                labelInput?.focus()
                labelInput?.select()
            }, 50)
        })
    })

    // Save
    modal.querySelector('.save-btn')?.addEventListener('click', async () => {
        const titleInput = modal.querySelector('#song-title') as HTMLInputElement
        const artistInput = modal.querySelector('#song-artist') as HTMLInputElement

        currentSong.title = titleInput.value.trim()
        currentSong.artist = artistInput.value.trim()

        if (!currentSong.title) {
            titleInput.focus()
            titleInput.classList.add('input-error')
            const status = modal.querySelector('#status-msg') as HTMLElement
            status.textContent = 'Please enter a song title'
            status.className = 'status-msg error'
            return
        }

        const status = modal.querySelector('#status-bar') as HTMLElement
        const saveBtn = modal.querySelector('.save-btn') as HTMLButtonElement
        saveBtn.disabled = true
        status.textContent = 'Saving...'
        status.className = 'status-bar saving'

        try {
            await saveSong(currentSong)
            status.textContent = 'Saved successfully!'
            status.className = 'status-msg success'

            // Refresh lists
            const songs = await fetchSongs()
            updateState({ songs })

            setTimeout(closeModal, 800)
        } catch (e) {
            status.textContent = 'Error saving song. Please try again.'
            status.className = 'status-bar error'
            saveBtn.disabled = false
            console.error(e)
        }
    })

    // Remove error class on input
    modal.querySelector('#song-title')?.addEventListener('input', (e) => {
        (e.target as HTMLElement).classList.remove('input-error')
    })

    // Resizer Logic
    const resizer = modal.querySelector('#editor-resizer') as HTMLElement
    const rightPanel = modal.querySelector('.editor-sidebar') as HTMLElement
    const container = modal.querySelector('.editor-layout') as HTMLElement

    let isResizing = false

    resizer?.addEventListener('mousedown', (e) => {
        isResizing = true
        document.body.style.cursor = 'col-resize'
        resizer.classList.add('resizing')
        e.preventDefault() // Prevent text selection
    })

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return
        const containerRect = container.getBoundingClientRect()
        // Right width = Container Right - Mouse X
        // We use Right Panel width as the flex-basis
        const newRightWidth = containerRect.right - e.clientX

        // Constraints (min 200px, max container width - 200px)
        if (newRightWidth > 200 && newRightWidth < containerRect.width - 200) {
            rightPanel.style.flex = `0 0 ${newRightWidth}px`
            rightPanel.style.width = `${newRightWidth}px`
        }
    })

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false
            document.body.style.cursor = ''
            resizer?.classList.remove('resizing')
        }
    })
}
