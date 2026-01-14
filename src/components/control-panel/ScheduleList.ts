import { state, updateState, saveCurrentScheduleName } from '../../state'
import { ICONS } from '../../constants'
import { selectItemForPreview, removeFromSchedule, updateScheduleItem, moveScheduleItem } from '../../actions'
import { saveSchedule, fetchScheduleList, fetchScheduleByName, createSchedule } from '../../services'
import { openScheduleNameModal, openScheduleItemSettings } from '../modals'
import type { SongItem, SlideItem } from '../../types'

// Track current schedule name - session only
let currentScheduleName = ''

export function renderScheduleList(): string {
  const schedule = state.schedule
  const songs = state.songs

  // Inline Tailwind Class Constants
  const sectionClass = "flex flex-col flex-1 overflow-hidden min-w-0 bg-bg-primary schedule-section"
  const headerClass = "flex flex-row items-center justify-between gap-0 p-0 h-[2.2rem] min-h-[2.2rem] bg-bg-secondary border-b border-border-color shrink-0 text-[0.85rem]"
  const headerSectionLeft = "flex items-center h-full px-2 gap-2"
  const headerIconClass = "w-[14px] h-[14px] opacity-70"
  const headerTitleClass = "text-xs font-semibold uppercase tracking-[0.5px] text-text-secondary"

  const headerCenterClass = "flex-1 flex items-center justify-center h-full min-w-0 p-0"
  const selectorBtnClass = "border-l border-border-color rounded-none h-full w-full px-4 bg-transparent flex justify-between items-center gap-2 text-text-primary border-l-width-[1px] hover:bg-bg-hover cursor-pointer"
  const selectorTextClass = "font-medium text-[0.85rem] whitespace-nowrap overflow-hidden text-ellipsis"
  const selectorIconClass = "w-[14px] h-[14px] opacity-70"

  const bodyClass = "flex-1 overflow-y-auto overflow-x-hidden p-2 cp-section-body"
  const emptyStateClass = "flex flex-1 items-center justify-center h-full text-text-muted text-sm italic opacity-70"
  const songListClass = "flex flex-col gap-[1px]"

  // Item Styles
  const itemClass = "flex flex-row items-center justify-between gap-2 px-[0.6rem] py-[0.4rem] bg-bg-tertiary border border-transparent rounded-sm cursor-grab transition-colors duration-100 text-left w-full p-[0.35rem_0.5rem] gap-[0.4rem] active:cursor-grabbing hover:bg-bg-hover group schedule-item"
  const selectedClass = "border-accent-primary bg-indigo-500/10"
  const liveClass = "border-live-red bg-red-600/10"

  const titleClass = "text-xs font-medium text-text-primary whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0"
  const metaClass = "flex items-center gap-[0.2rem] shrink-0 relative transition-transform duration-150 ease-out group-hover:-translate-x-6"

  const variationBadgeClass = "text-[0.65rem] text-text-secondary bg-bg-primary px-[0.4rem] py-[0.15rem] rounded-sm cursor-pointer transition-all duration-150 border border-border-color hover:bg-bg-hover hover:text-accent-primary hover:border-accent-primary"
  const typeIconClass = "text-[0.65rem] opacity-50 mr-1"

  const removeBtnClass = "opacity-0 transition-opacity duration-150 flex items-center justify-center w-[22px] h-[22px] bg-transparent border-none rounded-[3px] text-text-muted cursor-pointer hover:text-live-red hover:bg-red-600/10 group-hover:opacity-100"
  const settingsBtnClass = "opacity-0 transition-opacity duration-150 flex items-center justify-center w-[22px] h-[22px] bg-transparent border-none rounded-[3px] text-text-muted cursor-pointer hover:text-accent-primary hover:bg-indigo-500/10 group-hover:opacity-100"


  if (!schedule || schedule.items.length === 0) {
    return `
      <div class="${sectionClass}">
        <div class="${headerClass}">
            <div class="${headerSectionLeft}">
                <span class="${headerIconClass}">${ICONS.calendar}</span>
                <span class="${headerTitleClass}">SCHEDULE</span>
            </div>
            <div class="${headerCenterClass}">
                <button class="${selectorBtnClass} schedule-selector-btn" title="Select Schedule">
                  <span class="${selectorTextClass} current-schedule-name">${currentScheduleName || 'Select Schedule'}</span>
                  <span class="${selectorIconClass}">${ICONS.chevronDown}</span>
                </button>
            </div>
        </div>
        <div class="${bodyClass}">
            <div class="${emptyStateClass}">No items scheduled</div>
        </div>
      </div>
    `
  }

  return `
    <div class="${sectionClass}">
      <div class="${headerClass}">
        <div class="${headerSectionLeft}">
            <span class="${headerIconClass}">${ICONS.calendar}</span>
            <span class="${headerTitleClass}">SCHEDULE</span>
        </div>
        <div class="${headerCenterClass}">
            <button class="${selectorBtnClass} schedule-selector-btn" title="Select Schedule">
               <span class="${selectorTextClass} current-schedule-name">${currentScheduleName || 'Select Schedule'}</span>
               <span class="${selectorIconClass}">${ICONS.chevronDown}</span>
             </button>
        </div>
      </div>
      <div class="${bodyClass}">
        <div class="${songListClass}" id="schedule-song-list">
          ${schedule.items.map((item, index) => {
    // Determine Title, Icon, and Extras based on Type
    let title = item.title || 'Unknown Item'
    // let subtitle = item.subtitle || '' // Unused
    let icon: string = ICONS.file
    let extras = ''

    // Check for Thumbnail
    if (item.type === 'video' || item.type === 'image') {
      if (item.thumbnail && !item.thumbnail.endsWith('.svg')) { // Avoid SVG icons being treated as images if passed in data
        icon = `<img src="${item.thumbnail}" class="w-full h-full object-cover rounded-[2px]"/>`
      }
    }

    const isSelected = state.previewItem?.id === item.id || (state.previewItem?.type === 'song' && item.type === 'song' && ((item.songId && state.previewItem.songId === item.songId) || (item.id && state.previewItem.id === item.id)))
    const isLive = state.liveItem?.id === item.id || (state.liveItem?.type === 'song' && item.type === 'song' && ((item.songId && state.liveItem.songId === item.songId) || (item.id && state.liveItem.id === item.id)))


    // ICONS mapping (Fallback)
    if (icon === ICONS.file) {
      const icons: Record<string, string> = {
        song: ICONS.music,
        video: ICONS.video,
        image: ICONS.image,
        slide: ICONS.slides,
        scripture: ICONS.book,
        audio: ICONS.sound
      }
      icon = icons[item.type] || ICONS.file
    }

    if (item.type === 'video' && item.isYouTube) icon = ICONS.youtube
    if (item.type === 'video' && item.settings?.isCanvaSlide) {
      extras += '<span class="text-[0.6rem] opacity-50 ml-1">SLIDE</span>'
    }

    // Duration for video/audio
    if ((item.type === 'video' || item.type === 'audio') && item.duration) {
      const mins = Math.floor(item.duration / 60)
      const secs = Math.floor(item.duration % 60)
      extras += `<span class="text-[0.6rem] text-text-muted opacity-70 ml-2 border border-border-color px-1 rounded">${mins}:${secs.toString().padStart(2, '0')}</span>`
    }

    if (item.type === 'song') {
      const songItem = item as SongItem
      // Logic for variations - use songs list since we have SongItem with songId
      let vName = 'Default'
      let arrangement: string[] = []

      const song = songs.find(s => s.id === songItem.songId)
      if (song) {
        const v = song.variations?.find(v => String(v.id) === String(songItem.variationId)) || song.variations?.[0]
        if (v) {
          vName = v.name
          arrangement = v.arrangement || []
        }
      }

      // Render Arrangement Pills if available
      if (arrangement.length > 0) {
        const preview = arrangement.slice(0, 6).map(p => {
          const map: Record<string, string> = { 'Verse 1': 'V1', 'Verse 2': 'V2', 'Chorus': 'C', 'Bridge': 'B' }
          let label = map[p] || p.substring(0, 2).toUpperCase()
          if (p.startsWith('Verse ')) label = 'V' + p.replace('Verse ', '')
          if (p === 'Chorus') label = 'C'
          if (p === 'Bridge') label = 'B'
          return `<span class="px-[3px] text-[0.6rem] bg-bg-primary rounded text-text-secondary border border-border-color leading-tight">${label}</span>`
        }).join('')
        extras = `<div class="flex items-center gap-[2px] ml-2 opacity-90 variation-badge cursor-pointer" title="Variation: ${vName}">${preview}${arrangement.length > 6 ? '<span class="text-[0.6rem] text-text-muted">...</span>' : ''}</div>`
      } else {
        // Fallback to simple badge
        extras = `<span class="${variationBadgeClass} variation-badge" title="Click to change">${vName}</span>`
      }
    }

    // Slide count badge
    if (item.type === 'slide') {
      const slideItem = item as SlideItem
      extras += `<span class="text-[0.6rem] text-text-muted opacity-70 ml-2 border border-border-color px-1 rounded">${slideItem.slides?.length || 0} slides</span>`
    }

    // Construct final classes
    const finalItemClass = `${itemClass} ${isSelected ? selectedClass : ''} ${isLive ? liveClass : ''}`

    return `
              <div class="song-item compact ${finalItemClass}" 
                      data-index="${index}"
                      draggable="true">
                <span class="${typeIconClass} ${item.type === 'video' || item.type === 'image' ? 'w-6 h-4' : ''}">${icon}</span>
                <span class="${titleClass}">${title}</span>
                <div class="song-meta ${metaClass}">
                   ${extras}
                   ${extras}
                   <div class="flex items-center gap-1 absolute right-0 bg-gradient-to-l from-bg-tertiary via-bg-tertiary to-transparent pl-4">
                        <button class="icon-btn-sm settings-schedule-btn ${settingsBtnClass}" data-index="${index}" title="Settings">${ICONS.settings || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>'}</button>
                        <button class="icon-btn-sm remove-schedule-btn ${removeBtnClass}" data-index="${index}" title="Remove">${ICONS.trash}</button>
                   </div>
                </div>
              </div>
            `
  }).join('')}
        </div>
      </div>
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
      if (dropdown) {
        const selectorBtn = document.querySelector('.schedule-selector-btn')
        if (!dropdown.contains(e.target as Node) &&
          !selectorBtn?.contains(e.target as Node) &&
          !(e.target as HTMLElement).closest('.schedule-popover')) {
          dropdown.remove()
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
        saveBtn.classList.add('text-success')
        setTimeout(() => saveBtn.classList.remove('text-success'), 1500)
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

  // Auto-scroll on item add
  window.addEventListener('schedule-item-added', () => {
    const body = section.querySelector('.cp-section-body')
    if (body) {
      setTimeout(() => {
        body.scrollTop = body.scrollHeight
      }, 50)
    }
  })

  section.querySelectorAll('.song-item').forEach(el => {
    el.addEventListener('click', async (e) => {
      // Prevent if clicking interactive elements
      if ((e.target as HTMLElement).closest('.variation-badge') ||
        (e.target as HTMLElement).closest('.remove-schedule-btn') ||
        (e.target as HTMLElement).closest('.settings-schedule-btn')) {
        return
      }

      const index = parseInt(el.getAttribute('data-index') || '0')
      const item = state.schedule.items[index]

      if (item) {
        selectItemForPreview(item)
      }
    })
  })

  // Variation badge click - cycle through variations
  section.querySelectorAll('.variation-badge').forEach(badge => {
    badge.addEventListener('click', async (e) => {
      e.stopPropagation()
      const songItemEl = (e.target as HTMLElement).closest('.song-item')
      if (!songItemEl) return

      const index = parseInt(songItemEl.getAttribute('data-index') || '0')
      const item = state.schedule.items[index]

      if (item && item.type === 'song') {
        const song = state.songs.find(s => s.id === item.songId)
        if (!song || !song.variations || song.variations.length <= 1) return

        const currentIdx = song.variations.findIndex(v => String(v.id) === String(item.variationId))
        const nextIdx = (currentIdx + 1) % song.variations.length
        const nextVariation = song.variations[nextIdx]

        updateScheduleItem(index, { variationId: nextVariation.id })

        // Also update preview if this song is currently being previewed
        if (state.previewItem?.id === item.id) {
          selectItemForPreview({ ...item, variationId: nextVariation.id })
        }
      }
    })
  })

  // Settings buttons
  section.querySelectorAll('.settings-schedule-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const index = parseInt(btn.getAttribute('data-index') || '0')
      const item = state.schedule.items[index]
      if (item) {
        openScheduleItemSettings(item, (newSettings) => {
          updateScheduleItem(index, { settings: newSettings })
        })
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
        ; (item as HTMLElement).classList.add('opacity-50', 'bg-bg-hover') // 'dragging'
      event.dataTransfer?.setData('text/plain', String(draggedIndex))
      event.dataTransfer!.effectAllowed = 'move'
    })

    item.addEventListener('dragend', () => {
      (item as HTMLElement).classList.remove('opacity-50', 'bg-bg-hover')
      draggedIndex = null
      // Remove all drag-over classes
      section.querySelectorAll('.song-item').forEach(el => {
        el.classList.remove('border-t-2', 'border-t-accent-primary', '-mt-[1px]', 'border-b-2', 'border-b-accent-primary', '-mb-[1px]') // remove drag-over styles
      })
    })

    item.addEventListener('dragover', (e) => {
      e.preventDefault()
      const event = e as DragEvent
      event.dataTransfer!.dropEffect = 'move'

      const rect = (item as HTMLElement).getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      const isTop = event.clientY < midY

      // Reset styles first
      item.classList.remove('border-t-2', 'border-t-accent-primary', '-mt-[1px]', 'border-b-2', 'border-b-accent-primary', '-mb-[1px]')

      // Add Drop Indicator Line
      // We'll use a pseudo-element logic or just helper classes if possible. 
      // Given existing CSS limitations, border is the easiest but let's make it cleaner.
      // Use standard border logic but ensure it's visible.

      if (isTop) {
        item.classList.add('border-t-2', 'border-t-accent-primary', '-mt-[1px]')
      } else {
        item.classList.add('border-b-2', 'border-b-accent-primary', '-mb-[1px]')
      }
    })

    item.addEventListener('dragleave', () => {
      item.classList.remove('border-t-2', 'border-t-accent-primary', '-mt-[1px]', 'border-b-2', 'border-b-accent-primary', '-mb-[1px]')
    })

    item.addEventListener('drop', async (e) => {
      e.preventDefault()
      const event = e as DragEvent

      // Cleanup visual indicators immediately
      section.querySelectorAll('.song-item').forEach(el => {
        el.classList.remove('border-t-2', 'border-t-accent-primary', '-mt-[1px]', 'border-b-2', 'border-b-accent-primary', '-mb-[1px]')
      })

      const fromIndex = draggedIndex
      if (fromIndex === null) return

      const toIndex = parseInt((item as HTMLElement).getAttribute('data-index') || '0')

      // Determine if dropping above or below
      const rect = (item as HTMLElement).getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      let finalToIndex = toIndex

      if (event.clientY < midY) {
        // Dropping above
        finalToIndex = toIndex
      } else {
        // Dropping below
        finalToIndex = toIndex + 1
      }

      // Adjust logic: if we move an item from index 2 to index 4 (below 3), 
      // the array shifts. 
      // Rule: If moving DOWN, we insert AFTER target, so index increases.
      // But if we insert at 4, the old item at 2 is removed, so everything shifts up.
      // The `moveScheduleItem` action usually handles (from, to) where 'to' is the index BEFORE ensuring shift.
      // Let's rely on standard array splice logic:
      // remove from 'from', then insert at 'to'.
      // If 'to' > 'from', we must decrease 'to' by 1 because removal happened before insertion point.

      if (fromIndex < finalToIndex) {
        finalToIndex--
      }

      if (fromIndex !== finalToIndex) {
        // Optimistic UI updates are handled by state refresh, but we can do a quick check
        await moveScheduleItem(fromIndex, finalToIndex)
      }
    })
  })
}

async function toggleScheduleDropdown(): Promise<void> {
  // Ensure only one dropdown exists
  const existingDropdown = document.getElementById('schedule-dropdown')
  if (existingDropdown) {
    existingDropdown.remove()
    return
  }

  const dropdown = document.createElement('div')
  dropdown.id = 'schedule-dropdown'


  // Fetch schedule list
  const schedules = await fetchScheduleList()

  // Tailwind classes for Dropdown
  const dropdownContentClass = "w-[220px] bg-bg-secondary border border-border-color rounded-md shadow-[0_10px_40px_-5px_rgba(0,0,0,0.5)] overflow-hidden"
  const dropdownHeaderClass = "px-3 py-2 bg-bg-tertiary border-b border-border-color text-xs font-semibold text-text-muted uppercase tracking-wide"
  const dropdownListClass = "max-h-[300px] overflow-y-auto"
  const dropdownItemClass = "flex items-center justify-between px-3 py-2 cursor-pointer transition-colors duration-150 border-b border-border-color/50 text-sm hover:bg-bg-hover hover:text-accent-primary"
  const dropdownItemActiveClass = "bg-accent-primary border-transparent text-white hover:bg-accent-primary hover:text-white"
  const dropdownFooterClass = "p-2 bg-bg-tertiary border-t border-border-color"
  const newBtnClass = "w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-transparent border border-border-color rounded text-xs font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-hover hover:text-text-primary hover:border-text-muted"

  // Position relative to button
  const rect = document.querySelector('.schedule-selector-btn')?.getBoundingClientRect()
  const top = rect ? rect.bottom + 4 : 100
  const left = rect ? rect.left + (rect.width / 2) - 110 : 100 // Center 220px width

  dropdown.style.cssText = `position: fixed; z-index: 9999; display: block; top: ${top}px; left: ${left}px;`

  dropdown.innerHTML = `
    <div class="${dropdownContentClass}">
      <div class="${dropdownHeaderClass}">Select Schedule</div>
      <div class="${dropdownListClass}">
          ${schedules.map(s => `
          <div class="schedule-dropdown-item ${dropdownItemClass} ${s.name === currentScheduleName ? dropdownItemActiveClass : ''}" data-name="${s.name}">
            <span class="font-medium truncate mr-2">${s.name}</span>
            <span class="text-[0.65rem] opacity-70 whitespace-nowrap">${s.itemCount} songs</span>
          </div>
        `).join('')
    }
  </div>
    <div class="${dropdownFooterClass}">
      <button class="${newBtnClass} btn-new-schedule icon-btn-sm inline-flex">${ICONS.plus} New Schedule</button>
    </div>
  </div>
</div>
          `

  // Move to body to avoid clipping
  document.body.appendChild(dropdown)

  // Add click listeners
  dropdown.querySelectorAll('.schedule-dropdown-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      e.stopPropagation()
      const name = item.getAttribute('data-name')
      if (name) {
        await loadSchedule(name)
        dropdown.remove()
      }
    })
  })

  // New schedule button
  dropdown.querySelector('.btn-new-schedule')?.addEventListener('click', async (e) => {
    e.stopPropagation()
    const target = e.currentTarget as HTMLElement
    openScheduleNameModal(target, async (name) => {
      const result = await createSchedule(name)
      if (result?.success) {
        await loadSchedule(result.name)
        dropdown.remove()
        return true
      } else {
        // Return false to indicate failure (duplicate) so modal can show error
        return false
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

// Initialize schedule on first load (Legacy - initialization now handled in main.ts)
export async function initializeSchedule(): Promise<void> {
  // Fresh start every session
}
