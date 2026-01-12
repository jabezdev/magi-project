// Core data types for the projection system

export type TransitionType = 'none' | 'crossfade'

export interface TransitionSettings {
  type: TransitionType
  duration: number // seconds
}

// Song part types
export type PartType = string // 'v1' | 'v2' | 'v3' | 'v4' | 'ch' | 'pch' | 'br' | 'tag' | 'intro' | 'outro' | 'inst'

export interface SongPart {
  id: PartType
  label: string // 'Verse 1', 'Chorus', 'Pre-Chorus', 'Bridge', etc.
  slides: string[] // Each slide's text content
}

export interface SongVariation {
  id: number
  name: string // 'Default', 'Short', 'Extended', 'Sunday Service'
  arrangement: PartType[] // ['v1', 'pch', 'ch', 'v2', 'pch', 'ch', 'br', 'ch']
}

export interface Song {
  id: number
  title: string
  artist?: string
  parts: SongPart[]
  variations: SongVariation[]
}

// Schedule types
export interface ScheduleItem {
  songId: number
  variationId: number | string
}

export interface Schedule {
  date: string
  items: ScheduleItem[]
}

export interface SongSummary {
  id: number
  title: string
  artist?: string
  variations?: SongVariation[]
  searchContent?: string
}

export interface SongSet {
  id: number
  name: string
  songs: Song[]
}

// Deprecated: LyricsData was monolothic
export interface LyricsData {
  sets: SongSet[] // Kept for type compat during migration if any
}

export type DisplayMode = 'lyrics' | 'logo' | 'black' | 'clear'

export interface DisplaySettings {
  fontSize: number
  fontFamily: string
  lineHeight: number
  // Transitions
  transitions: TransitionSettings
  // Text styling
  textColor: string
  allCaps: boolean
  // Shadow
  textShadow: boolean
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  // Outline
  textOutline: boolean
  outlineWidth: number
  outlineColor: string
  // Margins (separate for each side)
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
}

export interface ConfidenceMonitorSettings {
  fontSize: number
  fontFamily: string
  lineHeight: number
  transitions: TransitionSettings
  prevNextOpacity: number
  clockSize: number
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
  partGap: number
  slideGap: number
}

export interface LayoutSettings {
  songsColumnWidth: number | null
  scheduleSectionHeight: number | null
  librarySectionHeight: number | null
  backgroundsSectionHeight: number | null
  thumbnailSize?: number // Optional, defaults to 80
  monitorColumnWidth?: number | null // Optional, defaults to 300
}

// Represents the current slide position
export interface SlidePosition {
  partIndex: number // Index in the arrangement
  slideIndex: number // Index within the part's slides
}

export interface AppState {
  // Preview state (what's selected but not live)
  previewSong: Song | null
  previewVariation: number // index of the selected variation
  previewPosition: SlidePosition
  // Live state (what's actually displayed)
  liveSong: Song | null
  liveVariation: number
  livePosition: SlidePosition
  // Display settings
  previewBackground: string
  backgroundVideo: string
  availableVideos: VideoFile[]
  logoMedia: string
  displayMode: DisplayMode

  // Data State
  songs: SongSummary[]
  schedule: Schedule

  // Legacy Data (Deprecated)
  lyricsData: LyricsData | null

  // UI settings
  theme: 'light' | 'dark'
  displaySettings: DisplaySettings
  confidenceMonitorSettings: ConfidenceMonitorSettings
  layoutSettings: LayoutSettings
}

export interface VideoFile {
  name: string
  path: string
  thumbnail?: string
}

export interface SlideUpdate {
  song: Song | null
  variation: number
  position: SlidePosition
}

export interface VideoUpdate {
  video: string
}

export interface DisplayModeUpdate {
  mode: DisplayMode
}

export interface LogoUpdate {
  logo: string
}

export interface DisplaySettingsUpdate {
  settings: DisplaySettings
}

export interface LowerThirdsSettings {
  // Background
  backgroundColor: string
  backgroundOpacity: number
  // Text styling
  fontFamily: string
  fontSize: number
  fontWeight: string
  textColor: string
  textAlign: 'left' | 'center' | 'right'
  allCaps: boolean
  // Position and sizing
  position: 'bottom' | 'top'
  marginBottom: number
  marginTop: number
  marginLeft: number
  marginRight: number
  paddingVertical: number
  paddingHorizontal: number
  // Visibility
  visible: boolean
  // Animation
  animationDuration: number
}

export type ScreenType = 'control-panel' | 'main-projection' | 'confidence-monitor' | 'lower-thirds' | 'mobile'
