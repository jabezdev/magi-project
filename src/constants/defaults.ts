/**
 * Default configuration values
 */

import type { DisplaySettings, SlidePosition, ConfidenceMonitorSettings } from '../types'

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  fontSize: 3.5,
  fontFamily: 'system-ui',
  lineHeight: 1.5,
  // Text styling
  textColor: '#ffffff',
  allCaps: false,
  // Shadow
  textShadow: true,
  shadowBlur: 4,
  shadowOffsetX: 2,
  shadowOffsetY: 2,
  // Outline
  textOutline: false,
  outlineWidth: 2,
  outlineColor: '#000000',
  // Margins
  marginTop: 10,
  marginBottom: 10,
  marginLeft: 5,
  marginRight: 5
}

export const DEFAULT_CONFIDENCE_MONITOR_SETTINGS: ConfidenceMonitorSettings = {
  fontSize: 2.5,
  fontFamily: 'system-ui',
  lineHeight: 1.4,
  prevNextOpacity: 0.35
}

export const DEFAULT_POSITION: SlidePosition = {
  partIndex: 0,
  slideIndex: 0
}

export const DEFAULT_BACKGROUND_VIDEO = '/public/videos/background.mp4'
export const DEFAULT_LOGO_MEDIA = '/public/videos/logo.mp4'

export const STORAGE_KEYS = {
  THEME: 'magi-theme',
  DISPLAY_SETTINGS: 'magi-display-settings',
  CONFIDENCE_MONITOR_SETTINGS: 'magi-confidence-monitor-settings'
} as const
