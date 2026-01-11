import { state, saveLayoutSettings } from '../../state'
import { ICONS } from '../../constants/icons'
import { selectLiveVideo, selectPreviewVideo } from '../../actions/controlPanel'
import { toggleClass } from '../../utils/dom'

export function renderBackgroundsSection(): string {
  return `
    <div class="video-section">
      <div class="cp-column-header">
        <div class="header-left">
          <span class="header-icon">${ICONS.video}</span>
          <span>BACKGROUNDS</span>
        </div>
        <div class="header-right" style="display: flex; gap: 4px;">
          <button class="icon-btn" id="zoom-out-btn" title="Zoom Out" style="width: 24px; height: 24px; padding: 0;">${ICONS.minus || '-'}</button>
          <button class="icon-btn" id="zoom-in-btn" title="Zoom In" style="width: 24px; height: 24px; padding: 0;">${ICONS.plus || '+'}</button>
        </div>
      </div>
      <div class="video-grid" style="--video-thumb-size: ${state.layoutSettings.thumbnailSize || 80}px;">
        ${state.availableVideos.map(video => {
    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(video.thumbnail || '')
    // If optimized thumbnail exists, use it. Otherwise use video as source (will be lazy loaded)
    const thumbSrc = video.thumbnail || video.path

    const isPreview = state.previewBackground === video.path
    const isLive = state.backgroundVideo === video.path

    let classes = 'video-thumb'
    if (isPreview) classes += ' preview-active'
    if (isLive) classes += ' live-active'

    return `
          <button class="${classes}" data-video-path="${video.path}" title="${video.name}">
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
    // Single click -> Preview (Blue)
    btn.addEventListener('click', () => {
      // Prevent double firing if double clicked? 
      // Actually usually fine. DblClick fires click twice then dblclick.
      // We'll let it select preview then immediately select live on double click.
      const path = btn.getAttribute('data-video-path') || ''
      selectPreviewVideo(path)
    })

    // Double click -> Live (Red)
    btn.addEventListener('dblclick', () => {
      const path = btn.getAttribute('data-video-path') || ''
      selectLiveVideo(path)
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
    root: document.querySelector('.backgrounds-row'), // Use the correct scrolling container
    rootMargin: '100px' // Preload slightly before appearing
  })

  document.querySelectorAll('.thumb-media').forEach(media => {
    observer.observe(media)
  })

  // Zoom Listeners
  const zoomIn = document.getElementById('zoom-in-btn')
  const zoomOut = document.getElementById('zoom-out-btn')
  const videoGrid = document.querySelector('.video-grid') as HTMLElement

  if (zoomIn && zoomOut && videoGrid) {
    zoomIn.addEventListener('click', () => {
      let current = state.layoutSettings.thumbnailSize || 80
      if (current < 200) {
        current += 10
        videoGrid.style.setProperty('--video-thumb-size', `${current}px`)
        saveLayoutSettings({ ...state.layoutSettings, thumbnailSize: current })
      }
    })

    zoomOut.addEventListener('click', () => {
      let current = state.layoutSettings.thumbnailSize || 80
      if (current > 40) {
        current -= 10
        videoGrid.style.setProperty('--video-thumb-size', `${current}px`)
        saveLayoutSettings({ ...state.layoutSettings, thumbnailSize: current })
      }
    })
  }
}

export function updateVideoSelection(): void {
  const { backgroundVideo, previewBackground } = state
  const thumbs = document.querySelectorAll('.video-thumb')

  thumbs.forEach(thumb => {
    const path = thumb.getAttribute('data-video-path')

    // Update Live Status
    toggleClass(thumb, 'live-active', path === backgroundVideo)

    // Update Preview Status
    toggleClass(thumb, 'preview-active', path === previewBackground)
  })
}
