// Core data types for the projection system

export type TransitionType = 'none' | 'crossfade'

export interface TransitionSettings {
  type: TransitionType
  duration: number // seconds
}

// === MEDIA TYPES ===

export type MediaType = 'song' | 'video' | 'image' | 'presentation' | 'scripture'

export interface BaseMediaItem {
  id: string
  type: MediaType
}

// Song Part Types
export type PartType = string

export interface SongPart {
  id: PartType
  label: string
  slides: string[]
}

export interface SongVariation {
  id: number
  name: string
  arrangement: PartType[]
}

export interface Song {
  id: number
  title: string
  artist?: string
  parts: SongPart[]
  variations: SongVariation[]
}

export interface SongItem extends BaseMediaItem {
  type: 'song'
  songId: number
  variationId: number | string // 'default' or specific ID
}

export interface VideoItem extends BaseMediaItem {
  type: 'video'
  name: string
  url: string // Path or YouTube URL
  isYouTube: boolean
  thumbnail?: string
  loop: boolean
  settings?: {
    isCanvaSlide?: boolean
    canvaHoldPoint?: number // Seconds
  }
}

export interface ImageItem extends BaseMediaItem {
  type: 'image'
  name: string
  url: string
  thumbnail?: string
}

export interface SlideContent {
  type: 'text' | 'image' | 'video'
  content: string // Text string or URL
  style?: string // JSON string for styles
}

export interface PresentationItem extends BaseMediaItem {
  type: 'presentation'
  title: string
  slides: SlideContent[]
}

export interface ScriptureItem extends BaseMediaItem {
  type: 'scripture'
  reference: string
  translation: string
  verses: {
    book: string
    chapter: number
    verse: number
    text: string
  }[]
}

export type ScheduleItem = SongItem | VideoItem | ImageItem | PresentationItem | ScriptureItem

// === SCHEDULE ===

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

export type DisplayMode = 'lyrics' | 'logo' | 'black' | 'clear' | 'media'

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
  // Monitor performance settings
  mainMonitorEnabled?: boolean
  confidenceMonitorEnabled?: boolean
  lowerThirdsMonitorEnabled?: boolean
  confidenceMonitorResolution?: { width: number; height: number }
  mainProjectionStaticMode?: boolean
}

// Represents the current slide position
export interface SlidePosition {
  partIndex: number // Index in the arrangement
  slideIndex: number // Index within the part's slides
}

// Generic position for non-song items (e.g., presentation slides)
export interface SimplePosition {
  index: number
}

export interface LiveMediaState {
  isPlaying: boolean
  currentTime: number
  duration: number
  isCanvaHolding?: boolean // Special state for Canva slides
}

export interface AppState {
  // Preview state
  previewItem: ScheduleItem | null
  previewSong: Song | null // Hydrated song data if previewItem is a song
  previewVariation: number
  previewPosition: SlidePosition | SimplePosition

  // Live state
  liveItem: ScheduleItem | null
  liveSong: Song | null // Hydrated song data if liveItem is a song
  liveVariation: number
  livePosition: SlidePosition | SimplePosition
  liveMediaState: LiveMediaState

  // Previous Live state (for transition context)
  previousLiveItem: ScheduleItem | null
  previousLiveSong: Song | null
  previousLiveVariation: number
  previousLivePosition: SlidePosition | SimplePosition

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
  partColors: PartColorSettings
}

export type PartColorSettings = Record<string, string>

export interface VideoFile {
  name: string
  path: string
  thumbnail?: string
}

export interface SlideUpdate {
  item: ScheduleItem | null
  song: Song | null
  variation?: number
  position: SlidePosition | SimplePosition
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
