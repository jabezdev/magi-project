/**
 * Song Editor Modal Component
 * Handles creating and editing songs, including parts and arrangements.
 */
import { ICONS } from '../../constants'
import { fetchSongById, saveSong, fetchSongs } from '../../services'
import type { Song } from '../../types'
import { state, updateState } from '../../state'
import { DEFAULT_PART_COLORS } from '../../constants'
import { getContrastColor } from '../../utils'

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

export async function openSongEditor(songId?: number, onSave?: () => void): Promise<void> {
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

    // Styles (Inline Tailwind Constants)
    const modalContentClass = "w-screen max-w-[100vw] min-w-0 h-screen max-h-screen flex flex-col bg-bg-primary border-none rounded-none overflow-hidden shadow-none";
    const headerClass = "flex justify-between items-center p-0 bg-bg-secondary border-b border-border-color shrink-0 h-[2.8rem] min-h-0";
    const headerTitleGroupClass = "flex items-center gap-3 h-full";
    const headerInputClass = "bg-bg-tertiary border border-border-color text-text-primary px-2 py-[0.2rem] text-[0.95rem] font-semibold rounded transition-all duration-150 focus:border-accent-primary focus:bg-bg-secondary focus:outline-none hover:border-text-secondary";
    const btnSaveClass = "h-full w-auto min-w-[100px] border-l border-border-color rounded-none m-0 px-4 bg-accent-primary flex items-center justify-center gap-2 text-white text-[0.85rem] font-semibold transition-colors duration-200 hover:bg-accent-secondary";
    const btnCancelClass = "h-full w-auto min-w-[80px] border-l border-border-color rounded-none m-0 px-4 bg-transparent flex items-center justify-center text-text-secondary text-[0.85rem] transition-colors duration-200 hover:bg-bg-hover hover:text-text-primary";

    const sectionHeaderClass = "flex items-center gap-2 mb-2 shrink-0";
    const sectionTitleClass = "m-0 text-xs text-text-secondary uppercase tracking-[0.5px]";

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
        /* btn-add-part inline styles: 
           flex-auto py-2 px-4 text-[0.9rem] font-bold uppercase border-none rounded cursor-pointer transition-all duration-150 text-center min-w-[40px] opacity-90
           hover: opacity-100 -translate-y-[1px] shadow-sm
        */
        const btnClass = "flex-auto py-2 px-4 text-[0.9rem] font-bold uppercase border-none rounded cursor-pointer transition-all duration-150 text-center min-w-[40px] opacity-90 hover:opacity-100 hover:-translate-y-[1px] hover:shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
        return `<button class="${btnClass} btn-add-part" data-type="${pt.id}" style="background-color: ${color}; color: ${textColor} !important;">${pt.label}</button>`
    }).join('')

    // Create Modal HTML
    const modal = document.createElement('div')
    modal.className = 'modal-overlay'
    modal.innerHTML = `
    <div class="${modalContentClass} song-editor-modal">
      <div class="${headerClass}">
        <div class="flex h-full items-center gap-2 pl-4">
            <div class="${headerTitleGroupClass}">
                <span class="modal-icon">${ICONS.music}</span>
                <h2>${song.id ? 'Edit Song' : 'New Song'}</h2>
            </div>
        </div>
        <div class="flex h-full items-center justify-center flex-1" style="justify-content: flex-start; padding-left: 1rem;">
             <div class="flex items-center gap-2">
                <input type="text" id="song-title" class="${headerInputClass} w-[250px]" value="${escapeHtml(song.title)}" placeholder="Song Title" />
                <span class="text-text-muted font-normal">-</span>
                <input type="text" id="song-artist" class="${headerInputClass} w-[180px] text-text-secondary" value="${escapeHtml(song.artist || '')}" placeholder="Artist" />
            </div>
            <div id="status-bar" class="text-center text-xs h-4 mt-1 text-text-muted" style="margin: 0; margin-left: auto;"></div>
        </div>
        <div class="flex h-full items-center gap-0 pr-0">
            <button class="${btnCancelClass} cancel-btn">Cancel</button>
            <button class="${btnSaveClass} save-btn">${ICONS.save} Save</button>
        </div>
      </div>
      
      <div class="flex-1 overflow-hidden p-0 min-h-0 flex flex-col modal-body">
        <!-- Bottom: Parts & Arrangements side by side -->
        <div class="flex flex-1 min-h-0 overflow-hidden editor-layout">
          <!-- Left: Parts -->
          <div class="flex-1 basis-1/2 min-w-0 flex flex-col overflow-hidden p-2 editor-main">
            <div class="flex-1 overflow-hidden flex flex-col px-2 parts-section">
              <div class="${sectionHeaderClass}">
                <h3 class="${sectionTitleClass}">Parts</h3>
                <div class="flex flex-wrap gap-[0.35rem] mb-3 p-1 bg-bg-tertiary rounded-md border border-border-color add-parts-toolbar" style="margin: 0; border: none; background: transparent; padding: 0;">
                    ${addPartsButtonsHtml}
                </div>
              </div>
              
              <div class="flex flex-col gap-1 overflow-y-auto flex-1 pr-1 parts-list" id="parts-container">
                <!-- Parts will be rendered here -->
              </div>
              <div class="text-center py-6 px-4 text-text-muted bg-bg-secondary border border-dashed border-border-color rounded empty-parts-message" id="empty-parts" style="display: none;">
                <p class="m-0 text-[0.75rem]">No parts yet. Click "Add Part" to create your first verse or chorus.</p>
              </div>
            </div>
          </div>

          <!-- Resizer -->
          <div class="w-1 bg-border-color cursor-col-resize shrink-0 transition-colors duration-200 z-10 hover:bg-accent-primary editor-resizer" id="editor-resizer"></div>

          <!-- Right: Arrangements -->
          <div class="flex-1 basis-1/2 min-w-0 flex flex-col overflow-hidden bg-bg-secondary p-2 editor-sidebar">
            <div class="flex-1 overflow-hidden flex flex-col py-2 px-3 arrangements-section">
                <!-- Top: Available Parts to Add -->
                <div class="shrink-0 pb-2 available-parts-section">
                    <label class="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.3px] mb-1">Add to Arrangement:</label>
                    <div class="flex flex-wrap gap-1 available-parts-chips" id="available-parts">
                        <!-- Available parts chips -->
                    </div>
                </div>

                <div class="h-[1px] bg-border-color my-2 shrink-0 resizer-separator"></div>

                <div class="${sectionHeaderClass}">
                    <h3 class="${sectionTitleClass}">Arrangements</h3>
                </div>
              
                <div class="flex-1 overflow-x-auto overflow-y-hidden flex flex-row gap-3 p-2 bg-bg-tertiary border border-border-color rounded mb-2 arrangement-editor-list" id="active-arrangement-list">
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

    const btnIconClass = "flex items-center justify-center w-[22px] h-[22px] bg-transparent border-none rounded-[3px] text-text-muted cursor-pointer transition-all duration-150 hover:bg-bg-hover hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed";

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

        // Styles for Part Item
        const partItemClass = "flex gap-[0.35rem] bg-bg-secondary border border-border-color rounded p-[0.4rem] transition-all duration-200 hover:border-text-muted";
        const dragHandleClass = "flex items-start justify-center pt-1 text-text-muted cursor-grab shrink-0 w-4 active:cursor-grabbing";
        const contentWrapperClass = "flex-1 flex flex-col gap-[0.35rem] min-w-0 overflow-hidden";
        const headerRowClass = "flex items-center gap-[0.35rem] flex-nowrap";
        const badgeClass = "flex items-center justify-center rounded-[3px] overflow-hidden shrink-0";
        const idInputClass = "w-[60px] px-[0.35rem] py-1 bg-transparent border-none text-white text-[0.9rem] font-bold text-center uppercase focus:shadow-none focus:bg-black/20";
        const labelInputClass = "flex-1 px-2 py-1 font-medium bg-transparent border-none text-text-primary text-base font-inherit focus:outline-none"; // Simplified label input
        const actionsClass = "flex items-center gap-[0.25rem] opacity-100";
        const btnIconClass = "flex items-center justify-center w-[22px] h-[22px] bg-transparent border-none rounded-[3px] text-text-muted cursor-pointer transition-all duration-150 hover:bg-bg-hover hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed";
        const textAreaClass = "flex-1 min-h-[60px] p-2 border border-border-color rounded bg-bg-primary text-text-primary leading-[1.5] resize-none text-[0.95rem] focus:outline-none focus:border-accent-primary focus:bg-bg-secondary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all duration-150";

        container.innerHTML = currentSong.parts.map((part, index) => `
        <div class="${partItemClass} part-item" data-index="${index}" draggable="true">
            <div class="${dragHandleClass} part-drag-handle" title="Drag to reorder">${ICONS.grip}</div>
            <div class="${contentWrapperClass}">
                <div class="${headerRowClass}">
                    ${(() => {
                const color = getPartColor(part.id)
                const textColor = getContrastColor(color)
                return `<div class="${badgeClass} part-id-badge" style="background: ${color}">
                                    <input type="text" class="${idInputClass} part-id-input" value="${escapeHtml(part.id)}" placeholder="ID" title="Part ID (e.g. v1, ch)" style="color: ${textColor} !important;" />
                                </div>`
            })()}
                    <input type="text" class="${labelInputClass} part-label-input" value="${escapeHtml(part.label || '')}" placeholder="Part name (e.g. Verse 1, Chorus)" />
                    <div class="${actionsClass} part-actions">
                        <div class="text-xs text-text-muted font-semibold whitespace-nowrap pt-2 min-w-[50px] text-right slide-count" style="width: auto; padding: 0 0.5rem; text-align: center; font-size: 0.75rem;">${part.slides.filter(s => s.trim()).length} slide${part.slides.filter(s => s.trim()).length !== 1 ? 's' : ''}</div>
                        <button class="${btnIconClass} move-up-btn" title="Move Up" ${index === 0 ? 'disabled' : ''}>${ICONS.chevronUp}</button>
                        <button class="${btnIconClass} move-down-btn" title="Move Down" ${index === currentSong.parts.length - 1 ? 'disabled' : ''}>${ICONS.chevronDown}</button>
                        <button class="${btnIconClass} delete-part-btn hover:text-danger hover:bg-red-500/10" title="Delete Part">${ICONS.trash}</button>
                    </div>
                </div>
                <div class="flex gap-2 items-start part-lyrics">
                    <textarea class="${textAreaClass} part-content" placeholder="Enter lyrics here...&#10;&#10;Use a blank line to create a new slide.">${escapeHtml(part.slides.join('\n\n'))}</textarea>
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
                    ; (item as HTMLElement).classList.add('opacity-50', 'border-accent-primary') // dragging styles
                    ; (e as DragEvent).dataTransfer?.setData('text/plain', 'part')
            })

            item.addEventListener('dragend', () => {
                isHandleDrag = false
                draggedPartIndex = null
                    ; (item as HTMLElement).classList.remove('opacity-50', 'border-accent-primary')
                container.querySelectorAll('.part-item').forEach(el => {
                    el.classList.remove('border-accent-primary')
                        ; (el as HTMLElement).style.backgroundColor = ''
                })
            })

            item.addEventListener('dragover', (e) => {
                e.preventDefault()
                if (draggedPartIndex !== null && draggedPartIndex !== index) {
                    item.classList.add('border-accent-primary')
                        ; (item as HTMLElement).style.backgroundColor = 'rgba(99, 102, 241, 0.05)'
                }
            })

            item.addEventListener('dragleave', () => {
                item.classList.remove('border-accent-primary')
                    ; (item as HTMLElement).style.backgroundColor = ''
            })

            item.addEventListener('drop', (e) => {
                e.preventDefault()
                item.classList.remove('border-accent-primary')
                    ; (item as HTMLElement).style.backgroundColor = ''
                if (draggedPartIndex !== null && draggedPartIndex !== index) {
                    const [movedPart] = currentSong.parts.splice(draggedPartIndex, 1)
                    currentSong.parts.splice(index, 0, movedPart)
                    renderParts()
                    renderAvailableParts()
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
            container.innerHTML = '<span class="text-xs text-text-muted no-parts-hint">Add parts first</span>'
            return
        }

        const chipClass = "inline-flex items-center py-[0.35rem] px-[0.6rem] text-white text-[0.75rem] font-bold rounded border-none cursor-pointer transition-all duration-150 uppercase hover:brightness-110";

        container.innerHTML = currentSong.parts.map((part) => {
            const color = getPartColor(part.id)
            const textColor = getContrastColor(color)
            return `<button class="${chipClass} part-chip" data-id="${escapeHtml(part.id)}" style="background-color: ${color}; color: ${textColor} !important;">
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

        // Styles
        const colClass = "min-w-[140px] w-[160px] bg-bg-secondary border border-border-color rounded-md flex flex-col overflow-hidden shrink-0 transition-all duration-200";
        const colActiveClass = "border-2 border-accent-primary shadow-[0_0_0_2px_rgba(99,102,241,0.2)]"; // Replaced @apply mix
        const colHeaderClass = "p-2 bg-bg-tertiary border-b border-border-color flex justify-between items-center cursor-pointer";
        const arrNameClass = "text-[0.8rem] font-bold flex-1 min-w-0 whitespace-normal break-words overflow-visible p-1 rounded-[3px] focus:bg-bg-tertiary focus:outline focus:outline-1 focus:outline-accent-primary";
        const colItemsClass = "flex-1 overflow-y-auto p-2 flex flex-col gap-1 min-h-[100px]";
        const listItemClass = "flex items-center justify-between py-[0.4rem] px-[0.6rem] bg-bg-primary border-none rounded cursor-grab select-none transition-all duration-100 text-[0.8rem] font-bold text-white uppercase hover:bg-bg-hover hover:border-text-muted"; // Adding hover logic via css classes might be tricky if style attribute overrides. Handled in JS listeners or specific atomic classes. The style attribute for BG overrides bg-bg-primary.

        // Render Columns
        listContainer.innerHTML = currentSong.variations.map((v, i) => `
            <div class="${colClass} arrangement-column ${i === activeVariationIndex ? 'active ' + colActiveClass : ''}" data-index="${i}" style="${i === activeVariationIndex ? 'border-color: var(--accent-primary);' : ''}">
                <div class="${colHeaderClass} arrangement-column-header">
                    <span class="${arrNameClass} arr-name" contenteditable="true" title="Click to edit name" data-index="${i}">${escapeHtml(v.name)}</span>
                    <button class="${btnIconClass.replace('bg-transparent', '')} delete-var-btn" title="Delete Arrangement" data-index="${i}">&times;</button>
                </div>
                <div class="${colItemsClass} arrangement-column-items" data-index="${i}">
                    ${v.arrangement.map((partId, partIdx) => {
            const bgColor = getPartColor(partId)
            const textColor = getContrastColor(bgColor)
            return `<div class="${listItemClass} arrangement-list-item" data-var-index="${i}" data-part-index="${partIdx}" draggable="true" style="background: ${bgColor}; border: none; padding-left: 0.5rem;">
                            <span class="text-[0.8rem] font-medium text-text-primary arr-item-name" style="color: ${textColor};">${escapeHtml(partId)}</span>
                            <button class="${btnIconClass} remove-arr-item-btn opacity-80 hover:text-danger hover:opacity-100" title="Remove" style="color: ${textColor};">&times;</button>
                        </div>`
        }).join('')}
                    ${v.arrangement.length === 0 ? '<div class="empty-col-message" style="font-size: 0.7rem; color: #888; text-align: center; padding: 1rem;">Drop parts here</div>' : ''}
                </div>
            </div>
        `).join('') + `
            <button class="${colClass} add-new-column-btn" style="min-width: 60px; width: 60px; justify-content: center; align-items: center; border: 2px dashed var(--border-color); cursor: pointer; background: transparent; color: var(--text-muted); opacity: 0.7;">
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

            // Activate on click
            col.addEventListener('mousedown', (e) => {
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
            nameSpan?.addEventListener('keydown', (e: any) => {
                e.stopPropagation()
                if (e.key === 'Enter') {
                    e.preventDefault()
                    e.target.blur()
                }
            })

            // Drop Target for Column
            const itemsContainer = col.querySelector('.arrangement-column-items') as HTMLElement

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
                if ((e as DragEvent).dataTransfer) {
                    (e as DragEvent).dataTransfer?.setData('text/plain', JSON.stringify({ varIdx, partIdx }))
                }
                (item as HTMLElement).classList.add('opacity-50')
            })

            item.addEventListener('dragend', () => {
                (item as HTMLElement).classList.remove('opacity-50')
                document.querySelectorAll('.arrangement-list-item').forEach(el => el.classList.remove('border-t-2', 'border-accent-primary', 'mt-1'))
            })

            // Drag Over (Reordering)
            item.addEventListener('dragover', (e) => {
                e.preventDefault()
                e.stopPropagation()
                item.classList.add('border-t-2', 'border-accent-primary', 'mt-1')
            })

            item.addEventListener('dragleave', () => {
                item.classList.remove('border-t-2', 'border-accent-primary', 'mt-1')
            })

            item.addEventListener('drop', (e) => {
                e.preventDefault()
                e.stopPropagation()
                item.classList.remove('border-t-2', 'border-accent-primary', 'mt-1')

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

    // Add Specific Part Buttons (Click)
    modal.querySelectorAll('.btn-add-part').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = (e.currentTarget as HTMLElement).getAttribute('data-type') || 'v'

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
            const existing = currentSong.parts.filter(p => p.id.startsWith(info.short))
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
            titleInput.classList.add('border-danger', 'animate-[shake_0.3s_ease]') // custom error classes
            const statusBar = modal.querySelector('#status-bar') as HTMLElement
            statusBar.textContent = 'Please enter a song title'
            statusBar.className = 'text-center text-xs h-4 mt-1 text-danger'

            setTimeout(() => titleInput.classList.remove('animate-[shake_0.3s_ease]'), 300)
            return
        }

        const status = modal.querySelector('#status-bar') as HTMLElement
        const saveBtn = modal.querySelector('.save-btn') as HTMLButtonElement
        saveBtn.disabled = true
        status.textContent = 'Saving...'
        status.className = 'text-center text-xs h-4 mt-1 text-accent-primary'

        try {
            await saveSong(currentSong)
            status.textContent = 'Saved successfully!'
            status.className = 'text-center text-xs h-4 mt-1 text-success'

            // Refresh lists
            const songs = await fetchSongs()
            updateState({ songs })

            setTimeout(closeModal, 800)
            if (onSave) onSave()
        } catch (e) {
            status.textContent = 'Error saving song. Please try again.'
            status.className = 'text-center text-xs h-4 mt-1 text-danger'
            saveBtn.disabled = false
            console.error(e)
        }
    })

    // Remove error class on input
    modal.querySelector('#song-title')?.addEventListener('input', (e) => {
        (e.target as HTMLElement).classList.remove('border-danger')
    })

    // Resizer Logic
    const resizer = modal.querySelector('#editor-resizer') as HTMLElement
    const rightPanel = modal.querySelector('.editor-sidebar') as HTMLElement
    const container = modal.querySelector('.editor-layout') as HTMLElement

    let isResizing = false

    resizer?.addEventListener('mousedown', (e) => {
        isResizing = true
        document.body.style.cursor = 'col-resize'
        resizer.classList.add('bg-accent-primary')
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
            resizer?.classList.remove('bg-accent-primary')
        }
    })
}
