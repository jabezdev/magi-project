/**
 * MAGI Church Projection System - Main Entry Point
 * 
 * This is the application bootstrap file that initializes the correct
 * screen based on URL parameters.
 */

import './style.css'
import { ControlPanel } from './screens/ControlPanel'
import { MainProjection } from './screens/MainProjection'
import { ConfidenceMonitor } from './screens/ConfidenceMonitor'
import { LowerThirds } from './screens/LowerThirds'
import { MobileScreen } from './screens/MobileScreen'
import { getScreenType } from './utils'


import { ScreenType } from './types'

// Store the current screen type
let currentScreen: ScreenType

/**
 * Initialize the application
 */
async function init(): Promise<void> {
  // Detect screen type from URL
  currentScreen = getScreenType()
  const appRoot = document.querySelector<HTMLDivElement>('#app')!

  if (!appRoot) throw new Error('Root #app element not found')

  console.log(`[MAGI] System initialized as: ${currentScreen}`)

  switch (currentScreen) {
    case 'control-panel':
      const controlPanel = new ControlPanel()
      appRoot.appendChild(controlPanel.element)
      break

    case 'main-projection':
      const mainProjection = new MainProjection()
      appRoot.appendChild(mainProjection.element)
      break
    case 'confidence-monitor':
      const confidence = new ConfidenceMonitor()
      appRoot.appendChild(confidence.element)
      break


    case 'lower-thirds':
      const lowerThirds = new LowerThirds()
      appRoot.appendChild(lowerThirds.element)
      break

    case 'mobile':
      const mobile = new MobileScreen()
      appRoot.appendChild(mobile.element)
      break

  }
}

// Start the application
init()

