import { state } from '../../state'
import { ICONS } from '../../constants/icons'
import { selectVideo } from '../../actions/controlPanel'
import { toggleClass } from '../../utils/dom'

export function renderBackgroundsSection(): string {
  return `
    <div class="video-section">
      <div class="cp-column-header">
        <div class="header-left">
          <span class="header-icon">${ICONS.video}</span>
          <span>BACKGROUNDS</span>
        </div>
      </div>
      <div class="video-grid">
        ${state.availableVideos.map(video => `
          <button class="video-thumb ${state.backgroundVideo === video.path ? 'selected' : ''}" data-video-path="${video.path}" title="${video.name}">
            <video data-src="${video.path}" muted preload="none" class="thumb-video"></video>
            <span class="video-name">${video.name.replace(/\.[^.]+$/, '')}</span>
          </button>
        `).join('')}
        ${state.availableVideos.length === 0 ? '<div class="empty-msg">No videos in folder</div>' : ''}
      </div>
    </div>
  `
}

export function initBackgroundsListeners(): void {
  // Video selection
  document.querySelectorAll('.video-thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      const path = btn.getAttribute('data-video-path') || ''
      selectVideo(path)
    })
  })

  // Lazy load videos using IntersectionObserver
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target as HTMLVideoElement
        if (video.dataset.src) {
          video.src = video.dataset.src
          // Seek to 1s for thumbnail after metadata loads
          video.addEventListener('loadedmetadata', () => {
            video.currentTime = 1
          }, { once: true })
          video.load()
          // Cleanup
          video.removeAttribute('data-src')
          observer.unobserve(video)
        }
      }
    })
  }, {
    root: document.querySelector('.cp-songs'), // Use the scrolling container as root if possible, or null for viewport
    rootMargin: '100px' // Preload slightly before appearing
  })

  document.querySelectorAll('.thumb-video').forEach(video => {
    observer.observe(video)
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
