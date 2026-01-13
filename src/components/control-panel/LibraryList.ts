import { state } from '../../state'
import { ICONS } from '../../constants'
import { selectSongForPreview, addToSchedule } from '../../actions'
import { fetchSongById } from '../../services'
import { openSongEditor } from '../modals'
import { fuzzySearch, fuzzyMatch, highlightMatches } from '../../utils'
import type { SongSummary, Song } from '../../types'

// Store last search term for re-rendering
let lastSearchTerm = ''

export function renderLibraryList(): string {
    const songs = state.songs

    // Styles
    const sectionClass = "flex flex-col flex-1 overflow-hidden min-w-0 bg-bg-primary library-section" // Added library-section for JS hooks
    const headerClass = "flex flex-row items-center justify-between gap-0 p-0 h-[2.2rem] min-h-[2.2rem] bg-bg-secondary border-b border-border-color shrink-0 text-[0.85rem]" // compact-header
    const headerLeftClass = "flex items-center h-full px-2 gap-2"
    const headerIconClass = "w-[14px] h-[14px] opacity-70"
    const flushBtnClass = "h-full w-[2.2rem] border-l border-border-color rounded-none m-0 p-0 bg-transparent flex items-center justify-center text-text-secondary transition-colors duration-200 hover:bg-bg-hover hover:text-text-primary"
    const bodyClass = "flex-1 overflow-y-auto p-2"
    const searchInputClass = "w-full mb-2 p-[0.35rem] px-[0.5rem] bg-bg-tertiary border border-border-color rounded-sm text-text-primary text-[0.85rem] outline-none focus:border-accent-primary focus:bg-bg-primary transition-all duration-150"
    const listContainerClass = "flex flex-col gap-[1px]"

    return `
    <div class="${sectionClass}">
      <div class="${headerClass}">
        <div class="${headerLeftClass}">
          <span class="${headerIconClass}">${ICONS.music || '🎵'}</span>
          <span class="font-semibold uppercase tracking-[0.5px] text-text-secondary">Library</span>
          <span class="text-[0.7rem] text-text-muted whitespace-nowrap">${songs.length}</span>
        </div>
        <div class="flex-1 flex items-center justify-center h-full min-w-0 p-0"></div>
        <div class="p-0 gap-0 flex items-center h-full">
          <button class="${flushBtnClass} new-song-btn flush-btn" title="New Song" style="border-left-width: 1px !important;">${ICONS.plus}</button>
        </div>
      </div>
      <div class="${bodyClass}">
         <input type="text" id="library-search" placeholder="Search songs..." class="${searchInputClass}" value="${escapeAttr(lastSearchTerm)}" />
         <div class="${listContainerClass}" id="library-list-container">
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
        return `<div class="text-xs text-text-muted text-center py-4 italic">No songs match "${escapeHtml(term)}"</div>`
    }

    // Item Styles
    const itemClass = "flex flex-row items-center justify-between px-[0.6rem] py-[0.4rem] bg-bg-tertiary border border-transparent rounded-sm cursor-pointer transition-colors duration-100 text-left w-full p-[0.35rem_0.5rem] gap-[0.4rem] hover:bg-bg-hover group" // song-item compact
    const selectedClass = "border-accent-primary bg-indigo-500/10" // song-item.selected
    const infoColClass = "flex flex-col justify-center flex-1 min-w-0 overflow-hidden"
    const titleClass = "text-xs font-medium text-text-primary whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0"
    const actionsClass = "flex items-center gap-[0.2rem] shrink-0"
    const iconBtnClass = "flex items-center justify-center w-[22px] h-[22px] bg-transparent border-none rounded-[3px] text-text-muted cursor-pointer transition-all duration-150 opacity-0 p-[2px] group-hover:opacity-100 hover:bg-bg-hover hover:text-text-primary"

    return displaySongs.map(song => {
        let titleHtml = escapeHtml(song.title)
        // song-artist-inline
        let artistHtml = song.artist ? `<span class="text-[0.7rem] text-text-muted ml-[0.35rem] font-normal">${escapeHtml(song.artist)}</span>` : ''
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
                    artistHtml = `<span class="text-[0.7rem] text-text-muted ml-[0.35rem] font-normal">${highlightMatches(song.artist, artistMatches)}</span>`
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
                    // search-snippet
                    snippetHtml = `<div class="text-[0.7rem] text-text-muted italic mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap opacity-80">${prefix}${highlightHighlightedText(highlightedText)}${suffix}</div>`
                }
            }
        }

        const isSelected = state.previewSong?.id === song.id
        const finalItemClass = `${itemClass} ${isSelected ? selectedClass : ''}`

        return `
          <div class="${finalItemClass} song-item" data-song-id="${song.id}">
            <div class="${infoColClass}">
                 <span class="${titleClass}">${titleHtml}${artistHtml}</span>
                 ${snippetHtml}
            </div>
            <div class="${actionsClass}">
                <button class="${iconBtnClass} add-schedule-btn icon-btn hover:text-accent-primary hover:bg-indigo-500/10" data-id="${song.id}" title="Add to Schedule">${ICONS.plus}</button>
                <button class="${iconBtnClass} edit-song-btn icon-btn" data-id="${song.id}" title="Edit Song">${ICONS.edit}</button>
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
    const section = document.querySelector('.library-section') // Targeting purely by class might be safer if I wrap it in a unique ID or retain the class name. Kept class name "library-section" in render.
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
    }
}

function updateLibraryResults(searchTerm: string): void {
    const container = document.getElementById('library-list-container')
    if (!container) return

    container.innerHTML = renderSongItems(state.songs, searchTerm)

    // Re-attach listeners to new elements
    // We need to re-find the section to be safe, or just use document/container scope
    const matches = document.querySelectorAll('.library-section') // Could be multiple?
    // Assuming one library section
    const section = matches[0]
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
    // variation-picker-overlay
    overlay.className = 'fixed inset-0 w-screen h-screen z-[2000] variation-picker-overlay'

    // Close on background click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove()
    })

    const popover = document.createElement('div')
    // variation-picker-popover
    popover.className = 'absolute bg-bg-secondary border border-border-color rounded-sm shadow-md min-w-[150px] z-[2001] overflow-hidden max-h-[250px] overflow-y-auto animate-[popover-fade_0.1s_ease-out]'

    // Header
    const header = document.createElement('div')
    // variation-picker-header
    header.className = 'px-[0.6rem] py-[0.4rem] bg-bg-tertiary border-b border-border-color text-[0.7rem] font-semibold text-text-muted'
    header.textContent = 'Select Arrangement'
    popover.appendChild(header)

    // Options
    song.variations.forEach(variation => {
        const option = document.createElement('div')
        // variation-option
        option.className = 'px-[0.6rem] py-[0.4rem] text-xs text-text-primary cursor-pointer transition-colors duration-100 hover:bg-bg-hover hover:text-accent-primary'
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
