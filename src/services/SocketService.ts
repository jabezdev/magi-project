import { io, Socket } from 'socket.io-client';
import { LibraryItem, MediaState, GlobalSettings } from '../types';

// Detect URL: In dev (Vite), we might need to point to :3000 explicitly if not proxied.
// In Prod (or served by express), relative path works best.
const getSocketUrl = () => {
    // If we are on same origin (served by Express), use relative
    if (import.meta.env.PROD) {
        return window.location.origin;
    }
    // In Dev, Vite is on 5173, Server on 3000
    return window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : `http://${window.location.hostname}:3000`;
};

class SocketService {
    private socket: Socket;

    constructor() {
        const url = getSocketUrl();


        this.socket = io(url, {
            transports: ['websocket', 'polling'], // Try websocket first
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        this.setupListeners();
    }

    private setupListeners() {
        this.socket.on('connect', () => {

            this.socket.emit('request-state'); // Ask for full state on connect
        });

        this.socket.on('disconnect', () => {

        });

        this.socket.on('connect_error', (err) => {
            console.error('[Socket] Connection Error:', err);
        });
    }

    // ============ ACTIONS (EMIT) ============

    emitSlideUpdate(
        item: LibraryItem | null,
        content: any[],
        position: number,
        mediaState?: any
    ) {
        this.socket.emit('update-slide', {
            item,
            content,
            position,
            mediaState // Optional, mostly for initializing
        });
    }

    emitPreviewUpdate(item: LibraryItem | null, content: any[], position: number) {
        this.socket.emit('update-preview', {
            item,
            content,
            position
        });
    }

    emitMediaState(state: Partial<MediaState>) {
        // Debounce or verify this isn't spamming
        this.socket.emit('update-media-state', state);
    }

    emitDisplayMode(mode: 'normal' | 'black' | 'clear' | 'logo') {
        this.socket.emit('update-display-mode', { mode });
    }

    emitLogoUpdate(logo: any) {
        this.socket.emit('update-logo', { logo });
    }

    emitVideoUpdate(video: any) {
        this.socket.emit('update-video', { video });
    }

    // ============ LISTENERS (ON) ============

    onStateSync(callback: (data: any) => void) {
        this.socket.on('state-sync', callback);
    }

    onSlideUpdated(callback: (data: any) => void) {
        this.socket.on('slide-updated', callback);
    }

    onPreviewUpdated(callback: (data: any) => void) {
        this.socket.on('preview-updated', callback);
    }

    onMediaStateUpdated(callback: (state: MediaState) => void) {
        this.socket.on('media-state-updated', callback);
    }

    onDisplayModeUpdated(callback: (data: { mode: string }) => void) {
        this.socket.on('display-mode-updated', callback);
    }

    onSettingsUpdated(callback: (data: { settings: GlobalSettings }) => void) {
        this.socket.on('display-settings-updated', callback);
    }
}

export const socketService = new SocketService();
