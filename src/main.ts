/**
 * MAGI Church Projection System - Main Entry Point
 * 
 * This is the application bootstrap file that initializes the correct
 * screen based on URL parameters.
 */

import './style.css'
import { fetchSongs, fetchSchedule, fetchScheduleByName, fetchVideoAssets } from './services/api'
import { state, updateState, setUpdateScreenCallback, loadSettingsFromServer, getSavedCurrentSchedule } from './state'
import { getScreenType } from './utils/screen'
import { renderControlPanel } from './screens/ControlPanel'
import { renderProjectionScreen } from './screens/ProjectionScreen'
import { renderLowerThirdsScreen } from './screens/LowerThirds'
import { renderMobileScreen } from './screens/MobileScreen'
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

  // For control panel, we rely on efficient updates in ControlPanel.ts
  // DO NOT trigger performRender() here for state changes, as it rebuilds the entire DOM
  // and breaks scroll position / drag states / selection
  if (currentScreen === 'control-panel') {
    return
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
    case 'mobile':
      renderMobileScreen()
      break
    case 'lower-thirds':
      renderLowerThirdsScreen()
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

  // Lower thirds screen is standalone - doesn't need server data
  if (currentScreen === 'lower-thirds') {
    renderLowerThirdsScreen()
    hasRendered = true
    console.log(`[MAGI] System initialized as: ${currentScreen}`)
    return
  }

  // Load settings from server first (merges with localStorage)
  await loadSettingsFromServer()

  // Load initial data
  try {
    // Check if there's a saved schedule name
    const savedScheduleName = getSavedCurrentSchedule()

    const [songs, videos] = await Promise.all([
      fetchSongs(),
      fetchVideoAssets()
    ])

    // Load the saved schedule or default to 'current'
    let schedule
    if (savedScheduleName && savedScheduleName !== 'current') {
      schedule = await fetchScheduleByName(savedScheduleName)
      if (!schedule) {
        // Fall back to current if saved schedule doesn't exist
        schedule = await fetchSchedule()
      }
    } else {
      schedule = await fetchSchedule()
    }

    // Initial data load - triggers first render
    updateState({
      songs,
      schedule,
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

  console.log(`[MAGI] System initialized as: ${currentScreen}`)
}

// Start the application
init()
