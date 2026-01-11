/**
 * DOM Utilities for efficient rendering
 * 
 * Provides functions for minimal DOM updates instead of full re-renders
 */

/**
 * Update an element's text content only if changed
 */
export function updateText(element: Element | null, text: string): void {
  if (element && element.textContent !== text) {
    element.textContent = text
  }
}

/**
 * Update an element's innerHTML only if changed
 */
export function updateHTML(element: Element | null, html: string): void {
  if (element && element.innerHTML !== html) {
    element.innerHTML = html
  }
}

/**
 * Update an element's attribute only if changed
 */
export function updateAttr(element: Element | null, attr: string, value: string | null): void {
  if (!element) return

  if (value === null) {
    element.removeAttribute(attr)
  } else if (element.getAttribute(attr) !== value) {
    element.setAttribute(attr, value)
  }
}

/**
 * Toggle a class on an element
 */
export function toggleClass(element: Element | null, className: string, force?: boolean): void {
  if (element) {
    element.classList.toggle(className, force)
  }
}

/**
 * Update button disabled state
 */
export function updateDisabled(element: HTMLButtonElement | null, disabled: boolean): void {
  if (element && element.disabled !== disabled) {
    element.disabled = disabled
  }
}

/**
 * Update a video source with smooth fade transition
 */
let transitionTimeoutId: number | null = null

export function updateVideoSource(video: HTMLVideoElement | null, src: string): void {
  if (!video) return

  const currentSrc = video.src || video.getAttribute('src') || ''
  const currentPath = new URL(currentSrc, window.location.origin).pathname
  const newPath = new URL(src, window.location.origin).pathname

  // Check if src actually changed
  if (currentPath === newPath) return

  // Clean up any pending transition cleanup
  if (transitionTimeoutId) {
    clearTimeout(transitionTimeoutId)
    transitionTimeoutId = null
  }

  const container = video.parentElement
  if (!container) {
    video.src = src
    video.load()
    video.play().catch(() => { })
    return
  }

  let baseVideo = video
  let incomingVideo: HTMLVideoElement | null = null
  const videos = container.querySelectorAll('video')

  // IDENTIFY STATE
  if (videos.length > 1) {
    // Transition in progress.
    // The first video is the 'base' (fading out or waiting to be removed).
    // The last video is the 'incoming' (fading in or waiting to load).
    baseVideo = videos[0] as HTMLVideoElement
    incomingVideo = videos[videos.length - 1] as HTMLVideoElement
  } else {
    // No transition active. Create the incoming video.
    incomingVideo = document.createElement('video')
    incomingVideo.className = video.className
    // Apply standard styles
    incomingVideo.style.position = 'absolute'
    incomingVideo.style.inset = '0'
    incomingVideo.style.width = '100%'
    incomingVideo.style.height = '100%'
    incomingVideo.style.objectFit = 'cover'
    incomingVideo.style.zIndex = '1'

    incomingVideo.autoplay = true
    incomingVideo.loop = true
    incomingVideo.muted = true
    incomingVideo.playsInline = true

    container.appendChild(incomingVideo)

    // Prepare base video for fade out
    baseVideo.style.transition = 'opacity 1s ease-in-out'
    baseVideo.style.position = 'absolute'
    baseVideo.style.inset = '0'
    baseVideo.style.zIndex = '0'
  }

  // RESET INCOMING VIDEO (Reusable Logic)
  // Instantly hide and reset incoming video so it doesn't flash the wrong content
  incomingVideo.style.transition = 'none'
  incomingVideo.style.opacity = '0'
  // Force reflow
  void incomingVideo.offsetHeight

  // Restore transition
  incomingVideo.style.transition = 'opacity 1s ease-in-out'

  // Ensure base video is visible (fades back in if we interrupted a fade-out)
  requestAnimationFrame(() => {
    baseVideo.style.opacity = '1'
  })

  // LOAD NEW CONTENT
  incomingVideo.src = src
  incomingVideo.load()
  incomingVideo.play().catch(() => { })

  // START ANIMATION WHEN READY
  const startTransition = () => {
    // Double check if we are still the latest request? 
    // (If another request came in during 'canplay', timeoutId would be cleared, 
    // but we might still fire. However, the NEXT request would have hijacked 'incomingVideo'
    // and changed its src. So we might be animating the NEW src. Which is fine.)

    requestAnimationFrame(() => {
      if (incomingVideo) incomingVideo.style.opacity = '1'
      if (baseVideo) baseVideo.style.opacity = '0'
    })

    // Schedule cleanup
    // We clear any existing timeout first (though handled at top, safety first)
    if (transitionTimeoutId) clearTimeout(transitionTimeoutId)

    transitionTimeoutId = window.setTimeout(() => {
      if (container.contains(baseVideo) && container.querySelectorAll('video').length > 1) {
        baseVideo.remove()
      }
      if (incomingVideo) {
        incomingVideo.style.transition = ''
        incomingVideo.style.zIndex = ''
      }
      transitionTimeoutId = null
    }, 1100)
  }

  if (incomingVideo.readyState >= 3) {
    startTransition()
  } else {
    incomingVideo.addEventListener('canplay', startTransition, { once: true })
  }
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Request animation frame with cancellation support
 */
export function scheduleUpdate(fn: () => void): () => void {
  const id = requestAnimationFrame(fn)
  return () => cancelAnimationFrame(id)
}

/**
 * Batch multiple DOM updates into a single animation frame
 */
export class UpdateBatcher {
  private pending = false
  private updates: Array<() => void> = []

  schedule(update: () => void): void {
    this.updates.push(update)

    if (!this.pending) {
      this.pending = true
      requestAnimationFrame(() => {
        this.flush()
      })
    }
  }

  private flush(): void {
    const updates = this.updates
    this.updates = []
    this.pending = false

    for (const update of updates) {
      update()
    }
  }
}

// Global update batcher for coordinating updates
export const updateBatcher = new UpdateBatcher()
