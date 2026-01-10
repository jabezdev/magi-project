/**
 * MAGI Church Projection System - Main Entry Point
 * 
 * This is the application bootstrap file that initializes the correct
 * screen based on URL parameters.
 */

import './style.css'
import { fetchLyrics, fetchVideoAssets } from './services/api'
import { state, updateState, setUpdateScreenCallback } from './state'
import { getScreenType } from './utils/screen'
import { renderControlPanel } from './screens/ControlPanel'
import { renderProjectionScreen } from './screens/ProjectionScreen'
import type { ScreenType } from './types'

// Store the current screen type
let currentScreen: ScreenType
// Track if screen has been rendered at least once
let hasRendered = false

/**
 * Update the screen based on the current screen type
 * Only performs full re-render when needed (initial render or major state changes)
 */
function updateScreen(): void {
  // Skip re-render if already rendered (efficient updates handle partial changes)
  // Only re-render for major state changes like song selection
  if (!hasRendered) {
    performRender()
    hasRendered = true
    return
  }
  
  // For control panel, we need to re-render on song changes
  // The efficient update system handles position/mode changes
  if (currentScreen === 'control-panel') {
    performRender()
  }
  // Projection screens use subscription-based updates after initial render
}

/**
 * Perform the actual render based on screen type
 */
function performRender(): void {
  switch (currentScreen) {
    case 'control-panel':
      renderControlPanel()
      break
    case 'main-projection':
    case 'confidence-monitor':
      renderProjectionScreen(currentScreen)
      break
  }
}

/**
 * Initialize the application
 */
async function init(): Promise<void> {
  // Detect screen type from URL
  currentScreen = getScreenType()
  
  // Set up the state update callback
  setUpdateScreenCallback(updateScreen)
  
  // Load initial data
  try {
    const [lyricsData, videos] = await Promise.all([
      fetchLyrics(),
      fetchVideoAssets()
    ])
    
    // Initial data load - triggers first render
    updateState({
      lyricsData,
      availableVideos: videos
    })
  } catch (error) {
    console.error('Failed to load initial data:', error)
    // Still render the screen even if data load fails
    performRender()
    hasRendered = true
  }
  
  // Apply saved theme
  document.body.setAttribute('data-theme', state.theme)
  
  console.log(`🚀 MAGI Projection System initialized as: ${currentScreen}`)
}

// Start the application
init()
