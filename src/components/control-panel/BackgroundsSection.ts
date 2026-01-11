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
        ${state.availableVideos.map(video => {
    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(video.thumbnail || '')
    // If optimized thumbnail exists, use it. Otherwise use video as source (will be lazy loaded)
    const thumbSrc = video.thumbnail || video.path

    return `
          <button class="video-thumb ${state.backgroundVideo === video.path ? 'selected' : ''}" data-video-path="${video.path}" title="${video.name}">
            ${isImage
        ? `<img data-src="${thumbSrc}" class="thumb-media thumb-image" alt="thumbnail" loading="lazy" />`
        : `<video data-src="${thumbSrc}" muted preload="none" class="thumb-media thumb-video"></video>`
      }
            <span class="video-name">${video.name.replace(/\.[^.]+$/, '')}</span>
          </button>
        `}).join('')}
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

  // Lazy load videos/images using IntersectionObserver
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const media = entry.target as HTMLElement

        if (media.tagName === 'IMG') {
          const img = media as HTMLImageElement
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.removeAttribute('data-src')
            observer.unobserve(img)
          }
        } else if (media.tagName === 'VIDEO') {
          const video = media as HTMLVideoElement
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
      }
    })
  }, {
    root: document.querySelector('.cp-songs'), // Use the scrolling container as root if possible, or null for viewport
    rootMargin: '100px' // Preload slightly before appearing
  })

  document.querySelectorAll('.thumb-media').forEach(media => {
    observer.observe(media)
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
