/**
 * Default configuration values
 */

import type { DisplaySettings, SlidePosition, ConfidenceMonitorSettings, LayoutSettings, LowerThirdsSettings, GlobalSettings, OutputSettings, TransitionSettings } from '../types'


export const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
  songsColumnWidth: 350,
  scheduleSectionHeight: 300,
  librarySectionHeight: null,
  backgroundsSectionHeight: 200,
  thumbnailSize: 80,
  // Monitor performance settings
  mainMonitorEnabled: true,
  confidenceMonitorEnabled: true,
  lowerThirdsMonitorEnabled: true,
  mobileMonitorEnabled: true,
  confidenceMonitorResolution: { width: 1024, height: 768 },
  mainProjectionStaticMode: false,
  monitorColumnWidth: 450
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
  slideGap: 0,
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

export const DEFAULT_POSITION: SlidePosition = 0

export const DEFAULT_BACKGROUND_VIDEO = ''
export const DEFAULT_LOGO_MEDIA = ''

export const STORAGE_KEYS = {
  THEME: 'magi-theme',
  DISPLAY_SETTINGS: 'magi-display-settings',
  CONFIDENCE_MONITOR_SETTINGS: 'magi-confidence-monitor-settings',
  LAYOUT_SETTINGS: 'magi-layout-settings',
  LOWER_THIRDS_SETTINGS: 'magi-lower-thirds-settings',
  PART_COLORS: 'magi-part-colors'
} as const

export const DEFAULT_PART_COLORS: Record<string, string> = {
  'V': '#3b82f6',   // Blue-500
  'CH': '#ef4444',  // Red-500
  'pCH': '#f97316', // Orange-500
  'BR': '#8b5cf6',  // Violet-500
  'TAG': '#ec4899', // Pink-500
  'IN': '#10b981',  // Emerald-500
  'OUT': '#6366f1'  // Indigo-500
}

/**
 * Default output settings for all screens
 */
export const DEFAULT_OUTPUT_SETTINGS: OutputSettings = {
  enabled: true,
  fontFamily: 'system-ui',
  fontSize: 3.5,
  lineHeight: 1.4,
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  textColor: '#ffffff',
  isAllCaps: false,
  hasShadow: true,
  shadowSettings: { blur: 10, x: 0, y: 4 },
  hasOutline: false,
  outlineSettings: { width: 0, color: '#000000' }
}

/**
 * Default transition settings
 */
export const DEFAULT_TRANSITIONS: { background: TransitionSettings; lyrics: TransitionSettings } = {
  background: { type: 'crossfade', duration: 1.0 },
  lyrics: { type: 'crossfade', duration: 0.3 }
}

/**
 * Unified Global Settings - Single source of truth for all app defaults
 */
export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  theme: 'dark',

  outputs: {
    main: { ...DEFAULT_OUTPUT_SETTINGS, fontSize: 5 },
    confidence: { ...DEFAULT_OUTPUT_SETTINGS, fontFamily: 'monospace', fontSize: 3, hasShadow: false },
    lower_thirds: { ...DEFAULT_OUTPUT_SETTINGS, fontSize: 2.5, marginBottom: 5, marginLeft: 5, marginRight: 5 },
    mobile: { ...DEFAULT_OUTPUT_SETTINGS, fontSize: 1.5, lineHeight: 1.5, textColor: '#000000', hasShadow: false }
  },

  displaySettings: DEFAULT_DISPLAY_SETTINGS,
  confidenceMonitorSettings: DEFAULT_CONFIDENCE_MONITOR_SETTINGS,
  lowerThirdsSettings: DEFAULT_LOWER_THIRDS_SETTINGS,
  layoutSettings: DEFAULT_LAYOUT_SETTINGS,

  default_transitions: DEFAULT_TRANSITIONS,

  paths: {
    media_root: './data/media',
    data_root: './data'
  },

  logoMedia: '',
  defaultBackgroundVideo: '',

  partColors: DEFAULT_PART_COLORS
}

