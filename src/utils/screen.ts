/**
 * Screen Detection Utilities
 */

import type { ScreenType } from '../types'

/**
 * Detects the current screen type from URL path
 */
export function getScreenType(): ScreenType {
  const path = window.location.pathname
  
  if (path === '/main') {
    return 'main-projection'
  }
  if (path === '/confidence') {
    return 'confidence-monitor'
  }
  
  return 'control-panel'
}

/**
 * Checks if we're on a projection screen (main or confidence)
 */
export function isProjectionScreen(): boolean {
  const screen = getScreenType()
  return screen === 'main-projection' || screen === 'confidence-monitor'
}

/**
 * Checks if we're on the control panel
 */
export function isControlPanel(): boolean {
  return getScreenType() === 'control-panel'
}
