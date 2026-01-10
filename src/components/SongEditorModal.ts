import { ICONS } from '../constants/icons'
import { fetchSongById, saveSong } from '../services/api'
import type { Song } from '../types'
import { fetchSongs } from '../services/api'
import { updateState } from '../state'

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
            id: 0, // Will be set by server
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
        <h2>${song.id ? 'Edit Song' : 'New Song'}</h2>
        <button class="icon-btn close-modal-btn">${ICONS.clear}</button>
      </div>
      <div class="modal-body">
        
        <div class="form-group">
            <label>Title</label>
            <input type="text" id="song-title" value="${song.title}" placeholder="Song Title" />
        </div>
        <div class="form-group">
            <label>Artist</label>
            <input type="text" id="song-artist" value="${song.artist || ''}" placeholder="Artist" />
        </div>

        <div class="editor-tabs">
            <button class="tab-btn active" data-tab="parts">Parts</button>
            <button class="tab-btn" data-tab="variations">Variations</button>
        </div>

        <div class="tab-content active" id="tab-parts">
            <div class="parts-list" id="parts-container">
                <!-- Parts will be rendered here -->
            </div>
            <button class="btn secondary add-part-btn">+ Add Part</button>
        </div>

        <div class="tab-content" id="tab-variations" style="display: none;">
            <div class="variations-list" id="variations-container">
                <!-- Variations will be rendered here -->
            </div>
            <button class="btn secondary add-variation-btn">+ Add Variation</button>
        </div>

      </div>
      <div class="modal-footer">
        <div id="status-msg" class="status-msg"></div>
        <div class="footer-actions">
            <button class="btn secondary cancel-btn">Cancel</button>
            <button class="btn primary save-btn">Save Song</button>
        </div>
      </div>
    </div>
  `

    document.body.appendChild(modal)

    // -- LOGIC --

    let currentSong = { ...song } // Local copy

    const renderParts = () => {
        const container = modal.querySelector('#parts-container')
        if (!container) return

        container.innerHTML = currentSong.parts.map((part, index) => `
        <div class="part-item" data-index="${index}">
            <div class="part-header">
                 <div class="part-ids" style="display: flex; gap: 0.5rem; width: 100%;">
                    <input type="text" class="part-id-input" value="${part.id}" placeholder="ID (e.g. v1)" style="width: 80px;" />
                    <input type="text" class="part-label-input" value="${part.label || ''}" placeholder="Label (e.g. Verse 1)" style="flex: 1;" />
                 </div>
                <button class="icon-btn delete-part-btn">&times;</button>
            </div>
            <div class="part-slides">
                <textarea class="part-content" placeholder="Enter lyrics... Use double newline for new slide.">${part.slides.join('\n\n')}</textarea>
            </div>
        </div>
      `).join('')

        // Attach listeners for inputs within parts
        container.querySelectorAll('.part-item').forEach((item) => {
            const index = parseInt(item.getAttribute('data-index') || '0')
            const idInput = item.querySelector('.part-id-input') as HTMLInputElement
            const labelInput = item.querySelector('.part-label-input') as HTMLInputElement
            const contentInput = item.querySelector('.part-content') as HTMLTextAreaElement
            const deleteBtn = item.querySelector('.delete-part-btn')

            idInput?.addEventListener('input', (e) => {
                currentSong.parts[index].id = (e.target as HTMLInputElement).value
            })

            labelInput?.addEventListener('input', (e) => {
                currentSong.parts[index].label = (e.target as HTMLInputElement).value
            })

            contentInput?.addEventListener('input', (e) => {
                const text = (e.target as HTMLTextAreaElement).value
                currentSong.parts[index].slides = text.split(/\n\n+/).filter(s => s.trim().length > 0)
            })

            deleteBtn?.addEventListener('click', () => {
                if (confirm('Delete this part?')) {
                    currentSong.parts.splice(index, 1)
                    renderParts()
                }
            })
        })
    }

    const renderVariations = () => {
        const container = modal.querySelector('#variations-container')
        if (!container) return

        container.innerHTML = currentSong.variations.map((v, index) => `
         <div class="variation-item" data-index="${index}">
             <div class="variation-header">
                 <input type="text" class="variation-name" value="${v.name}" placeholder="Variation Name" />
                 <button class="icon-btn delete-variation-btn">&times;</button>
             </div>
             <div class="variation-sequence">
                 <input type="text" class="variation-parts" value="${v.arrangement.join(', ')}" placeholder="Arrangement (e.g. v1, v2, c)" />
                 <small>Comma separated part IDs</small>
             </div>
         </div>
       `).join('')

        container.querySelectorAll('.variation-item').forEach((item) => {
            const index = parseInt(item.getAttribute('data-index') || '0')
            const nameInput = item.querySelector('.variation-name') as HTMLInputElement
            const seqInput = item.querySelector('.variation-parts') as HTMLInputElement
            const deleteBtn = item.querySelector('.delete-variation-btn')

            nameInput?.addEventListener('input', (e) => {
                currentSong.variations[index].name = (e.target as HTMLInputElement).value
            })

            seqInput?.addEventListener('input', (e) => {
                const text = (e.target as HTMLInputElement).value
                currentSong.variations[index].arrangement = text.split(',').map(s => s.trim()).filter(s => s.length > 0)
            })

            deleteBtn?.addEventListener('click', () => {
                currentSong.variations.splice(index, 1)
                renderVariations()
            })
        })
    }

    // Initial Render
    renderParts()
    renderVariations()

    // -- Event Listeners --

    // Close
    const closeModal = () => {
        modal.remove()
    }
    modal.querySelector('.close-modal-btn')?.addEventListener('click', closeModal)
    modal.querySelector('.cancel-btn')?.addEventListener('click', closeModal)

    // Tabs
    modal.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
            btn.classList.add('active')
            const tabId = btn.getAttribute('data-tab')

            const partsTab = modal.querySelector('#tab-parts') as HTMLElement
            const varsTab = modal.querySelector('#tab-variations') as HTMLElement

            if (tabId === 'parts') {
                partsTab.style.display = 'block'
                varsTab.style.display = 'none'
            } else {
                partsTab.style.display = 'none'
                varsTab.style.display = 'block'
            }
        })
    })

    // Add Part
    modal.querySelector('.add-part-btn')?.addEventListener('click', () => {
        currentSong.parts.push({ id: `v${currentSong.parts.length + 1}`, label: `Verse ${currentSong.parts.length + 1}`, slides: [''] })
        renderParts()
    })

    // Add Variation
    modal.querySelector('.add-variation-btn')?.addEventListener('click', () => {
        currentSong.variations.push({ id: Date.now(), name: 'New Variation', arrangement: [] })
        renderVariations()
    })

    // Save
    modal.querySelector('.save-btn')?.addEventListener('click', async () => {
        const titleInput = modal.querySelector('#song-title') as HTMLInputElement
        const artistInput = modal.querySelector('#song-artist') as HTMLInputElement

        currentSong.title = titleInput.value
        currentSong.artist = artistInput.value

        const status = modal.querySelector('#status-msg') as HTMLElement
        status.textContent = 'Saving...'
        status.className = 'status-msg info'

        try {
            await saveSong(currentSong)
            status.textContent = 'Saved successfully!'
            status.className = 'status-msg success'

            // Refresh lists
            const songs = await fetchSongs()
            updateState({ songs })

            setTimeout(closeModal, 1000)
        } catch (e) {
            status.textContent = 'Error saving song.'
            status.className = 'status-msg error'
            console.error(e)
        }
    })

}
