import { state } from '../../state'
import { ICONS } from '../../constants/icons'
import { selectSongForPreview } from '../../actions/controlPanel'
import { fetchSongById } from '../../services/api'
import { openSongEditor } from '../SongEditorModal'
import { addToSchedule } from '../../actions/schedule'

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
         <input type="text" id="library-search" placeholder="Search..." class="search-input" />
         <div class="song-list" id="library-list-container">
            ${songs.map(song => `
              <div class="song-item compact ${state.previewSong?.id === song.id ? 'selected' : ''}" data-song-id="${song.id}">
                <span class="song-title">${song.title}</span>
                <div class="song-actions">
                    <button class="icon-btn-sm add-schedule-btn" data-id="${song.id}" title="Add to Schedule">${ICONS.plus}</button>
                    <button class="icon-btn-sm edit-song-btn" data-id="${song.id}" title="Edit Song">${ICONS.edit}</button>
                </div>
              </div>
            `).join('')}
         </div>
      </div>
    </div>
  `
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
        btn.addEventListener('click', (e) => {
            e.stopPropagation()
            const songId = parseInt(btn.getAttribute('data-id') || '0')
            addToSchedule(songId)
        })
    })

    // Search
    const searchInput = document.getElementById('library-search') as HTMLInputElement
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = (e.target as HTMLInputElement).value.toLowerCase()
            const items = section.querySelectorAll('.song-item')

            items.forEach((item: Element) => {
                const text = item.textContent?.toLowerCase() || ''
                if (text.includes(term)) {
                    (item as HTMLElement).style.display = 'flex'
                } else {
                    (item as HTMLElement).style.display = 'none'
                }
            })
        })
    }
}
