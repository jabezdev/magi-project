import { state } from '../../state'
import { ICONS } from '../../constants/icons'
import type { SongSet } from '../../types'
import { renderBackgroundsSection, initBackgroundsListeners, updateVideoSelection } from './BackgroundsSection'
import { findSongById, selectSongForPreview } from '../../actions/controlPanel'
import { openSettings } from '../settings'
import { renderControlPanel } from '../../screens/ControlPanel'

export function renderSongListColumn(sets: SongSet[]): string {
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
        
        ${renderBackgroundsSection()}
      </div>
      <div class="cp-column-footer">
        <button class="icon-btn settings-footer-btn" id="settings-btn" title="Settings">${ICONS.settings}</button>
      </div>
    </div>
  `
}

export function initSongListListeners(): void {
    // Settings button
    document.getElementById('settings-btn')?.addEventListener('click', () => {
        openSettings(() => renderControlPanel())
    })

    // Song selection
    document.querySelectorAll('.song-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const songId = parseInt(btn.getAttribute('data-song-id') || '0')
            const song = findSongById(songId)
            if (song) selectSongForPreview(song)
        })
    })

    // Init backgrounds listeners
    initBackgroundsListeners()
}

export { updateVideoSelection }
