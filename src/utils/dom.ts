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
 * Update a video source without recreating the element
 */
export function updateVideoSource(video: HTMLVideoElement | null, src: string): void {
  if (!video) return
  
  const currentSrc = video.src || video.getAttribute('src') || ''
  // Compare just the path portion, ignore origin for relative URLs
  const currentPath = new URL(currentSrc, window.location.origin).pathname
  const newPath = new URL(src, window.location.origin).pathname
  
  if (currentPath !== newPath) {
    video.src = src
    video.load()
    video.play().catch(() => {})
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
