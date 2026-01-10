import { ICONS } from '../constants/icons'
import { fetchSongById, saveSong } from '../services/api'
import type { Song } from '../types'
import { fetchSongs } from '../services/api'
import { updateState } from '../state'

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

    // Create Modal HTML
    const modal = document.createElement('div')
    modal.className = 'modal-overlay'
    modal.innerHTML = `
    <div class="modal-content song-editor-modal">
      <div class="modal-header">
        <div class="modal-title-group">
          <span class="modal-icon">${ICONS.music}</span>
          <h2>${song.id ? 'Edit Song' : 'Create New Song'}</h2>
        </div>
        <button class="close-modal-btn" title="Close">${ICONS.close}</button>
      </div>
      
      <div class="modal-body">
        <!-- Top: Song Information -->
        <div class="editor-section song-info-section">
          <div class="song-meta-row">
            <div class="form-group title-field">
                <label for="song-title">Title</label>
                <input type="text" id="song-title" value="${escapeHtml(song.title)}" placeholder="Enter song title..." />
            </div>
            <div class="form-group artist-field">
                <label for="song-artist">Artist / Author</label>
                <input type="text" id="song-artist" value="${escapeHtml(song.artist || '')}" placeholder="Optional" />
            </div>
          </div>
        </div>

        <!-- Bottom: Parts & Arrangements side by side -->
        <div class="editor-layout">
          <!-- Left: Parts -->
          <div class="editor-main">
            <div class="editor-section parts-section">
              <div class="section-header">
                <h3>Parts</h3>
                <span class="section-hint">Define verses, choruses, bridges, etc.</span>
                <button class="btn-add add-part-btn">${ICONS.plus} Add Part</button>
              </div>
              <div class="parts-list" id="parts-container">
                <!-- Parts will be rendered here -->
              </div>
              <div class="empty-parts-message" id="empty-parts" style="display: none;">
                <p>No parts yet. Click "Add Part" to create your first verse or chorus.</p>
              </div>
            </div>
          </div>

          <!-- Right: Arrangements -->
          <div class="editor-sidebar">
            <div class="editor-section arrangements-section">
              <div class="section-header">
                <h3>Arrangements</h3>
                <button class="btn-add add-variation-btn">${ICONS.plus}</button>
              </div>
              <p class="section-description">Create different arrangements by ordering parts. Click a part chip to add it.</p>
              <div class="variations-list" id="variations-container">
                <!-- Variations will be rendered here -->
              </div>
              <div class="available-parts-section">
                <label>Available Parts:</label>
                <div class="available-parts-chips" id="available-parts">
                  <!-- Available parts chips for quick add -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="footer-left">
          <span id="status-msg" class="status-msg"></span>
        </div>
        <div class="footer-actions">
            <button class="btn-ghost cancel-btn">Cancel</button>
            <button class="btn-primary save-btn">${ICONS.save} Save Song</button>
        </div>
      </div>
    </div>
  `

    document.body.appendChild(modal)

    // Prevent body scroll
    document.body.style.overflow = 'hidden'

    // -- LOGIC --
    let currentSong: Song = JSON.parse(JSON.stringify(song)) // Deep copy
    let draggedPartIndex: number | null = null
    let draggedChipIndex: number | null = null
    let draggedVariationIndex: number | null = null

    const getPartColor = (id: string): string => {
        const colors: Record<string, string> = {
            'v': '#6366f1', // verse - indigo
            'c': '#22c55e', // chorus - green
            'p': '#f59e0b', // pre-chorus - amber
            'b': '#ec4899', // bridge - pink
            't': '#8b5cf6', // tag - purple
            'i': '#06b6d4', // intro - cyan
            'o': '#ef4444', // outro - red
        }
        const prefix = id.charAt(0).toLowerCase()
        return colors[prefix] || '#64748b'
    }

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
                    <div class="part-id-badge" style="background: ${getPartColor(part.id)}">
                        <input type="text" class="part-id-input" value="${escapeHtml(part.id)}" placeholder="ID" title="Part ID (e.g. v1, ch)" />
                    </div>
                    <input type="text" class="part-label-input" value="${escapeHtml(part.label || '')}" placeholder="Part name (e.g. Verse 1, Chorus)" />
                    <div class="part-actions">
                        <button class="btn-icon move-up-btn" title="Move Up" ${index === 0 ? 'disabled' : ''}>${ICONS.chevronUp}</button>
                        <button class="btn-icon move-down-btn" title="Move Down" ${index === currentSong.parts.length - 1 ? 'disabled' : ''}>${ICONS.chevronDown}</button>
                        <button class="btn-icon delete-part-btn" title="Delete Part">${ICONS.trash}</button>
                    </div>
                </div>
                <div class="part-lyrics">
                    <textarea class="part-content" placeholder="Enter lyrics here...&#10;&#10;Use a blank line to create a new slide.">${escapeHtml(part.slides.join('\n\n'))}</textarea>
                    <div class="slide-count">${part.slides.filter(s => s.trim()).length} slide${part.slides.filter(s => s.trim()).length !== 1 ? 's' : ''}</div>
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

            // Drag events for parts
            item.addEventListener('dragstart', (e) => {
                draggedPartIndex = index
                ;(item as HTMLElement).classList.add('dragging')
                ;(e as DragEvent).dataTransfer?.setData('text/plain', 'part')
            })

            item.addEventListener('dragend', () => {
                draggedPartIndex = null
                ;(item as HTMLElement).classList.remove('dragging')
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
                }
            })

            idInput?.addEventListener('input', (e) => {
                currentSong.parts[index].id = (e.target as HTMLInputElement).value
                // Update badge color
                const badge = item.querySelector('.part-id-badge') as HTMLElement
                if (badge) badge.style.background = getPartColor(currentSong.parts[index].id)
                renderAvailableParts()
                renderVariations()
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
                    renderVariations()
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

        container.innerHTML = currentSong.parts.map((part) => `
            <button class="part-chip" data-id="${escapeHtml(part.id)}" style="--chip-color: ${getPartColor(part.id)}">
                ${escapeHtml(part.id)}
            </button>
        `).join('')

        // Attach click listeners
        container.querySelectorAll('.part-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const partId = (chip as HTMLElement).getAttribute('data-id')
                if (partId && currentSong.variations.length > 0) {
                    currentSong.variations[0].arrangement.push(partId)
                    renderVariations()
                }
            })
        })
    }

    const renderVariations = () => {
        const container = modal.querySelector('#variations-container') as HTMLElement
        if (!container) return

        if (currentSong.variations.length === 0) {
            container.innerHTML = '<div class="empty-variations">No arrangements yet. Click + to add one.</div>'
            return
        }

        container.innerHTML = currentSong.variations.map((v, index) => `
         <div class="variation-item" data-index="${index}">
             <div class="variation-header">
                 <input type="text" class="variation-name-input" value="${escapeHtml(v.name)}" placeholder="Arrangement name..." />
                 <button class="btn-icon delete-variation-btn" title="Delete">${ICONS.trash}</button>
             </div>
             <div class="variation-arrangement" data-var-index="${index}">
                 ${v.arrangement.length === 0 
                    ? '<span class="arrangement-hint">Click parts below to build arrangement</span>'
                    : v.arrangement.map((partId, chipIdx) => {
                        return `<span class="arrangement-chip" data-chip-index="${chipIdx}" draggable="true" style="--chip-color: ${getPartColor(partId)}">
                            ${escapeHtml(partId)}
                            <button class="chip-remove" data-chip-index="${chipIdx}">&times;</button>
                        </span>`
                    }).join('')
                 }
             </div>
         </div>
       `).join('')

        // Attach listeners
        container.querySelectorAll('.variation-item').forEach((item) => {
            const index = parseInt(item.getAttribute('data-index') || '0')
            const nameInput = item.querySelector('.variation-name-input') as HTMLInputElement
            const deleteBtn = item.querySelector('.delete-variation-btn')

            nameInput?.addEventListener('input', (e) => {
                currentSong.variations[index].name = (e.target as HTMLInputElement).value
            })

            deleteBtn?.addEventListener('click', () => {
                currentSong.variations.splice(index, 1)
                renderVariations()
            })

            // Remove chip buttons
            item.querySelectorAll('.chip-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation()
                    const chipIdx = parseInt((btn as HTMLElement).getAttribute('data-chip-index') || '0')
                    currentSong.variations[index].arrangement.splice(chipIdx, 1)
                    renderVariations()
                })
            })

            // Drag and drop for arrangement chips
            item.querySelectorAll('.arrangement-chip').forEach(chip => {
                chip.addEventListener('dragstart', (e) => {
                    draggedChipIndex = parseInt((chip as HTMLElement).getAttribute('data-chip-index') || '0')
                    draggedVariationIndex = index
                    ;(chip as HTMLElement).classList.add('chip-dragging')
                    ;(e as DragEvent).dataTransfer?.setData('text/plain', 'chip')
                })

                chip.addEventListener('dragend', () => {
                    draggedChipIndex = null
                    draggedVariationIndex = null
                    ;(chip as HTMLElement).classList.remove('chip-dragging')
                    container.querySelectorAll('.arrangement-chip').forEach(c => c.classList.remove('chip-drag-over'))
                })

                chip.addEventListener('dragover', (e) => {
                    e.preventDefault()
                    if (draggedChipIndex !== null && draggedVariationIndex === index) {
                        chip.classList.add('chip-drag-over')
                    }
                })

                chip.addEventListener('dragleave', () => {
                    chip.classList.remove('chip-drag-over')
                })

                chip.addEventListener('drop', (e) => {
                    e.preventDefault()
                    chip.classList.remove('chip-drag-over')
                    const targetIdx = parseInt((chip as HTMLElement).getAttribute('data-chip-index') || '0')
                    if (draggedChipIndex !== null && draggedVariationIndex === index && draggedChipIndex !== targetIdx) {
                        const arr = currentSong.variations[index].arrangement
                        const [movedChip] = arr.splice(draggedChipIndex, 1)
                        arr.splice(targetIdx, 0, movedChip)
                        renderVariations()
                    }
                })
            })
        })
    }

    // Initial Render
    renderParts()
    renderVariations()

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

    // Add Part
    modal.querySelector('.add-part-btn')?.addEventListener('click', () => {
        const newId = currentSong.parts.length === 0 ? 'v1' 
            : `v${currentSong.parts.filter(p => p.id.startsWith('v')).length + 1}`
        const newLabel = currentSong.parts.length === 0 ? 'Verse 1'
            : `Verse ${currentSong.parts.filter(p => p.id.startsWith('v')).length + 1}`
        
        currentSong.parts.push({ id: newId, label: newLabel, slides: [''] })
        renderParts()
        
        // Scroll to new part and focus
        setTimeout(() => {
            const container = modal.querySelector('#parts-container')
            const lastPart = container?.querySelector('.part-item:last-child')
            lastPart?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            const labelInput = lastPart?.querySelector('.part-label-input') as HTMLInputElement
            labelInput?.focus()
            labelInput?.select()
        }, 50)
    })

    // Add Variation
    modal.querySelector('.add-variation-btn')?.addEventListener('click', () => {
        const name = currentSong.variations.length === 0 ? 'Default' : `Arrangement ${currentSong.variations.length + 1}`
        currentSong.variations.push({ id: Date.now(), name, arrangement: [] })
        renderVariations()
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

        const status = modal.querySelector('#status-msg') as HTMLElement
        const saveBtn = modal.querySelector('.save-btn') as HTMLButtonElement
        saveBtn.disabled = true
        status.textContent = 'Saving...'
        status.className = 'status-msg saving'

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
            status.className = 'status-msg error'
            saveBtn.disabled = false
            console.error(e)
        }
    })

    // Remove error class on input
    modal.querySelector('#song-title')?.addEventListener('input', (e) => {
        (e.target as HTMLElement).classList.remove('input-error')
    })
}
