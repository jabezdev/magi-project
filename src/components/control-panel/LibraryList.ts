import { state } from '../../state'
import { ICONS } from '../../constants/icons'
import { selectSongForPreview } from '../../actions/controlPanel'
import { fetchSongById } from '../../services/api'
import { openSongEditor } from '../SongEditorModal'
import { addToSchedule } from '../../actions/schedule'
import { fuzzySearch, highlightMatches } from '../../utils/fuzzySearch'
import type { SongSummary, Song } from '../../types'

// Store last search term for re-rendering
let lastSearchTerm = ''

export function renderLibraryList(): string {
    const songs = state.songs

    return `
    <div class="cp-section library-section">
      <div class="cp-column-header">
        <div class="header-left">
          <span class="header-icon">${ICONS.music || '🎵'}</span>
          <span>Library</span>
          <span class="song-count">${songs.length}</span>
        </div>
        <button class="icon-btn-sm new-song-btn" title="New Song">${ICONS.plus}</button>
      </div>
      <div class="cp-section-body">
         <input type="text" id="library-search" placeholder="Search songs..." class="search-input" value="${escapeAttr(lastSearchTerm)}" />
         <div class="song-list" id="library-list-container">
            ${renderSongItems(songs, lastSearchTerm)}
         </div>
      </div>
    </div>
  `
}

function renderSongItems(songs: SongSummary[], searchTerm: string): string {
    let displaySongs: Array<SongSummary & { _fuzzyScore?: number; _fuzzyMatches?: Array<[number, number]> }>

    if (searchTerm.trim()) {
        displaySongs = fuzzySearch(songs, searchTerm, s => s.title + ' ' + (s.artist || ''))
    } else {
        displaySongs = songs.map(s => ({ ...s, _fuzzyScore: 100, _fuzzyMatches: [] }))
    }

    if (displaySongs.length === 0 && searchTerm.trim()) {
        return `<div class="no-results">No songs match "${escapeHtml(searchTerm)}"</div>`
    }

    return displaySongs.map(song => {
        const titleHtml = song._fuzzyMatches?.length
            ? highlightMatches(song.title, song._fuzzyMatches)
            : escapeHtml(song.title)

        const artistHtml = song.artist
            ? `<span class="song-artist-inline">${escapeHtml(song.artist)}</span>`
            : ''

        return `
          <div class="song-item compact ${state.previewSong?.id === song.id ? 'selected' : ''}" data-song-id="${song.id}">
            <span class="song-title">${titleHtml}${artistHtml}</span>
            <div class="song-actions">
                <button class="icon-btn-sm add-schedule-btn" data-id="${song.id}" title="Add to Schedule">${ICONS.plus}</button>
                <button class="icon-btn-sm edit-song-btn" data-id="${song.id}" title="Edit Song">${ICONS.edit}</button>
            </div>
          </div>
        `
    }).join('')
}

function escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

function escapeAttr(text: string): string {
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function initLibraryListListeners(): void {
    const section = document.querySelector('.library-section')
    if (!section) return

    // New Song button
    section.querySelector('.new-song-btn')?.addEventListener('click', () => {
        openSongEditor()
    })

    // Song selection
    section.querySelectorAll('.song-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            // Check if action buttons were clicked
            if ((e.target as HTMLElement).closest('.edit-song-btn') ||
                (e.target as HTMLElement).closest('.add-schedule-btn')) {
                return
            }

            const songId = parseInt(item.getAttribute('data-song-id') || '0')
            const song = await fetchSongById(songId)
            if (song) {
                selectSongForPreview(song)
            }
        })
    })

    // Edit button listeners
    section.querySelectorAll('.edit-song-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation() // Don't select the song
            const songId = parseInt(btn.getAttribute('data-id') || '0')
            openSongEditor(songId)
        })
    })

    // Add to Schedule button
    section.querySelectorAll('.add-schedule-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation()
            const triggerBtn = e.target as HTMLElement
            const songId = parseInt(btn.getAttribute('data-id') || '0')

            // Fetch song to check variations
            const song = await fetchSongById(songId)
            if (!song) return

            if (song.variations && song.variations.length > 1) {
                // Show popover
                showVariationDataPopover(triggerBtn, song)
            } else {
                // Single variation (default) or legacy
                const variationId = (song.variations && song.variations[0]) ? song.variations[0].id : 'default'
                addToSchedule(songId, variationId)
            }
        })
    })

    // Fuzzy Search with debounce
    const searchInput = document.getElementById('library-search') as HTMLInputElement
    if (searchInput) {
        let debounceTimer: number | null = null

        searchInput.addEventListener('input', (e) => {
            const term = (e.target as HTMLInputElement).value

            // Debounce the search
            if (debounceTimer) {
                clearTimeout(debounceTimer)
            }

            debounceTimer = window.setTimeout(() => {
                lastSearchTerm = term
                updateLibraryResults(term)
            }, 150) // 150ms debounce
        })

        // Focus search input on key press
        searchInput.focus()
    }
}

function updateLibraryResults(searchTerm: string): void {
    const container = document.getElementById('library-list-container')
    if (!container) return

    container.innerHTML = renderSongItems(state.songs, searchTerm)

    // Re-attach listeners to new elements
    const section = document.querySelector('.library-section')
    if (!section) return

    section.querySelectorAll('.song-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            if ((e.target as HTMLElement).closest('.edit-song-btn') ||
                (e.target as HTMLElement).closest('.add-schedule-btn')) {
                return
            }

            const songId = parseInt(item.getAttribute('data-song-id') || '0')
            const song = await fetchSongById(songId)
            if (song) {
                selectSongForPreview(song)
            }
        })
    })

    section.querySelectorAll('.edit-song-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation()
            const songId = parseInt(btn.getAttribute('data-id') || '0')
            openSongEditor(songId)
        })
    })

    section.querySelectorAll('.add-schedule-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation()
            const triggerBtn = e.target as HTMLElement
            const songId = parseInt(btn.getAttribute('data-id') || '0')

            const song = await fetchSongById(songId)
            if (!song) return

            if (song.variations && song.variations.length > 1) {
                showVariationDataPopover(triggerBtn, song)
            } else {
                const variationId = (song.variations && song.variations[0]) ? song.variations[0].id : 'default'
                addToSchedule(songId, variationId)
            }
        })
    })
}

function showVariationDataPopover(trigger: HTMLElement, song: Song): void {
    // Remove existing popover if any
    document.querySelector('.variation-picker-overlay')?.remove()

    const overlay = document.createElement('div')
    overlay.className = 'variation-picker-overlay'

    // Close on background click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove()
    })

    const popover = document.createElement('div')
    popover.className = 'variation-picker-popover'

    // Header
    const header = document.createElement('div')
    header.className = 'variation-picker-header'
    header.textContent = 'Select Arrangement'
    popover.appendChild(header)

    // Options
    song.variations.forEach(variation => {
        const option = document.createElement('div')
        option.className = 'variation-option'
        option.textContent = variation.name
        option.addEventListener('click', () => {
            addToSchedule(song.id, variation.id)
            overlay.remove()
        })
        popover.appendChild(option)
    })

    overlay.appendChild(popover)
    document.body.appendChild(overlay)

    // Position the popover
    const rect = trigger.getBoundingClientRect()
    // Default to right of the button, flip if no space
    let left = rect.right + 10
    let top = rect.top

    // Basic bounds checking (simplified)
    if (left + 150 > window.innerWidth) {
        left = rect.left - 160
    }

    popover.style.left = `${left}px`
    popover.style.top = `${top}px`
}
