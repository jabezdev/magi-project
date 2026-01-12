/**
 * Projection Screen Entry Point
 * 
 * Orchestrates rendering of MainProjection or ConfidenceMonitor.
 */

import type { ScreenType } from '../types'
import { subscribeToState, StateChangeKey } from '../state'

import {
  buildMainProjectionHTML,
  setupVideoAutoplay,
  setupMarginMarkersListener,
  updateLyricsDisplay,
  updateBackgroundVideo,
  updateDisplayMode,
  updateLyricsStyle,
  updateLogoMedia
} from './MainProjection'

import {
  buildConfidenceMonitorHTML,
  startClock,
  stopClock,
  updateTeleprompterContent,
  updateConfidenceMonitorStyles
} from './ConfidenceMonitor'

// State subscription cleanup
let unsubscribe: (() => void) | null = null
// Track if initial render is done
let isInitialized = false

/**
 * Render the projection screen (main projection or confidence monitor)
 */
export function renderProjectionScreen(screenType: ScreenType): void {
  const app = document.getElementById('app')
  if (!app) return

  const isConfidenceMonitor = screenType === 'confidence-monitor'

  // Clean up previous subscriptions
  cleanup()

  // Initial full render (only on first load or screen type change)
  if (isConfidenceMonitor) {
    app.innerHTML = buildConfidenceMonitorHTML()
    startClock()
    setupConfidenceMonitorUpdates()
  } else {
    app.innerHTML = buildMainProjectionHTML()
    setupMainProjectionUpdates()
    setupMarginMarkersListener()
    setupVideoAutoplay() // Main screen needs autoplay more urgently
  }

  // Setup fullscreen button
  setupFullscreenButton()
  isInitialized = true
}

/**
 * Cleanup function for when component unmounts
 */
function cleanup(): void {
  stopClock()

  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
  isInitialized = false
}

/**
 * Setup efficient updates for main projection screen
 */
function setupMainProjectionUpdates(): void {
  unsubscribe = subscribeToState((changedKeys: StateChangeKey[]) => {
    if (!isInitialized) return

    // Update only what changed
    if (changedKeys.includes('live') || changedKeys.includes('displayMode')) {
      updateLyricsDisplay()
    }
    if (changedKeys.includes('backgroundVideo')) {
      updateBackgroundVideo()
    }
    if (changedKeys.includes('displayMode')) {
      updateDisplayMode()
    }
    if (changedKeys.includes('displaySettings')) {
      updateLyricsStyle()
    }
    if (changedKeys.includes('logoMedia')) {
      updateLogoMedia()
    }
  })
}

/**
 * Setup efficient updates for confidence monitor
 */
function setupConfidenceMonitorUpdates(): void {
  unsubscribe = subscribeToState((changedKeys: StateChangeKey[]) => {
    if (!isInitialized) return

    // Update teleprompter content when live state OR preview state changes
    if (changedKeys.includes('live') || changedKeys.includes('preview') || changedKeys.includes('displayMode')) {
      updateTeleprompterContent()
    }

    // Update styles when confidence monitor settings change
    if (changedKeys.includes('confidenceMonitorSettings')) {
      updateConfidenceMonitorStyles()
    }
  })
}

/**
 * Setup fullscreen button functionality
 */
function setupFullscreenButton(): void {
  const btn = document.querySelector('.fullscreen-btn')
  if (!btn) return

  btn.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  })
}
