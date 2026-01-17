import { sharedState, connectedClients } from './state.mjs'

export function setupSocket(io) {
    // ============ SOCKET.IO EVENTS ============
    io.on('connection', (socket) => {
        console.log('🔌 User connected:', socket.id)
        connectedClients.set(socket.id, { connectedAt: new Date() })

        // Send current state to newly connected client
        socket.emit('state-sync', {
            liveItem: sharedState.liveItem,
            liveContent: sharedState.liveContent,
            livePosition: sharedState.livePosition,
            liveMediaState: sharedState.liveMediaState,

            previousLiveItem: sharedState.previousLiveItem,
            previousLivePosition: sharedState.previousLivePosition,

            previewItem: sharedState.previewItem,
            previewPosition: sharedState.previewPosition,

            backgroundVideo: sharedState.backgroundVideo,
            logoMedia: sharedState.logoMedia,
            displayMode: sharedState.displayMode,
            displaySettings: sharedState.displaySettings,
            confidenceMonitorSettings: sharedState.confidenceMonitorSettings,
            availableMedia: sharedState.availableMedia,
            availableSlides: sharedState.availableSlides,
            availableScriptures: sharedState.availableScriptures
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
                liveContent: sharedState.liveContent,
                livePosition: sharedState.livePosition,
                liveMediaState: sharedState.liveMediaState,

                previousLiveItem: sharedState.previousLiveItem,
                previousLivePosition: sharedState.previousLivePosition,

                previewItem: sharedState.previewItem,
                previewPosition: sharedState.previewPosition,

                backgroundVideo: sharedState.backgroundVideo,
                logoMedia: sharedState.logoMedia,
                displayMode: sharedState.displayMode,
                displaySettings: sharedState.displaySettings,
                confidenceMonitorSettings: sharedState.confidenceMonitorSettings,
                availableMedia: sharedState.availableMedia,
                availableSlides: sharedState.availableSlides,
                availableScriptures: sharedState.availableScriptures
            })
        })

        // Update current slide (go live)
        socket.on('update-slide', (data) => {
            console.log('📝 Updating slide/item:', data.item?.type || 'unknown', 'position:', data.position)

            // Capture previous state if item is changing
            if (data.item && sharedState.liveItem && data.item.id !== sharedState.liveItem.id) {
                sharedState.previousLiveItem = sharedState.liveItem
                sharedState.previousLivePosition = sharedState.livePosition
            }

            // Update unified state
            sharedState.liveItem = data.item || null
            sharedState.liveContent = data.content || []
            sharedState.livePosition = typeof data.position === 'number' ? data.position : 0

            // Reset media state on new item
            if (data.item?.type !== 'song' && (!sharedState.liveItem || sharedState.liveItem.id !== data.item.id)) {
                sharedState.liveMediaState = { isPlaying: true, currentTime: 0, duration: 0, isCanvaHolding: false }
            }

            // Emit unified state for proper sync
            io.emit('slide-updated', {
                item: sharedState.liveItem,
                content: sharedState.liveContent,
                position: sharedState.livePosition,
                liveMediaState: sharedState.liveMediaState,

                previousItem: sharedState.previousLiveItem,
                previousPosition: sharedState.previousLivePosition
            })
        })

        // Update preview item
        socket.on('update-preview', (data) => {
            sharedState.previewItem = data.item
            sharedState.previewContent = data.content || []
            sharedState.previewPosition = typeof data.position === 'number' ? data.position : 0

            io.emit('preview-updated', data)
        })

        // Update media playback state (from MainProjection)
        socket.on('update-media-state', (data) => {
            sharedState.liveMediaState = { ...sharedState.liveMediaState, ...data }
            // Broadcast to others (Control Panel, Confidence Monitor)
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
