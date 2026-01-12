import { state, updateState, getSavedCurrentSchedule, saveCurrentScheduleName } from '../../state'
import { ICONS } from '../../constants/icons'
import { selectSongForPreview } from '../../actions/controlPanel'
import { fetchSongById, saveSchedule, fetchScheduleList, fetchScheduleByName, createSchedule } from '../../services/api'
import { removeFromSchedule, updateScheduleItem, moveScheduleItem } from '../../actions/schedule'
import { openScheduleNameModal } from '../ScheduleNameModal'
// Track current schedule name - initialize from saved value
let currentScheduleName = getSavedCurrentSchedule()

export function renderScheduleList(): string {
  const schedule = state.schedule
  const songs = state.songs


  if (!schedule || schedule.items.length === 0) {
    return `
      <div class="cp-section schedule-section">
        <div class="cp-column-header schedule-header-redesign horizontal-layout">
            <div class="header-section-left">
                <span class="header-icon">${ICONS.calendar || '📅'}</span>
                <span class="header-title">SCHEDULE</span>
            </div>
            <div class="header-section-center">
                <button class="schedule-selector-btn" title="Select Schedule">
                  <span class="current-schedule-name">${currentScheduleName}</span>
                  ${ICONS.chevronDown}
                </button>
            </div>
            <!-- Right section removed as requested -->
        </div>
        <div class="cp-section-body empty-state">
            <span class="empty-msg">No songs scheduled</span>
        </div>
        <div class="schedule-dropdown" id="schedule-dropdown" style="display: none;"></div>
      </div>
    `
  }

  return `
    <div class="cp-section schedule-section">
      <div class="cp-column-header schedule-header-redesign horizontal-layout">
        <div class="header-section-left">
            <span class="header-icon">${ICONS.calendar || '📅'}</span>
            <span class="header-title">SCHEDULE</span>
        </div>
        <div class="header-section-center">
            <button class="schedule-selector-btn" title="Select Schedule">
               <span class="current-schedule-name">${currentScheduleName}</span>
               ${ICONS.chevronDown}
             </button>
        </div>
        <!-- Right section removed as requested -->
      </div>
      <div class="cp-section-body">
        <div class="song-list" id="schedule-song-list">
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
              <div class="song-item schedule-item compact ${isSelected ? 'selected' : ''} ${isLive ? 'live' : ''}" 
                      data-song-id="${song.id}" 
                      data-variation-id="${item.variationId}"
                      data-index="${index}"
                      draggable="true">
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
      <div class="schedule-dropdown" id="schedule-dropdown" style="display: none;"></div>
    </div>
  `
}

// Drag and drop state
let draggedIndex: number | null = null

export function initScheduleListListeners(): void {
  const section = document.querySelector('.schedule-section')
  if (!section) return

  // Schedule selector button
  const selectorBtn = section.querySelector('.schedule-selector-btn')
  if (selectorBtn) {
    selectorBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      await toggleScheduleDropdown()
    })
  }

  // Close dropdown when clicking outside (only add once)
  if (!(window as any).__scheduleDropdownListenerAdded) {
    (window as any).__scheduleDropdownListenerAdded = true
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('schedule-dropdown')
      if (dropdown && dropdown.style.display === 'block') {
        const selectorBtn = document.querySelector('.schedule-selector-btn')
        const popover = document.querySelector('.schedule-popover')
        if (!dropdown.contains(e.target as Node) &&
          !selectorBtn?.contains(e.target as Node) &&
          !popover?.contains(e.target as Node)) {
          dropdown.style.display = 'none'
        }
      }
    })
  }

  // Save Schedule button
  const saveBtn = section.querySelector('.save-schedule-btn')
  if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      try {
        await saveSchedule(state.schedule, currentScheduleName)
        // Visual feedback
        saveBtn.classList.add('saved')
        setTimeout(() => saveBtn.classList.remove('saved'), 1500)
      } catch (err) {
        console.error('Failed to save schedule:', err)
      }
    })
  }

  // New Schedule button
  const newScheduleBtn = section.querySelector('.new-schedule-btn')
  if (newScheduleBtn) {
    newScheduleBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      openScheduleNameModal(e.currentTarget as HTMLElement, async (name) => {
        const result = await createSchedule(name)
        if (result?.success) {
          await loadSchedule(result.name)
        } else {
          alert('Failed to create schedule. It may already exist.')
        }
      })
    })
  }

  // Initialize drag and drop
  initDragAndDrop(section)

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

      // Also update preview if this song is currently being previewed
      if (state.previewSong?.id === songId) {
        selectSongForPreview(state.previewSong, nextIdx)
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
}

function initDragAndDrop(section: Element): void {
  const songList = section.querySelector('#schedule-song-list')
  if (!songList) return

  const songItems = section.querySelectorAll('.song-item[draggable="true"]')

  songItems.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      const event = e as DragEvent
      draggedIndex = parseInt((item as HTMLElement).getAttribute('data-index') || '0')
        ; (item as HTMLElement).classList.add('dragging')
      event.dataTransfer?.setData('text/plain', String(draggedIndex))
      event.dataTransfer!.effectAllowed = 'move'
    })

    item.addEventListener('dragend', () => {
      (item as HTMLElement).classList.remove('dragging')
      draggedIndex = null
      // Remove all drag-over classes
      section.querySelectorAll('.song-item').forEach(el => {
        el.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom')
      })
    })

    item.addEventListener('dragover', (e) => {
      e.preventDefault()
      const event = e as DragEvent
      event.dataTransfer!.dropEffect = 'move'

      const rect = (item as HTMLElement).getBoundingClientRect()
      const midY = rect.top + rect.height / 2

      // Remove previous classes
      item.classList.remove('drag-over-top', 'drag-over-bottom')

      if (event.clientY < midY) {
        item.classList.add('drag-over-top')
      } else {
        item.classList.add('drag-over-bottom')
      }
    })

    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom')
    })

    item.addEventListener('drop', async (e) => {
      e.preventDefault()
      const event = e as DragEvent

      const fromIndex = draggedIndex
      if (fromIndex === null) return

      const toIndex = parseInt((item as HTMLElement).getAttribute('data-index') || '0')

      // Determine if dropping above or below
      const rect = (item as HTMLElement).getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      let finalToIndex = toIndex

      if (event.clientY < midY) {
        // Dropping above this item
        finalToIndex = toIndex
      } else {
        // Dropping below this item
        finalToIndex = toIndex + 1
      }

      // Adjust for moving down
      if (fromIndex < finalToIndex) {
        finalToIndex--
      }

      if (fromIndex !== finalToIndex) {
        await moveScheduleItem(fromIndex, finalToIndex)
      }

      // Cleanup
      item.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom')
    })
  })
}

async function toggleScheduleDropdown(): Promise<void> {
  const dropdown = document.getElementById('schedule-dropdown')
  if (!dropdown) {
    console.error('Schedule dropdown not found')
    return
  }

  // Check if already visible (block or empty means it could be visible)
  const isVisible = dropdown.style.display === 'block'
  if (isVisible) {
    dropdown.style.display = 'none'
    return
  }

  // Fetch schedule list
  const schedules = await fetchScheduleList()

  dropdown.innerHTML = `
    <div class="schedule-dropdown-content">
      <div class="schedule-dropdown-header">Select Schedule</div>
      <div class="schedule-dropdown-list">
        ${schedules.map(s => `
          <div class="schedule-dropdown-item ${s.name === currentScheduleName ? 'active' : ''}" data-name="${s.name}">
            <span class="schedule-name">${s.name}</span>
            <span class="schedule-item-count">${s.itemCount} songs</span>
          </div>
        `).join('')}
      </div>
      <div class="schedule-dropdown-footer">
        <button class="btn-new-schedule">${ICONS.plus} New Schedule</button>
      </div>
    </div>
  `

  dropdown.style.display = 'block'

  // Add click listeners
  dropdown.querySelectorAll('.schedule-dropdown-item').forEach(item => {
    item.addEventListener('click', async () => {
      const name = item.getAttribute('data-name')
      if (name) {
        await loadSchedule(name)
        dropdown.style.display = 'none'
      }
    })
  })

  // New schedule button
  dropdown.querySelector('.btn-new-schedule')?.addEventListener('click', async (e) => {
    const target = e.currentTarget as HTMLElement
    openScheduleNameModal(target, async (name) => {
      const result = await createSchedule(name)
      if (result?.success) {
        await loadSchedule(result.name)
        dropdown.style.display = 'none'
      } else {
        alert('Failed to create schedule. It may already exist.')
      }
    })
  })
}

async function loadSchedule(name: string): Promise<void> {
  const schedule = await fetchScheduleByName(name)
  if (schedule) {
    currentScheduleName = name
    saveCurrentScheduleName(name) // Persist to server and localStorage
    updateState({ schedule })
    // Update the displayed name
    const nameEl = document.querySelector('.current-schedule-name')
    if (nameEl) {
      nameEl.textContent = name
    }
  }
}

// Export for external use
export function getCurrentScheduleName(): string {
  return currentScheduleName
}

export function setCurrentScheduleName(name: string): void {
  currentScheduleName = name
  saveCurrentScheduleName(name)
}

// Initialize schedule on first load
export async function initializeSchedule(): Promise<void> {
  const savedName = getSavedCurrentSchedule()
  if (savedName && savedName !== 'current') {
    await loadSchedule(savedName)
  }
}
