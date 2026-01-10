import { state } from '../../state'
import { ICONS } from '../../constants/icons'
import { selectSongForPreview } from '../../actions/controlPanel'
import { fetchSongById } from '../../services/api'
import { removeFromSchedule, updateScheduleItem } from '../../actions/schedule'

export function renderScheduleList(): string {
  const schedule = state.schedule
  const songs = state.songs

  if (!schedule || schedule.items.length === 0) {
    return `
      <div class="cp-section schedule-section">
        <div class="cp-section-header">
            <span class="header-icon">${ICONS.calendar || '📅'}</span>
            <span>Schedule</span>
        </div>
        <div class="cp-section-body empty-state">
            No songs scheduled
        </div>
      </div>
    `
  }

  return `
    <div class="cp-section schedule-section">
      <div class="cp-column-header">
        <span class="header-icon">${ICONS.calendar || '📅'}</span>
        <span>Schedule (${new Date(schedule.date).toLocaleDateString()})</span>
      </div>
      <div class="cp-section-body">
        <div class="song-list">
          ${schedule.items.map((item, index) => {
    const song = songs.find(s => s.id === item.songId)
    if (!song) return '' // Skip if song not found

    // Check if this song is currently selected/live
    // Note: We need to check if the *scheduled item* is selected.
    // But state only tracks `previewSong`. 
    // For now, highlight if IDs match.
    const isSelected = state.previewSong?.id === song.id
    const isLive = state.liveSong?.id === song.id

    // Variations dropdown
    let variationSelect = ''
    if (song.variations && song.variations.length > 0) {
      const options = song.variations.map(v =>
        `<option value="${v.id}" ${String(v.id) === String(item.variationId) ? 'selected' : ''}>${v.name}</option>`
      ).join('')
      variationSelect = `<select class="variation-select" data-index="${index}">${options}</select>`
    } else {
      variationSelect = '<span class="no-variations">Default</span>'
    }

    return `
              <div class="song-item ${isSelected ? 'selected' : ''} ${isLive ? 'live' : ''}" 
                      data-song-id="${song.id}" 
                      data-variation-id="${item.variationId}"
                      data-index="${index}">
                <div class="song-info">
                    <span class="song-title">${song.title}</span>
                    <span class="song-artist">${song.artist || ''}</span>
                </div>
                <div class="song-meta">
                   ${variationSelect}
                   <button class="icon-btn-sm remove-schedule-btn" data-index="${index}" title="Remove from schedule">${ICONS.trash}</button>
                </div>
              </div>
            `
  }).join('')}
        </div>
      </div>
    </div>
  `
}

export function initScheduleListListeners(): void {
  const section = document.querySelector('.schedule-section')
  if (!section) return

  section.querySelectorAll('.song-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      // Prevent if clicking interactive elements
      if ((e.target as HTMLElement).closest('.variation-select') ||
        (e.target as HTMLElement).closest('.remove-schedule-btn')) {
        return
      }

      const songId = parseInt(item.getAttribute('data-song-id') || '0')
      const variationId = item.getAttribute('data-variation-id')

      // We need to fetch the full song
      const song = await fetchSongById(songId)

      if (song) {
        // If variationId is provided, we should select that variation.
        // selectSongForPreview defaults to 0. 
        // We might need to look up the variation index.
        let varIndex = 0
        if (variationId) {
          const idx = song.variations.findIndex(v => String(v.id) === String(variationId))
          if (idx >= 0) varIndex = idx
        }

        selectSongForPreview(song, varIndex)
      }
    })
  })

  // Remove buttons
  section.querySelectorAll('.remove-schedule-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const index = parseInt(btn.getAttribute('data-index') || '0')
      removeFromSchedule(index)
    })
  })

  // Variation Selects
  section.querySelectorAll('.variation-select').forEach(select => {
    select.addEventListener('change', (e) => {
      e.stopPropagation()
      const index = parseInt(select.getAttribute('data-index') || '0')
      const value = (e.target as HTMLSelectElement).value
      updateScheduleItem(index, { variationId: value })
    })
  })
}
