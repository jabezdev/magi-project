/**
 * Control Panel Screen
 * 
 * Renders the main control interface for managing the projection.
 * Uses efficient DOM updates for slide selection changes.
 */

import type { SongSet, DisplayMode, Song, SongPart, PartType } from '../types'
import { state, subscribeToState, StateChangeKey } from '../state'
import { ICONS } from '../constants/icons'
import { 
  getNextPosition, 
  getPrevPosition
} from '../utils/slides'
import { openSettings } from '../components/SettingsModal'
import {
  selectSongForPreview,
  selectPreviewPosition,
  selectPreviewVariation,
  goLive,
  goLiveWithPosition,
  selectVideo,
  setDisplayMode,
  prevSlide,
  nextSlide,
  prevPreviewSlide,
  nextPreviewSlide,
  findSongById
} from '../actions/controlPanel'
import { initKeyboardHandlers, setupKeyboardListener, removeKeyboardListener } from '../utils/keyboard'
import { toggleClass, updateDisabled } from '../utils/dom'

// Track initialization state
let isInitialized = false
let unsubscribe: (() => void) | null = null

/**
 * Cleanup control panel resources
 */
function cleanup(): void {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
  removeKeyboardListener()
  isInitialized = false
}

/**
 * Initialize keyboard handlers for control panel
 */
function initKeyboard(): void {
  initKeyboardHandlers({
    nextSlide,
    prevSlide,
    goLive,
    setDisplayMode
  })
  setupKeyboardListener()
}

/**
 * Setup efficient updates that don't require full re-render
 */
function setupEfficientUpdates(): void {
  unsubscribe = subscribeToState((changedKeys: StateChangeKey[]) => {
    if (!isInitialized) return
    
    // Handle preview changes efficiently
    if (changedKeys.includes('previewPosition')) {
      updatePreviewSlideSelection()
      updatePreviewNavButtons()
    }
    
    // Handle live changes efficiently
    if (changedKeys.includes('livePosition')) {
      updateLiveSlideSelection()
      updateLiveNavButtons()
    }
    
    // Handle display mode changes
    if (changedKeys.includes('displayMode')) {
      updateDisplayModeButtons()
    }
    
    // Handle video selection change
    if (changedKeys.includes('backgroundVideo')) {
      updateVideoSelection()
    }
  })
}

/**
 * Update only the slide selection classes in preview column
 */
function updatePreviewSlideSelection(): void {
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

/**
 * Update only the slide selection classes in live column
 */
function updateLiveSlideSelection(): void {
  const liveButtons = document.querySelectorAll('.cp-live .slide-btn')
  const { livePosition } = state
  
  liveButtons.forEach(btn => {
    const partIndex = parseInt(btn.getAttribute('data-part') || '0')
    const slideIndex = parseInt(btn.getAttribute('data-slide') || '0')
    
    const isActive = livePosition.partIndex === partIndex && 
                     livePosition.slideIndex === slideIndex
    
    toggleClass(btn, 'active', isActive)
    toggleClass(btn, 'live', isActive)
  })
}

/**
 * Update preview navigation button states
 */
function updatePreviewNavButtons(): void {
  const { previewSong, previewVariation, previewPosition } = state
  if (!previewSong) return
  
  const prevBtn = document.getElementById('prev-preview') as HTMLButtonElement
  const nextBtn = document.getElementById('next-preview') as HTMLButtonElement
  
  updateDisabled(prevBtn, !getPrevPosition(previewSong, previewVariation, previewPosition))
  updateDisabled(nextBtn, !getNextPosition(previewSong, previewVariation, previewPosition))
}

/**
 * Update live navigation button states
 */
function updateLiveNavButtons(): void {
  const { liveSong, liveVariation, livePosition } = state
  if (!liveSong) return
  
  const prevBtn = document.getElementById('prev-live') as HTMLButtonElement
  const nextBtn = document.getElementById('next-live') as HTMLButtonElement
  
  updateDisabled(prevBtn, !getPrevPosition(liveSong, liveVariation, livePosition))
  updateDisabled(nextBtn, !getNextPosition(liveSong, liveVariation, livePosition))
}

/**
 * Update display mode button states
 */
function updateDisplayModeButtons(): void {
  const { displayMode } = state
  const buttons = document.querySelectorAll('.display-btn')
  
  buttons.forEach(btn => {
    const mode = btn.getAttribute('data-mode')
    toggleClass(btn, 'active', mode === displayMode)
  })
}

/**
 * Update video selection state
 */
function updateVideoSelection(): void {
  const { backgroundVideo } = state
  const thumbs = document.querySelectorAll('.video-thumb')
  
  thumbs.forEach(thumb => {
    const path = thumb.getAttribute('data-video-path')
    toggleClass(thumb, 'selected', path === backgroundVideo)
  })
}

/**
 * Get the arrangement of parts for a song variation as an array of parts with their slides
 */
function getArrangementParts(song: Song, variationIndex: number): Array<{ part: SongPart; partIndex: number; partId: PartType }> {
  const variation = song.variations[variationIndex]
  if (!variation) return []
  
  return variation.arrangement.map((partId, partIndex) => {
    const part = song.parts.find(p => p.id === partId)
    return { part: part!, partIndex, partId }
  }).filter(item => item.part)
}

/**
 * Render the control panel UI
 */
export function renderControlPanel(): void {
  // Cleanup previous instance
  cleanup()
  
  document.body.setAttribute('data-theme', state.theme)
  
  const app = document.getElementById('app')
  if (!app) return

  const sets = state.lyricsData?.sets || []
  
  app.innerHTML = buildControlPanelHTML(sets)

  attachControlPanelListeners()
  initKeyboard()
  setupEfficientUpdates()
  isInitialized = true
}

/**
 * Build the control panel HTML structure
 */
function buildControlPanelHTML(sets: SongSet[]): string {
  return `
    <div class="control-panel no-navbar">
      <div class="cp-main">
        ${buildSongListColumn(sets)}
        ${buildPreviewColumn()}
        ${buildLiveColumn()}
      </div>
    </div>
  `
}

/**
 * Build the song list column HTML
 */
function buildSongListColumn(sets: SongSet[]): string {
  return `
    <div class="cp-column cp-songs">
      <div class="cp-column-header">
        <span class="header-icon">${ICONS.music}</span>
        <span>Songs</span>
      </div>
      <div class="cp-column-body">
        <div class="song-sets">
          ${sets.map((set: SongSet) => `
            <div class="song-set">
              <div class="set-header">${set.name || set.title}</div>
              <div class="set-songs">
                ${set.songs.map(song => `
                  <button class="song-item ${state.previewSong?.id === song.id ? 'selected' : ''} ${state.liveSong?.id === song.id ? 'live' : ''}" data-song-id="${song.id}">
                    <span class="song-title">${song.title}</span>
                    ${song.artist ? `<span class="song-artist">${song.artist}</span>` : ''}
                  </button>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- VIDEO BROWSER -->
        <div class="video-section">
          <div class="cp-column-header">
            <span class="header-icon">${ICONS.video}</span>
            <span>Backgrounds</span>
          </div>
          <div class="video-grid">
            ${state.availableVideos.map(video => `
              <button class="video-thumb ${state.backgroundVideo === video.path ? 'selected' : ''}" data-video-path="${video.path}" title="${video.name}">
                <video src="${video.path}" muted preload="metadata" class="thumb-video"></video>
                <span class="video-name">${video.name.replace(/\.[^.]+$/, '')}</span>
              </button>
            `).join('')}
            ${state.availableVideos.length === 0 ? '<div class="empty-msg">No videos in folder</div>' : ''}
          </div>
        </div>
      </div>
      <div class="cp-column-footer">
        <button class="icon-btn settings-footer-btn" id="settings-btn" title="Settings">${ICONS.settings}</button>
      </div>
    </div>
  `
}

/**
 * Build the preview column HTML - shows full lyrics organized by parts
 */
function buildPreviewColumn(): string {
  const song = state.previewSong
  const arrangementParts = song ? getArrangementParts(song, state.previewVariation) : []
  
  return `
    <div class="cp-column cp-preview">
      <div class="cp-column-header">
        <span class="header-icon">${ICONS.monitor}</span>
        <span>Preview</span>
        ${song ? `
          <select class="variation-select" id="preview-variation">
            ${song.variations.map((v, i) => `
              <option value="${i}" ${i === state.previewVariation ? 'selected' : ''}>${v.name}</option>
            `).join('')}
          </select>
        ` : ''}
      </div>
      <div class="cp-column-body lyrics-scroll">
        ${song ? `
          <div class="song-info">
            <h2 class="song-name">${song.title}</h2>
            ${song.artist ? `<span class="song-artist">${song.artist}</span>` : ''}
          </div>
          <div class="lyrics-arrangement">
            ${arrangementParts.map(({ part, partIndex }) => `
              <div class="lyrics-part" data-part-index="${partIndex}">
                <div class="part-header">${part.label}</div>
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
                        <span class="slide-text">${slideText.replace(/\n/g, ' / ')}</span>
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

/**
 * Build the live column HTML - shows what's currently live with display controls
 */
function buildLiveColumn(): string {
  const song = state.liveSong
  const previewSong = state.previewSong
  const arrangementParts = song ? getArrangementParts(song, state.liveVariation) : []
  
  return `
    <div class="cp-column cp-live">
      <div class="cp-column-header live-header">
        <button class="go-live-btn header-go-live" id="go-live" ${!previewSong ? 'disabled' : ''}>${ICONS.play} GO LIVE</button>
        <div class="display-controls">
          <button class="display-btn ${state.displayMode === 'lyrics' ? 'active' : ''}" data-mode="lyrics" title="Show Lyrics">${ICONS.play}</button>
          <button class="display-btn ${state.displayMode === 'logo' ? 'active' : ''}" data-mode="logo" title="Logo">${ICONS.logo}</button>
          <button class="display-btn ${state.displayMode === 'black' ? 'active' : ''}" data-mode="black" title="Black">${ICONS.black}</button>
          <button class="display-btn ${state.displayMode === 'clear' ? 'active' : ''}" data-mode="clear" title="Clear">${ICONS.clear}</button>
        </div>
      </div>
      <div class="cp-column-body lyrics-scroll">
        ${song ? `
          <div class="song-info live-song-info">
            <span class="live-dot"></span>
            <h2 class="song-name">${song.title}</h2>
          </div>
          <div class="lyrics-arrangement">
            ${arrangementParts.map(({ part, partIndex }) => `
              <div class="lyrics-part" data-part-index="${partIndex}">
                <div class="part-header">${part.label}</div>
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
                        <span class="slide-text">${slideText.replace(/\n/g, ' / ')}</span>
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

/**
 * Attach event listeners to the control panel
 */
function attachControlPanelListeners(): void {
  // Settings button
  document.getElementById('settings-btn')?.addEventListener('click', () => {
    openSettings(() => renderControlPanel())
  })
  
  // Go live button
  document.getElementById('go-live')?.addEventListener('click', goLive)
  
  // Preview navigation
  document.getElementById('prev-preview')?.addEventListener('click', prevPreviewSlide)
  document.getElementById('next-preview')?.addEventListener('click', nextPreviewSlide)
  
  // Live navigation
  document.getElementById('prev-live')?.addEventListener('click', prevSlide)
  document.getElementById('next-live')?.addEventListener('click', nextSlide)

  // Variation select
  document.getElementById('preview-variation')?.addEventListener('change', (e) => {
    selectPreviewVariation(parseInt((e.target as HTMLSelectElement).value))
  })

  // Song selection
  document.querySelectorAll('.song-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const songId = parseInt(btn.getAttribute('data-song-id') || '0')
      const song = findSongById(songId)
      if (song) selectSongForPreview(song)
    })
  })

  // Video selection - load thumbnail on hover
  document.querySelectorAll('.video-thumb').forEach(btn => {
    const video = btn.querySelector('.thumb-video') as HTMLVideoElement
    if (video) {
      // Seek to 1 second for thumbnail
      video.currentTime = 1
    }
    
    btn.addEventListener('click', () => {
      const path = btn.getAttribute('data-video-path') || ''
      selectVideo(path)
    })
  })

  // Slide selection
  document.querySelectorAll('.slide-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const partIndex = parseInt(btn.getAttribute('data-part') || '0')
      const slideIndex = parseInt(btn.getAttribute('data-slide') || '0')
      const context = btn.getAttribute('data-context')
      const position = { partIndex, slideIndex }
      
      if (context === 'preview') {
        selectPreviewPosition(position)
      } else if (context === 'live') {
        goLiveWithPosition(position)
      }
    })
  })

  // Display mode buttons
  document.querySelectorAll('.display-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode') as DisplayMode
      setDisplayMode(mode)
    })
  })
}
