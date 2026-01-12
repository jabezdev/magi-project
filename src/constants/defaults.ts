/**
 * Default configuration values
 */

import type { DisplaySettings, SlidePosition, ConfidenceMonitorSettings, LayoutSettings, LowerThirdsSettings } from '../types'

export const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
  songsColumnWidth: 350,
  scheduleSectionHeight: 300,
  librarySectionHeight: null,
  backgroundsSectionHeight: 200,
  thumbnailSize: 80
}

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
  marginRight: 5,
  transitions: {
    type: 'crossfade',
    duration: 0.5
  }
}

export const DEFAULT_CONFIDENCE_MONITOR_SETTINGS: ConfidenceMonitorSettings = {
  fontSize: 2.5,
  fontFamily: 'system-ui',
  lineHeight: 1.4,
  prevNextOpacity: 0.35,
  clockSize: 1.25,
  marginTop: 0.5,
  marginBottom: 0.5,
  marginLeft: 0.5,
  marginRight: 0.5,
  partGap: 2.0,
  transitions: {
    type: 'crossfade',
    duration: 0.5
  }
}

export const DEFAULT_LOWER_THIRDS_SETTINGS: LowerThirdsSettings = {
  // Background - chroma green by default
  backgroundColor: '#00FF00',
  backgroundOpacity: 1,
  // Text styling
  fontFamily: 'Arial',
  fontSize: 48,
  fontWeight: 'bold',
  textColor: '#ffffff',
  textAlign: 'center',
  allCaps: true,
  // Position and sizing
  position: 'bottom',
  marginBottom: 10,
  marginTop: 10,
  marginLeft: 5,
  marginRight: 5,
  paddingVertical: 20,
  paddingHorizontal: 40,
  // Visibility
  visible: true,
  // Animation
  animationDuration: 0.5
}

export const DEFAULT_POSITION: SlidePosition = {
  partIndex: 0,
  slideIndex: 0
}

export const DEFAULT_BACKGROUND_VIDEO = '/media/background.mp4'
export const DEFAULT_LOGO_MEDIA = '/media/logo.mp4'

export const STORAGE_KEYS = {
  THEME: 'magi-theme',
  DISPLAY_SETTINGS: 'magi-display-settings',
  CONFIDENCE_MONITOR_SETTINGS: 'magi-confidence-monitor-settings',
  CURRENT_SCHEDULE: 'magi-current-schedule',
  LAYOUT_SETTINGS: 'magi-layout-settings',
  LOWER_THIRDS_SETTINGS: 'magi-lower-thirds-settings',
  PREVIEW_BACKGROUND: 'magi-preview-background'
} as const
