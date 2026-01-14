/**
 * Socket.io Service
 * 
 * Handles real-time communication between screens
 */

import { io, Socket } from 'socket.io-client'
import type { AppState, SlideUpdate, VideoUpdate, DisplayModeUpdate, DisplaySettings, ConfidenceMonitorSettings } from '../types'

type StateUpdateCallback = (state: Partial<AppState>) => void

class SocketService {
  private socket: Socket
  private stateUpdateCallbacks: StateUpdateCallback[] = []

  constructor() {
    this.socket = io()
    this.setupListeners()
  }

  private setupListeners(): void {
    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server:', this.socket.id)
      // Request current state when connecting
      this.socket.emit('request-state')
    })

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server')
    })

    this.socket.on('slide-updated', (data: SlideUpdate & { previousItem?: any, previousSong?: any, previousVariation?: number, previousPosition?: any, liveMediaState?: any }) => {
      this.notifyStateUpdate({
        liveSong: data.song,
        liveVariation: data.variation,
        livePosition: data.position,
        liveItem: data.item, // New: Sync generic item
        liveMediaState: data.liveMediaState, // New: Sync media state

        previousLiveItem: data.previousItem ?? null, // New
        previousLiveSong: data.previousSong ?? null,
        previousLiveVariation: data.previousVariation ?? 0,
        previousLivePosition: data.previousPosition ?? { partIndex: 0, slideIndex: 0 }
      })
    })

    this.socket.on('video-updated', (data: VideoUpdate) => {
      this.notifyStateUpdate({
        backgroundVideo: data.video
      })
    })

    this.socket.on('media-state-updated', (data: any) => {
      this.notifyStateUpdate({
        liveMediaState: data
      })
    })

    this.socket.on('display-mode-updated', (data: DisplayModeUpdate) => {
      this.notifyStateUpdate({
        displayMode: data.mode
      })
    })

    this.socket.on('logo-updated', (data: { logo: string }) => {
      this.notifyStateUpdate({
        logoMedia: data.logo
      })
    })

    this.socket.on('display-settings-updated', (data: { settings: DisplaySettings }) => {
      this.notifyStateUpdate({
        displaySettings: data.settings
      })
    })

    this.socket.on('confidence-monitor-settings-updated', (data: { settings: ConfidenceMonitorSettings }) => {
      this.notifyStateUpdate({
        confidenceMonitorSettings: data.settings
      })
    })

    this.socket.on('preview-updated', (data: { song: any, variation: number, position: any }) => {
      this.notifyStateUpdate({
        previewSong: data.song,
        previewVariation: data.variation,
        previewPosition: data.position
      })
    })

    this.socket.on('state-sync', (state: Partial<AppState>) => {
      console.log('[Socket] Received state sync:', state)
      this.notifyStateUpdate(state)
    })
  }

  private notifyStateUpdate(state: Partial<AppState>): void {
    this.stateUpdateCallbacks.forEach(callback => callback(state))
  }

  /**
   * Subscribe to state updates
   */
  onStateUpdate(callback: StateUpdateCallback): () => void {
    this.stateUpdateCallbacks.push(callback)
    // Return unsubscribe function
    return () => {
      const index = this.stateUpdateCallbacks.indexOf(callback)
      if (index > -1) {
        this.stateUpdateCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Update the current slide (go live)
   */
  updateSlide(data: SlideUpdate): void {
    this.socket.emit('update-slide', data)
  }

  /**
   * Update the background video
   */
  updateVideo(video: string): void {
    this.socket.emit('update-video', { video })
  }

  /**
   * Update display mode (lyrics, logo, black, clear)
   */
  updateDisplayMode(mode: string): void {
    this.socket.emit('update-display-mode', { mode })
  }

  /**
   * Update logo media
   */
  updateLogo(logo: string): void {
    this.socket.emit('update-logo', { logo })
  }

  /**
   * Update display settings (font, size, margins) for Main Screen
   */
  updateDisplaySettings(settings: DisplaySettings): void {
    this.socket.emit('update-display-settings', { settings })
  }

  /**
   * Update confidence monitor settings
   */
  updateConfidenceMonitorSettings(settings: ConfidenceMonitorSettings): void {
    this.socket.emit('update-confidence-monitor-settings', { settings })
  }

  /**
   * Update media playback state (from MainProjection)
   */
  updateMediaState(state: { isPlaying?: boolean, currentTime?: number, duration?: number, isCanvaHolding?: boolean }): void {
    this.socket.emit('update-media-state', state)
  }

  /**
   * Request current state from server
   */
  requestState(): void {
    this.socket.emit('request-state')
  }

  /**
   * Emit a raw event to the server
   */
  emit(event: string, data?: unknown): void {
    this.socket.emit(event, data)
  }

  /**
   * Listen for a specific event
   */
  on(event: string, callback: (data: unknown) => void): void {
    this.socket.on(event, callback)
  }

  /**
   * Remove listener for a specific event
   */
  off(event: string, callback?: (data: unknown) => void): void {
    this.socket.off(event, callback)
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.socket.connected
  }

  /**
   * Get socket ID
   */
  get socketId(): string | undefined {
    return this.socket.id
  }
}

// Export singleton instance
export const socketService = new SocketService()
