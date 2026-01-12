import { state, saveLayoutSettings, subscribeToState, updateState } from '../../state'
import { ICONS } from '../../constants/icons'
import { selectLiveVideo, selectPreviewVideo } from '../../actions/controlPanel'
import { toggleClass } from '../../utils/dom'

function renderVideoGridItems(): string {
  const items = state.availableVideos.map(video => {
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
        `}).join('')

  if (state.availableVideos.length === 0) {
    return '<div class="empty-msg">No videos in folder</div>'
  }

  return items
}

export function renderBackgroundsSection(): string {
  return `
    <div class="video-section">
      <div class="cp-column-header">
        <div class="header-left">
          <span class="header-icon">${ICONS.video}</span>
          <span>BACKGROUNDS</span>
        </div>
        <div class="header-right" style="display: flex; gap: 4px;">
          <button class="icon-btn" id="refresh-videos-btn" title="Refresh Videos" style="width: 24px; height: 24px; padding: 0;">${ICONS.refresh}</button>
          <!-- Zoom controls -->
          <button class="icon-btn" id="zoom-out-btn" title="Zoom Out" style="width: 24px; height: 24px; padding: 0;">${ICONS.minus || '-'}</button>
          <button class="icon-btn" id="zoom-in-btn" title="Zoom In" style="width: 24px; height: 24px; padding: 0;">${ICONS.plus || '+'}</button>
        </div>
      </div>
      <div class="video-grid" id="video-grid">
        ${renderVideoGridItems()}
      </div>
    </div>
  `
}

function initVideoListeners() {
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
}

// Keep track of observer to disconnect/reconnect
let observer: IntersectionObserver | null = null

function initObserver() {
  if (observer) {
    observer.disconnect()
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const media = entry.target as HTMLElement

        if (media.tagName === 'IMG') {
          const img = media as HTMLImageElement
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.removeAttribute('data-src')
            observer?.unobserve(img)
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
            observer?.unobserve(video)
          }
        }
      }
    })
  }, {
    root: document.querySelector('#video-grid'), // Use the correct scrolling container
    rootMargin: '100px' // Preload slightly before appearing
  })

  document.querySelectorAll('.thumb-media').forEach(media => {
    observer?.observe(media)
  })
}

function updateBackgroundsGrid() {
  const grid = document.getElementById('video-grid')
  if (!grid) return

  grid.innerHTML = renderVideoGridItems()
  initVideoListeners()
  initObserver()
}

export function initBackgroundsListeners(): void {
  initVideoListeners()
  initObserver()

  // Subscribe to state changes
  subscribeToState((changes) => {
    if (changes.includes('availableVideos')) {
      updateBackgroundsGrid()
    }
  })

  // Refresh Button Listener
  const refreshBtn = document.getElementById('refresh-videos-btn') as HTMLButtonElement
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      // Visual feedback
      refreshBtn.style.opacity = '0.5'
      refreshBtn.disabled = true

      try {
        const res = await fetch('/api/videos/refresh', { method: 'POST' })
        if (res.ok) {
          const videos = await res.json()
          updateState({ availableVideos: videos })
        }
      } catch (e) {
        console.error('Failed to refresh videos', e)
      } finally {
        setTimeout(() => {
          if (refreshBtn) {
            refreshBtn.style.opacity = '1'
            refreshBtn.disabled = false
          }
        }, 500) // Small delay for visual feedback
      }
    })
  }

  // Zoom Listeners
  const zoomIn = document.getElementById('zoom-in-btn')
  const zoomOut = document.getElementById('zoom-out-btn')
  const videoGrid = document.querySelector('.video-grid') as HTMLElement

  if (zoomIn && zoomOut && videoGrid) {
    // Initial calculation
    if (!state.layoutSettings.thumbnailSize) {
      // Set default if missing
      saveLayoutSettings({ ...state.layoutSettings, thumbnailSize: 120 })
    }
    updateGridColumns(videoGrid)

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      updateGridColumns(videoGrid)
    })
    resizeObserver.observe(videoGrid)

    zoomIn.addEventListener('click', () => {
      // Zoom In -> Fewer columns -> Bigger thumbnails
      let currentCols = parseInt(getComputedStyle(videoGrid).getPropertyValue('--col-count')) || 3
      const width = getGridWidth(videoGrid)

      let newCols = currentCols - 1
      if (newCols < 1) newCols = 1

      if (newCols === currentCols && currentCols === 1) {
        // Hardening single column
        const currentTarget = state.layoutSettings.thumbnailSize || 120
        saveLayoutSettings({ ...state.layoutSettings, thumbnailSize: currentTarget + 50 })
        updateGridColumns(videoGrid)
      } else {
        // Calculate new target size using the consistent width
        const newTarget = width / newCols
        saveLayoutSettings({ ...state.layoutSettings, thumbnailSize: newTarget })
        updateGridColumns(videoGrid)
      }
    })

    zoomOut.addEventListener('click', () => {
      // Zoom Out -> More columns -> Smaller thumbnails
      let currentCols = parseInt(getComputedStyle(videoGrid).getPropertyValue('--col-count')) || 3
      const width = getGridWidth(videoGrid)
      const newCols = currentCols + 1

      // Relaxed limit check
      if (width / newCols > 20) {
        const newTarget = width / newCols
        saveLayoutSettings({ ...state.layoutSettings, thumbnailSize: newTarget })
        updateGridColumns(videoGrid)
      }
    })
  }
}

function getGridWidth(grid: HTMLElement): number {
  // Padding is 1rem = 16px on each side -> 32px total.
  return Math.max(0, grid.clientWidth - 32)
}

function updateGridColumns(grid: HTMLElement): void {
  const width = getGridWidth(grid)
  const targetSize = state.layoutSettings.thumbnailSize || 120

  // Calculate how many columns fit at this target size
  let cols = Math.floor(width / targetSize)
  if (cols < 1) cols = 1

  // Minimal safety check (15px limits)
  if (width / cols < 15 && cols > 1) cols--

  grid.style.setProperty('--col-count', cols.toString())
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
