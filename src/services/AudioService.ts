


export interface AudioChannel {
    id: string
    label: string
    source?: HTMLAudioElement | HTMLVideoElement // Can be audio file or video element
    volume: number
    muted: boolean
    isDucked: boolean
}

class AudioService {
    private channels: Map<string, AudioChannel> = new Map()
    private masterVolume: number = 0.8
    private isDuckingComponents: boolean = false
    private duckingAmount: number = 0.3
    private listeners: ((channels: AudioChannel[]) => void)[] = []

    constructor() {
        // Initialize default channels
        this.registerChannel('bgm', 'BGM')
        this.registerChannel('pads', 'PADS')
        this.registerChannel('sfx', 'SFX')
    }

    /**
     * Registers a new audio channel slot.
     */
    registerChannel(id: string, label: string) {
        if (!this.channels.has(id)) {
            this.channels.set(id, {
                id,
                label,
                volume: 0.5,
                muted: false,
                isDucked: false
            })
            this.notifyListeners()
        }
    }

    /**
     * Assigns a media element source to a channel.
     * This allows us to control the volume/playback of the element centrally.
     */
    assignSource(channelId: string, element: HTMLAudioElement | HTMLVideoElement) {
        const channel = this.channels.get(channelId)
        if (channel) {
            channel.source = element
            this.updateElementVolume(channel)
            this.notifyListeners()
        }
    }

    removeSource(channelId: string) {
        const channel = this.channels.get(channelId)
        if (channel) {
            channel.source = undefined
            this.notifyListeners()
        }
    }

    /**
     * Set volume for a specific channel (0-1)
     */
    setChannelVolume(channelId: string, volume: number) {
        const channel = this.channels.get(channelId)
        if (channel) {
            channel.volume = Math.max(0, Math.min(1, volume))
            this.updateElementVolume(channel)
            this.notifyListeners()
        }
    }

    setMasterVolume(volume: number) {
        this.masterVolume = Math.max(0, Math.min(1, volume))
        this.channels.forEach(ch => this.updateElementVolume(ch))
        this.notifyListeners()
    }

    toggleMute(channelId: string) {
        const channel = this.channels.get(channelId)
        if (channel) {
            channel.muted = !channel.muted
            this.updateElementVolume(channel)
            this.notifyListeners()
        }
    }

    /**
     * Ducking Logic:
     * When "Live Slide" is active (lyrics are shown), we might want to duck BGM.
     */
    setDuckingState(active: boolean) {
        if (this.isDuckingComponents !== active) {
            this.isDuckingComponents = active

            // Apply ducking to music channels (BGM/PADS)
            // In a real app we'd have a 'type' for channel, here we hardcode IDs
            const duckIds = ['bgm', 'pads']

            duckIds.forEach(id => {
                const ch = this.channels.get(id)
                if (ch) {
                    ch.isDucked = active
                    this.updateElementVolume(ch)
                }
            })
            this.notifyListeners()
        }
    }

    /**
     * Updates the actual DOM element volume based on internal state
     */
    private updateElementVolume(channel: AudioChannel) {
        if (!channel.source) return

        let finalVolume = channel.volume * this.masterVolume

        if (channel.muted) {
            finalVolume = 0
        } else if (channel.isDucked) {
            finalVolume = finalVolume * this.duckingAmount
        }

        channel.source.volume = finalVolume
    }

    getChannels(): AudioChannel[] {
        return Array.from(this.channels.values())
    }

    getMasterVolume(): number {
        return this.masterVolume
    }

    subscribe(listener: (channels: AudioChannel[]) => void) {
        this.listeners.push(listener)
        listener(this.getChannels()) // Initial callback
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener)
        }
    }

    private notifyListeners() {
        const list = this.getChannels()
        this.listeners.forEach(l => l(list))
    }
}

export const audioService = new AudioService()
