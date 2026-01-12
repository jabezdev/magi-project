import { state } from '../../state'
import { ICONS } from '../../constants/icons'
import type { Song, SongPart, PartType, DisplayMode } from '../../types'
import { getNextPosition, getPrevPosition } from '../../utils/slides'
import {
  goLiveWithPosition,
  prevSlide,
  nextSlide,
  setDisplayMode
} from '../../actions/controlPanel'
import { toggleClass, updateDisabled } from '../../utils/dom'

function getArrangementParts(song: Song, variationIndex: number): Array<{ part: SongPart; partIndex: number; partId: PartType }> {
  const variation = song.variations[variationIndex]
  if (!variation) return []

  return variation.arrangement.map((partId, partIndex) => {
    const part = song.parts.find(p => p.id === partId)
    return { part: part!, partIndex, partId }
  }).filter(item => item.part)
}

export function renderLiveColumn(): string {
  const song = state.liveSong
  const arrangementParts = song ? getArrangementParts(song, state.liveVariation) : []

  return `
    <div class="cp-column cp-live">
      <div class="cp-column-header live-header-redesign horizontal-layout">
        <div class="header-section-left">
            <div class="live-badge">
                <span class="live-icon">${ICONS.live || '🔴'}</span>
                <span class="live-indicator-text">LIVE</span>
            </div>
        </div>
        
        <div class="header-section-center">
            ${song ? `
                <span class="live-song-title">${song.title}</span>
                <span class="live-arrangement-name">${song.variations[state.liveVariation]?.name || 'Default'}</span>
            ` : ''}
        </div>

        <div class="header-section-right">
             <div class="display-controls big-buttons">
                <button class="display-btn square ${state.displayMode === 'logo' ? 'active' : ''}" data-mode="logo" title="Logo">
                    ${ICONS.logo}
                    <span>LOGO</span>
                </button>
                <button class="display-btn square ${state.displayMode === 'black' ? 'active' : ''}" data-mode="black" title="Black">
                    ${ICONS.black}
                    <span>BLACK</span>
                </button>
                <button class="display-btn square ${state.displayMode === 'clear' ? 'active' : ''}" data-mode="clear" title="Clear">
                    ${ICONS.clear}
                    <span>CLEAR</span>
                </button>
                <button class="display-btn square ${state.displayMode === 'lyrics' ? 'active' : ''}" data-mode="lyrics" title="Show Lyrics">
                    ${ICONS.play}
                    <span>LYRICS</span>
                </button>
             </div>
        </div>
      </div>
      <div class="cp-column-body lyrics-scroll">
        ${song ? `
          <div class="lyrics-arrangement">
            ${arrangementParts.map(({ part, partIndex, partId }) => `
              <div class="lyrics-part" data-part-index="${partIndex}">
                <div class="part-header part-${partId}">${part.label}</div>
                <div class="part-slides">
                  ${part.slides.map((slideText, slideIndex) => {
    const isActive = state.livePosition.partIndex === partIndex &&
      state.livePosition.slideIndex === slideIndex
    return `
                      <button class="slide-btn ${isActive ? 'active live' : ''}" 
                              data-part="${partIndex}" 
                              data-slide="${slideIndex}"
                              data-context="live">
                        <span class="slide-num">${slideIndex + 1}</span>
                        <span class="slide-text">${slideText.replace(/\n/g, '<br>')}</span>
                      </button>
                    `
  }).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <span class="empty-icon">${ICONS.live}</span>
            <p>Nothing live yet</p>
          </div>
        `}
      </div>
    </div>
  `
}

export function initLiveListeners(): void {
  // Live navigation
  document.getElementById('prev-live')?.addEventListener('click', prevSlide)
  document.getElementById('next-live')?.addEventListener('click', nextSlide)

  // Display mode buttons
  document.querySelectorAll('.display-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode') as DisplayMode
      // Toggle back to lyrics if clicking the active mode (for Logo/Black/Clear)
      if (state.displayMode === mode && ['logo', 'black', 'clear'].includes(mode)) {
        setDisplayMode('lyrics')
      } else {
        setDisplayMode(mode)
      }
    })
  })

  // Slide selection
  document.querySelectorAll('.cp-live .slide-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const partIndex = parseInt(btn.getAttribute('data-part') || '0')
      const slideIndex = parseInt(btn.getAttribute('data-slide') || '0')
      goLiveWithPosition({ partIndex, slideIndex })
    })
  })
}

export function updateLiveSlideSelection(scrollToActive = false): void {
  const liveButtons = document.querySelectorAll('.cp-live .slide-btn')
  const { livePosition } = state
  let activeBtn: Element | null = null

  liveButtons.forEach(btn => {
    const partIndex = parseInt(btn.getAttribute('data-part') || '0')
    const slideIndex = parseInt(btn.getAttribute('data-slide') || '0')

    const isActive = livePosition.partIndex === partIndex &&
      livePosition.slideIndex === slideIndex

    toggleClass(btn, 'active', isActive)
    toggleClass(btn, 'live', isActive)

    if (isActive) {
      activeBtn = btn
    }
  })

  // Scroll active slide into view only on Go Live (song change)
  if (scrollToActive && activeBtn) {
    requestAnimationFrame(() => {
      (activeBtn as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    })
  }
}

export function updateLiveNavButtons(): void {
  const { liveSong, liveVariation, livePosition } = state
  if (!liveSong) return

  const prevBtn = document.getElementById('prev-live') as HTMLButtonElement
  const nextBtn = document.getElementById('next-live') as HTMLButtonElement

  updateDisabled(prevBtn, !getPrevPosition(liveSong, liveVariation, livePosition))
  updateDisabled(nextBtn, !getNextPosition(liveSong, liveVariation, livePosition))
}

export function updateDisplayModeButtons(): void {
  const { displayMode } = state
  const buttons = document.querySelectorAll('.display-btn')

  buttons.forEach(btn => {
    const mode = btn.getAttribute('data-mode')
    toggleClass(btn, 'active', mode === displayMode)
  })
}
