import { state } from '../../state'
import { ICONS } from '../../constants/icons'
import { selectSongForPreview } from '../../actions/controlPanel'
import { fetchSongById } from '../../services/api'
import { openSongEditor } from '../SongEditorModal'
import { addToSchedule } from '../../actions/schedule'
import { fuzzySearch, fuzzyMatch, highlightMatches } from '../../utils/fuzzySearch'
import type { SongSummary, Song } from '../../types'

// Store last search term for re-rendering
let lastSearchTerm = ''

export function renderLibraryList(): string {
    const songs = state.songs

    return `
    <div class="cp-section library-section">
      <div class="cp-column-header horizontal-layout compact-header">
        <div class="header-section-left">
          <span class="header-icon">${ICONS.music || '🎵'}</span>
          <span>Library</span>
          <span class="song-count">${songs.length}</span>
        </div>
        <div class="header-section-center"></div>
        <div class="header-section-right">
          <button class="icon-btn-sm new-song-btn flush-btn" title="New Song">${ICONS.plus}</button>
        </div>
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

    // Explicit trim
    const term = searchTerm.trim()

    if (term) {
        // Search against potential matches in title, artist, and lyrics/content
        displaySongs = fuzzySearch(songs, term, s => `${s.title} ${s.artist || ''} ${s.searchContent || ''}`)
    } else {
        displaySongs = songs.map(s => ({ ...s, _fuzzyScore: 100, _fuzzyMatches: [] }))
    }

    if (displaySongs.length === 0 && term) {
        return `<div class="no-results">No songs match "${escapeHtml(term)}"</div>`
    }

    return displaySongs.map(song => {
        let titleHtml = escapeHtml(song.title)
        let artistHtml = song.artist ? `<span class="song-artist-inline">${escapeHtml(song.artist)}</span>` : ''
        let snippetHtml = ''

        if (term) {
            // Priority 1: Check Title Match
            const { matches: titleMatches, score: titleScore } = fuzzyMatch(term, song.title)
            if (titleScore > 0 && titleMatches.length > 0) {
                titleHtml = highlightMatches(song.title, titleMatches)
            }

            // Priority 2: Check Artist Match
            if (song.artist) {
                const { matches: artistMatches, score: artistScore } = fuzzyMatch(term, song.artist)
                if (artistScore > 0 && artistMatches.length > 0) {
                    artistHtml = `<span class="song-artist-inline">${highlightMatches(song.artist, artistMatches)}</span>`
                }
            }

            // Priority 3: If match is NOT obvious in title or artist, check Content
            const titleMatchIsStrong = titleScore >= 500 // 500 contains/perfect match base

            if (!titleMatchIsStrong && song.searchContent) {
                const { matches: contentMatches, score: contentScore } = fuzzyMatch(term, song.searchContent)

                if (contentScore > 0 && contentMatches.length > 0) {
                    // Find the window around the first match
                    const matchStart = contentMatches[0][0]
                    const matchEnd = contentMatches[0][1]

                    const windowSize = 30
                    const start = Math.max(0, matchStart - windowSize)
                    const end = Math.min(song.searchContent.length, matchEnd + windowSize)

                    let text = song.searchContent.slice(start, end)
                    const prefix = start > 0 ? '...' : ''
                    const suffix = end < song.searchContent.length ? '...' : ''

                    // We need to adjust matches relative to our slice
                    const relativeMatches = contentMatches
                        .map(([s, e]) => [s - start, e - start] as [number, number])
                        .filter(([s, e]) => s >= 0 && e < text.length)

                    const highlightedText = highlightMatches(text, relativeMatches)
                    snippetHtml = `<div class="search-snippet">${prefix}${highlightHighlightedText(highlightedText)}${suffix}</div>`
                }
            }
        }

        return `
          <div class="song-item compact ${state.previewSong?.id === song.id ? 'selected' : ''}" data-song-id="${song.id}">
            <div class="song-info-col">
                 <span class="song-title">${titleHtml}${artistHtml}</span>
                 ${snippetHtml}
            </div>
            <div class="song-actions">
                <button class="icon-btn-sm add-schedule-btn" data-id="${song.id}" title="Add to Schedule">${ICONS.plus}</button>
                <button class="icon-btn-sm edit-song-btn" data-id="${song.id}" title="Edit Song">${ICONS.edit}</button>
            </div>
          </div>
        `
    }).join('')
}

function highlightHighlightedText(html: string): string {
    return html
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
