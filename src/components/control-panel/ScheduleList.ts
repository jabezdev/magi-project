import { state } from '../../state'
import { ICONS } from '../../constants/icons'
import { selectSongForPreview } from '../../actions/controlPanel'
import { fetchSongById, saveSchedule } from '../../services/api'
import { removeFromSchedule, updateScheduleItem } from '../../actions/schedule'

export function renderScheduleList(): string {
  const schedule = state.schedule
  const songs = state.songs
  const itemCount = schedule?.items?.length || 0

  if (!schedule || schedule.items.length === 0) {
    return `
      <div class="cp-section schedule-section">
        <div class="cp-column-header">
            <div class="header-left">
                <span class="header-icon">${ICONS.calendar || '📅'}</span>
                <span>Schedule</span>
            </div>
            <button class="icon-btn-sm save-schedule-btn" title="Save Schedule">${ICONS.save}</button>
        </div>
        <div class="cp-section-body empty-state">
            <span class="empty-msg">No songs scheduled</span>
        </div>
      </div>
    `
  }

  return `
    <div class="cp-section schedule-section">
      <div class="cp-column-header">
        <div class="header-left">
            <span class="header-icon">${ICONS.calendar || '📅'}</span>
            <span>Schedule</span>
            <span class="song-count">${itemCount}</span>
        </div>
        <button class="icon-btn-sm save-schedule-btn" title="Save Schedule">${ICONS.save}</button>
      </div>
      <div class="cp-section-body">
        <div class="song-list">
          ${schedule.items.map((item, index) => {
    const song = songs.find(s => s.id === item.songId)
    if (!song) return '' // Skip if song not found

    const isSelected = state.previewSong?.id === song.id
    const isLive = state.liveSong?.id === song.id

    // Compact variation display
    let variationBadge = ''
    if (song.variations && song.variations.length > 0) {
      const selectedVar = song.variations.find(v => String(v.id) === String(item.variationId))
      variationBadge = `<span class="variation-badge" title="Click to change">${selectedVar?.name || 'Default'}</span>`
    }

    return `
              <div class="song-item compact ${isSelected ? 'selected' : ''} ${isLive ? 'live' : ''}" 
                      data-song-id="${song.id}" 
                      data-variation-id="${item.variationId}"
                      data-index="${index}">
                <span class="song-order">${index + 1}</span>
                <span class="song-title">${song.title}</span>
                <div class="song-meta">
                   ${variationBadge}
                   <button class="icon-btn-sm remove-schedule-btn" data-index="${index}" title="Remove">${ICONS.trash}</button>
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

  // Save Schedule button
  const saveBtn = section.querySelector('.save-schedule-btn')
  if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      try {
        await saveSchedule(state.schedule)
        // Visual feedback
        saveBtn.classList.add('saved')
        setTimeout(() => saveBtn.classList.remove('saved'), 1500)
      } catch (err) {
        console.error('Failed to save schedule:', err)
      }
    })
  }

  section.querySelectorAll('.song-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      // Prevent if clicking interactive elements
      if ((e.target as HTMLElement).closest('.variation-badge') ||
        (e.target as HTMLElement).closest('.remove-schedule-btn')) {
        return
      }

      const songId = parseInt(item.getAttribute('data-song-id') || '0')
      const variationId = item.getAttribute('data-variation-id')

      // We need to fetch the full song
      const song = await fetchSongById(songId)

      if (song) {
        // If variationId is provided, we should select that variation.
        let varIndex = 0
        if (variationId) {
          const idx = song.variations.findIndex(v => String(v.id) === String(variationId))
          if (idx >= 0) varIndex = idx
        }

        selectSongForPreview(song, varIndex)
      }
    })
  })

  // Variation badge click - cycle through variations
  section.querySelectorAll('.variation-badge').forEach(badge => {
    badge.addEventListener('click', async (e) => {
      e.stopPropagation()
      const songItem = (e.target as HTMLElement).closest('.song-item')
      if (!songItem) return

      const index = parseInt(songItem.getAttribute('data-index') || '0')
      const songId = parseInt(songItem.getAttribute('data-song-id') || '0')
      const currentVariationId = songItem.getAttribute('data-variation-id')

      const song = state.songs.find(s => s.id === songId)
      if (!song || !song.variations || song.variations.length <= 1) return

      // Find current variation index and cycle to next
      const currentIdx = song.variations.findIndex(v => String(v.id) === String(currentVariationId))
      const nextIdx = (currentIdx + 1) % song.variations.length
      const nextVariation = song.variations[nextIdx]

      updateScheduleItem(index, { variationId: nextVariation.id })
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
}
