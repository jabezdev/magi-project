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
  // Compare just the path portion, ignore origin for relative URLs
  const currentPath = new URL(currentSrc, window.location.origin).pathname
  const newPath = new URL(src, window.location.origin).pathname

  // Clean up any pending transition cleanup
  if (transitionTimeoutId) {
    clearTimeout(transitionTimeoutId)
    transitionTimeoutId = null
    // If a transition was happening, the 'old' video might still be there or fading.
    // For simplicity, we just proceed. A more robust solution would track the 'next' video element too.
  }

  if (currentPath !== newPath) {
    // Create a new video element for crossfade
    const container = video.parentElement
    if (!container) {
      // Fallback: just swap the source
      video.src = src
      video.load()
      video.play().catch(() => { })
      return
    }

    // Check if there's ALREADY a 'next' video (transition in progress)
    // If so, we reuse it or replace it, instead of stacking a 3rd video.
    // We can identify it by zIndex=1 usually, but let's just query.
    const videos = container.querySelectorAll('video')
    if (videos.length > 1) {
      // Transition already happening. The last one is the 'new' one trying to fade in.
      // We can just hijacking it.
      const incomingVideo = videos[videos.length - 1] as HTMLVideoElement
      incomingVideo.src = src
      incomingVideo.load()
      incomingVideo.play().catch(() => { })
      return
    }

    // Create new video with same classes
    const newVideo = document.createElement('video')
    newVideo.className = video.className
    newVideo.src = src
    newVideo.autoplay = true
    newVideo.loop = true
    newVideo.muted = true
    newVideo.playsInline = true
    newVideo.style.opacity = '0'
    newVideo.style.transition = 'opacity 1s ease-in-out'
    newVideo.style.position = 'absolute'
    newVideo.style.inset = '0'
    newVideo.style.width = '100%'
    newVideo.style.height = '100%'
    newVideo.style.objectFit = 'cover'
    newVideo.style.zIndex = '1'

    // Ensure old video has proper positioning
    video.style.transition = 'opacity 1s ease-in-out'
    video.style.position = 'absolute'
    video.style.inset = '0'
    video.style.zIndex = '0'

    container.appendChild(newVideo)

    // Start playing new video and fade in
    newVideo.load()
    newVideo.play().catch(() => { })

    // Fade in new video after a brief delay to ensure it's ready
    requestAnimationFrame(() => {
      newVideo.style.opacity = '1'
      video.style.opacity = '0'
    })

    // After transition, remove old video and reset styles
    transitionTimeoutId = window.setTimeout(() => {
      if (container.contains(video)) {
        video.remove()
      }

      // The new video becomes the 'main' video
      newVideo.style.transition = ''
      newVideo.style.zIndex = ''
      transitionTimeoutId = null
    }, 1100) // Slightly longer than transition
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
