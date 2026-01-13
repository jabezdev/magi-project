import { state, saveLayoutSettings, subscribeToState, updateState } from '../../state'
import { ICONS } from '../../constants'
import { selectLiveVideo, selectPreviewVideo } from '../../actions'

function renderVideoGridItems(): string {
  const items = state.availableVideos.map(video => {
    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(video.thumbnail || '')
    // If optimized thumbnail exists, use it. Otherwise use video as source (will be lazy loaded)
    const thumbSrc = video.thumbnail || video.path

    const isPreview = state.previewBackground === video.path
    const isLive = state.backgroundVideo === video.path

    // video-thumb class styles
    let baseClass = 'flex flex-col gap-[0.125rem] p-0 relative bg-bg-tertiary border-[3px] border-transparent rounded-sm cursor-pointer transition-all duration-150 overflow-hidden aspect-video box-border m-0 hover:bg-bg-hover video-thumb'
    // Contain layout paint for performance
    let style = 'contain: layout paint;'

    if (isPreview) {
      baseClass += ' preview-active shadow-[0_0_0_3px_var(--accent-primary)] z-[1]'
      style = 'contain: none;'
    }
    if (isLive) {
      baseClass += ' live-active shadow-[0_0_0_3px_var(--live-red)] z-[1]'
      style = 'contain: none;'
    }
    if (isLive && isPreview) {
      // Both active
      baseClass = baseClass.replace('shadow-[0_0_0_3px_var(--accent-primary)]', '').replace('shadow-[0_0_0_3px_var(--live-red)]', '')
      baseClass += ' z-[5]'
      style = 'contain: none; box-shadow: 0 0 0 3px var(--live-red), 0 0 0 6px var(--accent-primary);'
    }

    // thumb-media
    const thumbMediaClass = 'w-full h-full object-cover bg-black block'
    // video-name
    const videoNameClass = 'absolute bottom-0 left-0 w-full pt-8 pb-1 px-1 text-[0.6rem] font-medium text-white text-center whitespace-nowrap overflow-hidden text-ellipsis pointer-events-none'
    const videoNameStyle = "background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0) 100%); text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);"

    return `
          <button class="${baseClass}" data-video-path="${video.path}" title="${video.name}" style="${style}">
            ${isImage
        ? `<img data-src="${thumbSrc}" class="${thumbMediaClass} thumb-media thumb-image" alt="thumbnail" loading="lazy" />`
        : `<video data-src="${thumbSrc}" muted preload="none" class="${thumbMediaClass} thumb-media thumb-video"></video>`
      }
            <span class="${videoNameClass}" style="${videoNameStyle}">${video.name.replace(/\.[^.]+$/, '')}</span>
          </button>
        `}).join('')

  if (state.availableVideos.length === 0) {
    return '<div class="col-span-full text-center text-text-muted text-[0.7rem] p-4">No videos in folder</div>'
  }

  return items
}

export function renderBackgroundsSection(): string {
  // Inline Tailwind Classes for header
  const headerClass = "flex flex-row items-center justify-between gap-0 p-0 h-[2.2rem] min-h-[2.2rem] bg-bg-secondary border-b border-border-color shrink-0 text-[0.85rem] relative z-10 shadow-sm"
  const headerLeft = "flex items-center h-full px-2 gap-2"
  const headerIconClass = "w-[14px] h-[14px] opacity-70"
  const headerRight = "flex items-center h-full gap-0 p-0"
  const flushBtnClass = "h-full w-[2.2rem] border-l border-border-color rounded-none m-0 p-0 bg-transparent flex items-center justify-center text-text-secondary transition-colors duration-200 hover:bg-bg-hover hover:text-text-primary flush-btn"

  // video-grid 
  const gridClass = "grid gap-4 p-4 box-border auto-rows-min content-start flex-1 overflow-y-auto"
  const gridStyle = "grid-template-columns: repeat(var(--col-count, 2), minmax(0, 1fr));"

  return `
    <div class="h-full overflow-y-auto flex flex-col video-section">
      <div class="${headerClass} cp-column-header horizontal-layout compact-header backgrounds-header">
        <div class="${headerLeft}">
          <span class="${headerIconClass}">${ICONS.video}</span>
          <span class="font-semibold uppercase tracking-[0.5px] text-text-secondary">BACKGROUNDS</span>
        </div>
        <div class="flex-1 flex items-center justify-center h-full min-w-0 p-0"></div>
        <div class="${headerRight}">
          <button class="${flushBtnClass}" id="refresh-videos-btn" title="Refresh Videos" style="border-left-width: 1px !important;">${ICONS.refresh}</button>
          <button class="${flushBtnClass}" id="zoom-out-btn" title="Zoom Out" style="border-left-width: 1px !important;">${ICONS.minus || '-'}</button>
          <button class="${flushBtnClass}" id="zoom-in-btn" title="Zoom In" style="border-left-width: 1px !important;">${ICONS.plus || '+'}</button>
        </div>
      </div>
      <div class="${gridClass} video-grid" id="video-grid" style="${gridStyle}">
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

  // Tailwind classes for selection states
  const previewClasses = ['preview-active', 'shadow-[0_0_0_3px_var(--accent-primary)]', 'z-[1]']
  const liveClasses = ['live-active', 'shadow-[0_0_0_3px_var(--live-red)]', 'z-[1]']

  thumbs.forEach(thumb => {
    const path = thumb.getAttribute('data-video-path')
    const el = thumb as HTMLElement

    const isLive = path === backgroundVideo
    const isPreview = path === previewBackground

    // Reset contain style
    el.style.contain = 'layout paint'

    // Clear all active classes
    thumb.classList.remove(...previewClasses, ...liveClasses, 'z-[5]')
    el.style.boxShadow = ''

    if (isLive && isPreview) {
      thumb.classList.add('live-active', 'preview-active', 'z-[5]')
      el.style.boxShadow = '0 0 0 3px var(--live-red), 0 0 0 6px var(--accent-primary)'
      el.style.contain = 'none'
    } else if (isLive) {
      thumb.classList.add(...liveClasses)
      el.style.contain = 'none'
    } else if (isPreview) {
      thumb.classList.add(...previewClasses)
      el.style.contain = 'none'
    }
  })
}
