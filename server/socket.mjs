import { sharedState, connectedClients } from './state.mjs'

export function setupSocket(io) {
    // ============ SOCKET.IO EVENTS ============
    io.on('connection', (socket) => {
        console.log('🔌 User connected:', socket.id)
        connectedClients.set(socket.id, { connectedAt: new Date() })

        // Send current state to newly connected client
        socket.emit('state-sync', {
            liveSong: sharedState.liveSong,
            liveVariation: sharedState.liveVariation,
            livePosition: sharedState.livePosition,
            backgroundVideo: sharedState.backgroundVideo,
            logoMedia: sharedState.logoMedia,
            displayMode: sharedState.displayMode,
            displaySettings: sharedState.displaySettings,
            confidenceMonitorSettings: sharedState.confidenceMonitorSettings,
            availableVideos: sharedState.availableVideos
        })

        socket.on('disconnect', () => {
            console.log('❌ User disconnected:', socket.id)
            connectedClients.delete(socket.id)
        })

        // Request current state explicitly
        socket.on('request-state', () => {
            console.log('📤 Sending state to:', socket.id)
            socket.emit('state-sync', {
                liveSong: sharedState.liveSong,
                liveVariation: sharedState.liveVariation,
                livePosition: sharedState.livePosition,
                backgroundVideo: sharedState.backgroundVideo,
                logoMedia: sharedState.logoMedia,
                displayMode: sharedState.displayMode,
                displaySettings: sharedState.displaySettings,
                confidenceMonitorSettings: sharedState.confidenceMonitorSettings,
                availableVideos: sharedState.availableVideos
            })
        })

        // Update current slide (go live)
        socket.on('update-slide', (data) => {
            console.log('📝 Updating slide:', data.song?.title, 'position:', JSON.stringify(data.position))
            sharedState.liveSong = data.song
            sharedState.liveVariation = data.variation
            sharedState.livePosition = data.position
            io.emit('slide-updated', data)
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
