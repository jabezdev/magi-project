import { state } from '../../state'
import { ICONS } from '../../constants/icons'
import type { Song, SongPart, PartType } from '../../types'
import { getNextPosition, getPrevPosition } from '../../utils/slides'
import {
  selectPreviewVariation,
  selectPreviewPosition,
  prevPreviewSlide,
  nextPreviewSlide,
  goLive
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

export function renderPreviewColumn(): string {
  const song = state.previewSong
  const arrangementParts = song ? getArrangementParts(song, state.previewVariation) : []

  return `
    <div class="cp-column cp-preview">
      <div class="cp-column-header">
        <span class="header-icon">${ICONS.monitor}</span>
        <span style="margin-right: 0.5rem">Preview</span>
        ${song ? `
          <select class="variation-select" id="preview-variation" style="max-width: 120px; padding: 2px;">
            ${song.variations.map((v, i) => `
              <option value="${i}" ${i === state.previewVariation ? 'selected' : ''}>${v.name}</option>
            `).join('')}
          </select>
        ` : ''}
        <button class="go-live-btn sm" id="go-live" style="margin-left: auto; font-size: 0.7rem; padding: 0.25rem 0.5rem;" ${!song ? 'disabled' : ''}>${ICONS.play} GO LIVE</button>
      </div>
      <div class="cp-column-body lyrics-scroll">
        ${song ? `
          <div class="song-info">
            <h2 class="song-name">${song.title}</h2>
            ${song.artist ? `<span class="song-artist">${song.artist}</span>` : ''}
          </div>
          <div class="lyrics-arrangement">
            ${arrangementParts.map(({ part, partIndex, partId }) => `
              <div class="lyrics-part" data-part-index="${partIndex}">
                <div class="part-header part-${partId}">${part.label}</div>
                <div class="part-slides">
                  ${part.slides.map((slideText, slideIndex) => {
    const isActive = state.previewPosition.partIndex === partIndex &&
      state.previewPosition.slideIndex === slideIndex
    const isLive = state.liveSong?.id === song.id &&
      state.livePosition.partIndex === partIndex &&
      state.livePosition.slideIndex === slideIndex
    return `
                      <button class="slide-btn ${isActive ? 'active' : ''} ${isLive ? 'live' : ''}" 
                              data-part="${partIndex}" 
                              data-slide="${slideIndex}"
                              data-context="preview">
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
            <span class="empty-icon">${ICONS.music}</span>
            <p>Select a song to preview</p>
          </div>
        `}
      </div>
    </div>
  `
}

export function initPreviewListeners(): void {
  // Go live button
  document.getElementById('go-live')?.addEventListener('click', goLive)

  // Preview navigation
  document.getElementById('prev-preview')?.addEventListener('click', prevPreviewSlide)
  document.getElementById('next-preview')?.addEventListener('click', nextPreviewSlide)

  // Variation select
  document.getElementById('preview-variation')?.addEventListener('change', (e) => {
    selectPreviewVariation(parseInt((e.target as HTMLSelectElement).value))
  })

  // Slide selection (handled globally for now in ControlPanel or we can delegate here if we pass context)
  // For now, we'll let ControlPanel handle the delegation or attach here if specific
  // The original implementation used a global selector. Let's attach specifically to preview buttons
  document.querySelectorAll('.cp-preview .slide-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const partIndex = parseInt(btn.getAttribute('data-part') || '0')
      const slideIndex = parseInt(btn.getAttribute('data-slide') || '0')
      selectPreviewPosition({ partIndex, slideIndex })
    })
  })
}

export function updatePreviewSlideSelection(): void {
  const previewButtons = document.querySelectorAll('.cp-preview .slide-btn')
  const { previewPosition, liveSong, previewSong, livePosition } = state

  previewButtons.forEach(btn => {
    const partIndex = parseInt(btn.getAttribute('data-part') || '0')
    const slideIndex = parseInt(btn.getAttribute('data-slide') || '0')

    const isActive = previewPosition.partIndex === partIndex &&
      previewPosition.slideIndex === slideIndex
    const isLive = liveSong?.id === previewSong?.id &&
      livePosition.partIndex === partIndex &&
      livePosition.slideIndex === slideIndex

    toggleClass(btn, 'active', isActive)
    toggleClass(btn, 'live', isLive)
  })
}

export function updatePreviewNavButtons(): void {
  const { previewSong, previewVariation, previewPosition } = state
  if (!previewSong) return

  const prevBtn = document.getElementById('prev-preview') as HTMLButtonElement
  const nextBtn = document.getElementById('next-preview') as HTMLButtonElement

  updateDisabled(prevBtn, !getPrevPosition(previewSong, previewVariation, previewPosition))
  updateDisabled(nextBtn, !getNextPosition(previewSong, previewVariation, previewPosition))
}
