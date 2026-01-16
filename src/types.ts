// Core data types for the projection system
// Based on media_behaviors.md - Distributed Document Store Architecture

// ============ BASE TYPES ============

/**
 * Standard UUID v4 string
 */
export type UUID = string

/**
 * ISO 8601 Date string
 */
export type ISODateString = string

/**
 * Supported Media Types
 */
export type MediaType = 'song' | 'video' | 'image' | 'slide' | 'scripture' | 'audio' | 'presentation'

// ============ DATA STORE SCHEMA ============

/**
 * Base interface for all items in the library.
 * Supports distributed sync, history, and conflict resolution.
 */
export interface BaseMediaItem {
  // Core Identity
  id: UUID
  type: MediaType
  title: string
  subtitle?: string // Derived helper for UI (e.g. Artist, File Size)
  tags: string[]

  // Sync & Versioning
  version: number // Incrementing integer (Head state)
  content_hash: string // SHA-256 of the content state
  history_head_id: UUID // Pointer to the latest history commit
  origin_device_id?: UUID
  last_modified_device_id?: UUID
  is_deleted?: boolean

  // Analytics & Workflow
  created_at: ISODateString
  updated_at: ISODateString
  usage_count: number
  last_used_at?: ISODateString
  author?: string
  notes?: string
}

/**
 * History Entry for Append-Only Logs
 */
export interface HistoryEntry {
  commit_id: UUID
  parent_commit_id: UUID | null
  version_number: number
  timestamp: ISODateString
  author: string
  device_id: UUID
  change_summary: string
  full_snapshot: BaseMediaItem // Snapshot of the item at this point
}

// ============ MEDIA SPECIFIC TYPES ============

export interface SongItem extends BaseMediaItem {
  type: 'song'

  // Metadata
  artist: string
  copyright?: string
  ccli_number?: string
  key?: string
  original_key?: string
  tempo?: number // BPM
  time_signature?: string
  themes: string[]
  scripture_references: string[]
  language?: string
  default_background_id?: UUID

  // Content
  parts: SongPart[]
  arrangements: SongArrangement[]
}

export interface SongPart {
  id: UUID
  type: string // VERSE, CHORUS, BRIDGE, INTRO, ENDING, etc.
  label: string // "Verse 1", "Chorus"
  lyrics: string // Markdown/Plain text
  background_override_id?: UUID
}

export interface SongArrangement {
  id: UUID
  name: string // "Default", "Acoustic", "Radio Edit"
  is_default: boolean
  sequence: UUID[] // Array of SongPart IDs
}

export interface ScriptureItem extends BaseMediaItem {
  type: 'scripture'

  reference_title: string // "John 3:16"
  book: string
  chapter: number
  verse_start: number
  verse_end: number
  translation_id: string // "NIV", "KJV"
  text_content: string
  is_favorite: boolean
}

export interface VideoItem extends BaseMediaItem {
  type: 'video'

  source_url: string // Path or URL
  file_hash: string // SHA-256 of binary
  file_size_bytes: number
  duration_total: number // seconds

  // Run settings
  trim_start: number
  trim_end: number
  volume_multiplier: number
  is_loop: boolean
  is_youtube: boolean

  thumbnail_path?: string
}

export interface ImageItem extends BaseMediaItem {
  type: 'image'

  source_url: string
  file_hash?: string
  scaling_mode: 'fit' | 'fill' | 'stretch'
  dominant_color?: string
  duration?: number // For slideshows
}

export interface AudioItem extends BaseMediaItem {
  type: 'audio'

  source_url: string
  file_hash?: string
  duration: number
  artist?: string
  bpm?: number
  musical_key?: string
  waveform_data?: number[] // For visualizer
}

export interface PresentationItem extends BaseMediaItem {
  type: 'presentation'
  presentation_type: 'local' | 'canva' | 'images'

  // Local Deck
  slides?: PresentationSlide[]
  theme_id?: UUID

  // Canva
  video_source_id?: UUID
  original_canva_url?: string
  cues?: PresentationCue[]
}

export interface PresentationSlide {
  id: UUID
  type: 'text' | 'image' | 'video'
  content: string // HTML or Asset Path
  notes?: string
  media_source_id?: UUID
}

export interface PresentationCue {
  time_in: number
  time_hold: number
  time_out: number
}

// Union Type for usage
export type LibraryItem =
  | SongItem
  | ScriptureItem
  | VideoItem
  | ImageItem
  | AudioItem
  | PresentationItem

// ============ SETTINGS SCHEMA ============

export interface GlobalSettings {
  // Appearance
  theme: 'light' | 'dark'

  // Output Configuration
  outputs: {
    main: OutputSettings
    confidence: OutputSettings
    lower_thirds: OutputSettings
    mobile: OutputSettings
  }

  // Core Behavior
  default_transitions: {
    background: TransitionSettings
    lyrics: TransitionSettings
  }

  // Library Paths
  paths: {
    media_root: string
    data_root: string
  }
}

export interface OutputSettings {
  enabled: boolean
  fontFamily: string
  fontSize: number // rem
  lineHeight: number

  // Margins
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number

  // Styles
  textColor: string
  isAllCaps: boolean
  hasShadow: boolean
  shadowSettings?: {
    blur: number
    x: number
    y: number
  }
  hasOutline: boolean
  outlineSettings?: {
    width: number
    color: string
  }
}

export type TransitionType = 'none' | 'crossfade' | 'cut' | 'fade_to_black'

export interface TransitionSettings {
  type: TransitionType
  duration: number // seconds
}

// ============ RUNTIME STATE (Shared Types) ============

export interface AppState {
  // Navigation
  active_schedule_id: UUID | null

  // Playback Pointers
  preview: MediaStatePointer
  live: MediaStatePointer

  // Resources
  blackout_active: boolean
  clear_active: boolean
  logo_active: boolean

  // Access to data (optional populated fields)
  // In a real app, this might be fetched via API, but we keep some state here
}

export interface MediaStatePointer {
  item_id: UUID | null
  slide_index: number
  media_position: number // seconds (for videos)
  is_playing: boolean
}
