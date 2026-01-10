// ============ SHARED STATE ============
// This state is synchronized across all connected clients
export const sharedState = {
    liveSong: null,
    liveVariation: 0,
    livePosition: { partIndex: 0, slideIndex: 0 },
    backgroundVideo: '/public/videos/background.mp4',
    logoMedia: '/public/videos/logo.mp4',
    displayMode: 'clear', // 'lyrics' | 'logo' | 'black' | 'clear'
    displaySettings: {
        fontSize: 3.5,
        fontFamily: 'system-ui',
        lineHeight: 1.5,
        textColor: '#ffffff',
        allCaps: false,
        textShadow: true,
        shadowBlur: 4,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        textOutline: false,
        outlineWidth: 2,
        outlineColor: '#000000',
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 5,
        marginRight: 5
    },
    confidenceMonitorSettings: {
        fontSize: 2.5,
        fontFamily: 'system-ui',
        lineHeight: 1.4,
        prevNextOpacity: 0.35
    }
}

// Track connected clients
export const connectedClients = new Map()
