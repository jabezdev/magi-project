/**
 * Keyboard Event Handlers
 */

import type { DisplayMode } from '../types'

export interface KeyboardHandlers {
  nextSlide: () => void
  prevSlide: () => void
  goLive: () => void
  setDisplayMode: (mode: DisplayMode) => void
  toggleHelp: () => void
}

let handlers: KeyboardHandlers | null = null
let isModalOpen = false

/**
 * Set modal state to prevent keyboard shortcuts when modal is open
 */
export function setModalOpen(open: boolean): void {
  isModalOpen = open
}

/**
 * Initialize keyboard handlers
 */
export function initKeyboardHandlers(handlerFunctions: KeyboardHandlers): void {
  handlers = handlerFunctions
}

/**
 * Handle keyboard events
 */
export function handleKeyboard(e: KeyboardEvent): void {
  if (!handlers || isModalOpen) return

  // Ignore if typing in an input field
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
    return
  }

  switch (e.key) {
    case 'ArrowRight':
    case ' ':
      e.preventDefault()
      handlers.nextSlide()
      break
    case 'ArrowLeft':
      e.preventDefault()
      handlers.prevSlide()
      break
    case 'Enter':
      e.preventDefault()
      handlers.goLive()
      break
    case 'b':
    case 'B':
      handlers.setDisplayMode('black')
      break
    case 'c':
    case 'C':
      handlers.setDisplayMode('clear')
      break
    case 'l':
    case 'L':
      handlers.setDisplayMode('logo')
      break
    case '?':
      e.preventDefault()
      handlers.toggleHelp()
      break
    case 'Escape':
      handlers.setDisplayMode('lyrics')
      break
  }
}

/**
 * Setup keyboard event listener
 */
export function setupKeyboardListener(): void {
  document.addEventListener('keydown', handleKeyboard)
}

/**
 * Remove keyboard event listener
 */
export function removeKeyboardListener(): void {
  document.removeEventListener('keydown', handleKeyboard)
}
