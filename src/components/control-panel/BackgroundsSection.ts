import { state } from '../../state'
import { ICONS } from '../../constants/icons'
import { selectVideo } from '../../actions/controlPanel'
import { toggleClass } from '../../utils/dom'

export function renderBackgroundsSection(): string {
    return `
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
  `
}

export function initBackgroundsListeners(): void {
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
}

export function updateVideoSelection(): void {
    const { backgroundVideo } = state
    const thumbs = document.querySelectorAll('.video-thumb')

    thumbs.forEach(thumb => {
        const path = thumb.getAttribute('data-video-path')
        toggleClass(thumb, 'selected', path === backgroundVideo)
    })
}
