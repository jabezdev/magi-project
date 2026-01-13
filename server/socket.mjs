import { sharedState, connectedClients } from './state.mjs'

export function setupSocket(io) {
    // ============ SOCKET.IO EVENTS ============
    io.on('connection', (socket) => {
        console.log('🔌 User connected:', socket.id)
        connectedClients.set(socket.id, { connectedAt: new Date() })

        // Send current state to newly connected client
        // Send current state to newly connected client
        socket.emit('state-sync', {
            liveItem: sharedState.liveItem, // New
            liveSong: sharedState.liveSong,
            liveVariation: sharedState.liveVariation,
            livePosition: sharedState.livePosition,
            liveMediaState: sharedState.liveMediaState, // New

            previousLiveItem: sharedState.previousLiveItem, // New
            previousLiveSong: sharedState.previousLiveSong,
            previousLiveVariation: sharedState.previousLiveVariation,
            previousLivePosition: sharedState.previousLivePosition,

            previewItem: sharedState.previewItem, // New
            previewSong: sharedState.previewSong,
            previewVariation: sharedState.previewVariation,
            previewPosition: sharedState.previewPosition,

            backgroundVideo: sharedState.backgroundVideo,
            logoMedia: sharedState.logoMedia,
            displayMode: sharedState.displayMode,
            displaySettings: sharedState.displaySettings,
            confidenceMonitorSettings: sharedState.confidenceMonitorSettings,
            availableVideos: sharedState.availableVideos,
            availableMedia: sharedState.availableMedia, // New
            availableSlides: sharedState.availableSlides, // New
            availableScriptures: sharedState.availableScriptures // New
        })

        socket.on('disconnect', () => {
            console.log('❌ User disconnected:', socket.id)
            connectedClients.delete(socket.id)
        })

        // Request current state explicitly
        socket.on('request-state', () => {
            console.log('📤 Sending state to:', socket.id)
            socket.emit('state-sync', {
                liveItem: sharedState.liveItem,
                liveSong: sharedState.liveSong,
                liveVariation: sharedState.liveVariation,
                livePosition: sharedState.livePosition,
                liveMediaState: sharedState.liveMediaState,

                previousLiveItem: sharedState.previousLiveItem,
                previousLiveSong: sharedState.previousLiveSong,
                previousLiveVariation: sharedState.previousLiveVariation,
                previousLivePosition: sharedState.previousLivePosition,

                previewItem: sharedState.previewItem,
                previewSong: sharedState.previewSong,
                previewVariation: sharedState.previewVariation,
                previewPosition: sharedState.previewPosition,

                backgroundVideo: sharedState.backgroundVideo,
                logoMedia: sharedState.logoMedia,
                displayMode: sharedState.displayMode,
                displaySettings: sharedState.displaySettings,
                confidenceMonitorSettings: sharedState.confidenceMonitorSettings,
                availableVideos: sharedState.availableVideos,
                availableMedia: sharedState.availableMedia,
                availableSlides: sharedState.availableSlides,
                availableScriptures: sharedState.availableScriptures
            })
        })

        // Update current slide (go live)
        socket.on('update-slide', (data) => {
            console.log('📝 Updating slide/item:', data.item?.type || 'song', 'position:', JSON.stringify(data.position))

            // Capture generic previous state
            if (data.item && sharedState.liveItem && data.item.id !== sharedState.liveItem.id) {
                sharedState.previousLiveItem = sharedState.liveItem
            }

            // If the song is changing (legacy support), capture the previous state
            if (data.song && sharedState.liveSong && data.song.id !== sharedState.liveSong.id) {
                sharedState.previousLiveSong = sharedState.liveSong
                sharedState.previousLiveVariation = sharedState.liveVariation
                sharedState.previousLivePosition = { ...sharedState.livePosition }
            }

            // Update generic state
            sharedState.liveItem = data.item || null
            // Reset media state on new item
            if (data.item?.type !== 'song' && (!sharedState.liveItem || sharedState.liveItem.id !== data.item.id)) {
                sharedState.liveMediaState = { isPlaying: true, currentTime: 0, duration: 0, isCanvaHolding: false }
            }

            // Update legacy song state
            sharedState.liveSong = data.song
            sharedState.liveVariation = data.variation
            sharedState.livePosition = data.position

            // Emit all relevant state for proper sync
            io.emit('slide-updated', {
                item: data.item,
                song: data.song,
                variation: data.variation,
                position: data.position,
                liveMediaState: sharedState.liveMediaState,

                previousItem: sharedState.previousLiveItem,
                previousSong: sharedState.previousLiveSong,
                previousVariation: sharedState.previousLiveVariation,
                previousPosition: sharedState.previousLivePosition
            })
        })

        // Update preview item/song
        socket.on('update-preview', (data) => {
            sharedState.previewItem = data.item
            sharedState.previewSong = data.song
            sharedState.previewVariation = data.variation
            sharedState.previewPosition = data.position
            io.emit('preview-updated', data)
        })

        // Update media playback state (from MainProjection)
        socket.on('update-media-state', (data) => {
            sharedState.liveMediaState = { ...sharedState.liveMediaState, ...data }
            // Broadcast to others (Control Panel, Confidence Monitor)
            // exclude sender? No, sender is MainProjection, others need it.
            socket.broadcast.emit('media-state-updated', sharedState.liveMediaState)
        })

        // Update video background
        socket.on('update-video', (data) => {
            console.log('🎬 Updating video:', data.video)
            sharedState.backgroundVideo = data.video
            io.emit('video-updated', data)
        })

        // Update display mode (lyrics, logo, black, clear)
        socket.on('update-display-mode', (data) => {
            console.log('📺 Display mode:', data.mode)
            sharedState.displayMode = data.mode
            io.emit('display-mode-updated', data)
        })

        // Update logo media
        socket.on('update-logo', (data) => {
            console.log('🖼️ Logo updated:', data.logo)
            sharedState.logoMedia = data.logo
            io.emit('logo-updated', data)
        })

        // Update display settings (font, size, margins) - Main Screen
        socket.on('update-display-settings', (data) => {
            console.log('⚙️ Main screen display settings updated')
            sharedState.displaySettings = data.settings
            io.emit('display-settings-updated', data)
        })

        // Update confidence monitor settings
        socket.on('update-confidence-monitor-settings', (data) => {
            console.log('⚙️ Confidence monitor settings updated')
            sharedState.confidenceMonitorSettings = data.settings
            io.emit('confidence-monitor-settings-updated', data)
        })

        // Show/hide margin markers on projection screens
        socket.on('show-margin-markers', (data) => {
            io.emit('margin-markers', data)
        })
    })
}
