// Core data types for the projection system

export type TransitionType = 'none' | 'crossfade'

export interface TransitionSettings {
  type: TransitionType
  duration: number // seconds
}

// === MEDIA TYPES ===

export type MediaType = 'song' | 'video' | 'image' | 'slide' | 'scripture' | 'audio'

export type AspectRatioMode = 'fit' | 'fill' | 'stretch'

export interface MediaSettings {
  aspectRatioMode?: AspectRatioMode
}

export interface VideoSettings extends MediaSettings {
  startTime?: number // seconds
  endTime?: number // seconds
  muted?: boolean
  loop?: boolean // Default loop setting
}

export interface ImageSettings extends MediaSettings {
  duration?: number // Default duration in seconds
}

// === BASE ITEM INTERFACE ===
// Common fields for all projectable items
interface BaseProjectableItem {
  id: string
  title: string
  subtitle?: string
  thumbnail?: string
}

// === TYPE-SPECIFIC ITEM INTERFACES ===

export interface SongItem extends BaseProjectableItem {
  type: 'song'
  songId: number
  variationId: number
  artist?: string
  // Hydrated data (loaded on demand)
  searchContent?: string
}

export interface VideoItem extends BaseProjectableItem {
  type: 'video'
  url: string
  duration?: number // seconds
  isYouTube?: boolean
  settings?: VideoSettings
  loop?: boolean
}

export interface ImageItem extends BaseProjectableItem {
  type: 'image'
  url: string
  settings?: ImageSettings
}

export interface AudioItem extends BaseProjectableItem {
  type: 'audio'
  url: string
  duration?: number // seconds
}

export interface SlideContent {
  id: string
  type: 'text' | 'image'
  content: string // Text content or image path
  path?: string   // Alias for image path
}

// === UNIFIED CONTENT SLIDE ===
// All projectable items have their content normalized into ContentSlide[]
export interface ContentSlide {
  id: string           // Unique ID within the item
  index: number        // Flat index (0-based)
  type: 'text' | 'image' | 'video' | 'audio' | 'embed'

  // Content
  content: string      // Text content, URL, or embed code

  // Metadata (optional)
  label?: string       // e.g., "CHORUS", "Verse 1", "Genesis 1:1"
  partId?: string      // Song part ID for grouping
  thumbnail?: string   // Preview image for videos/images
}

export interface SlideItem extends BaseProjectableItem {
  type: 'slide'
  slides: SlideContent[]
  slideType: 'local' | 'image' | 'canva'
}

export interface ScriptureVerse {
  number: number
  text: string
}

export interface ScriptureItem extends BaseProjectableItem {
  type: 'scripture'
  reference: string
  translation: string
  verses: ScriptureVerse[]
}

// === UNIFIED PROJECTABLE ITEM (Discriminated Union) ===
export type ProjectableItem =
  | SongItem
  | VideoItem
  | ImageItem
  | AudioItem
  | SlideItem
  | ScriptureItem

// === SCHEDULE ITEM ===
// Schedule items are ProjectableItems with optional override settings
export interface ItemSettings extends VideoSettings, ImageSettings {
  // Common
  autoAdvance?: boolean
  transitionOverride?: TransitionSettings

  // Specific
  isCanvaSlide?: boolean // Special handling for Canva embed slides
  canvaHoldPoint?: number // Video timestamp to hold at (seconds)
  holdTime?: number
}

export type ScheduleItem = ProjectableItem & {
  settings?: ItemSettings
}

// === SUPPORT TYPES ===
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

// === SCHEDULE ===

export interface Schedule {
  date: string
  items: ScheduleItem[]
}

// Song summary for library listing (lighter than full Song)
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

// Represents a unified slide position (0-based index)
export type SlidePosition = number
export type SimplePosition = SlidePosition

export interface LiveMediaState {
  isPlaying: boolean
  currentTime: number
  duration: number
  isCanvaHolding?: boolean // Special state for Canva slides
}

export interface AppState {
  // Preview state (unified)
  previewItem: ScheduleItem | null
  previewContent: ContentSlide[]  // Hydrated content slides
  previewPosition: number         // Simple 0-based index

  // Live state (unified)
  liveItem: ScheduleItem | null
  liveContent: ContentSlide[]     // Hydrated content slides  
  livePosition: number            // Simple 0-based index
  liveMediaState: LiveMediaState

  // Previous Live state (for transition context)
  previousItem: ScheduleItem | null
  previousContent: ContentSlide[]
  previousPosition: number

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
  content?: ContentSlide[] // New: include hydrated content in updates
  position: number // Changed from SlidePosition | SimplePosition
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
