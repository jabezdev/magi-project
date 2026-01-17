
import { audioService, AudioChannel } from '../services/AudioService'

export class AudioMixerPanel {
    element: HTMLElement
    channels: AudioChannel[] = []

    constructor() {
        this.element = document.createElement('div')
        this.element.className = 'flex flex-col h-full bg-gray-900 border-t border-b border-gray-800'

        // Subscribe to Audio Service
        audioService.subscribe((channels) => {
            this.channels = channels
            this.render()
        })

        // Initial render happens in subscribe callback
    }

    render() {
        // Only render active channels (those with a source attached, or default slots we keeping visible)
        // User requested: "Only put the faders for the things that are playing/loaded. No need for faders not used."
        const activeChannels = this.channels.filter(ch => !!ch.source || ['bgm', 'pads', 'sfx'].includes(ch.id))

        this.element.innerHTML = `
            <div class="panel-header bg-[#1a1a1a] text-xs font-bold text-gray-400 px-2 py-1 border-b border-gray-800 flex justify-between items-center h-8">
                <span>AUDIO MIXER</span>
                <div class="flex items-center gap-2">
                    <button id="btn-ducking" class="text-[10px] px-2 py-0.5 bg-gray-800 text-gray-500 hover:text-white" title="Auto-duck BGM when lyrics active">
                        DUCK [AUTO]
                    </button>
                    <span class="w-2 h-2 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                </div>
            </div>
            
            <div class="flex-1 flex items-end justify-start px-4 py-4 bg-[#111] overflow-x-auto gap-4 custom-scrollbar">
                ${activeChannels.map(ch => this.renderChannel(ch)).join('')}
                
                <!-- Master Section (Fixed Right) -->
                <div class="border-l border-gray-700 h-full mx-2"></div>
                ${this.renderMasterFader()}
            </div>

            <div class="bg-[#0a0a0a] border-t border-gray-800 flex shrink-0">
                <button id="btn-load-audio" class="text-[10px] text-gray-500 hover:text-white px-2 py-1 bg-gray-900 border-r border-gray-800 hover:bg-gray-800 flex-1">+ Load Track</button>
            </div>
        `

        this.attachEventListeners()
    }

    renderChannel(ch: AudioChannel) {
        const isPlaying = ch.source && !ch.source.paused
        // Heuristic: If it has source, show play button. If it's a "slot" without source, show disabled.

        return `
            <div class="flex flex-col items-center h-full gap-2 w-10 py-1 shrink-0 group">
                <button class="w-6 h-6 rounded text-[10px] flex items-center justify-center ${isPlaying ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-500'} ${ch.source ? 'hover:bg-gray-700' : 'opacity-50 cursor-default'}" 
                        data-action="toggle-play" data-id="${ch.id}">
                    ${isPlaying ? '⏸' : '▶'}
                </button>
                
                <div class="flex-1 w-full flex justify-center h-0 min-h-[60px] relative">
                     <!-- Ducking Indicator -->
                     ${ch.isDucked ? '<div class="absolute inset-0 bg-yellow-500/10 pointer-events-none rounded"></div>' : ''}
                    
                    <input type="range" orient="vertical" min="0" max="1" step="0.01" value="${ch.volume}" 
                        class="volume-slider h-full w-4 accent-blue-500 cursor-pointer" data-id="${ch.id}" 
                        style="writing-mode: vertical-lr; direction: rtl; appearance: slider-vertical;" />
                </div>
                
                <div class="flex flex-col items-center gap-0.5">
                    <div class="text-[9px] font-bold tracking-wider ${ch.muted ? 'text-red-500' : 'text-gray-400'} truncate max-w-[60px]" title="${ch.label}">${ch.label}</div>
                    <button class="text-[8px] px-1 rounded ${ch.muted ? 'bg-red-900 text-white' : 'bg-gray-800 text-gray-500 hover:text-white'}" data-action="toggle-mute" data-id="${ch.id}">
                        ${ch.muted ? 'MUTED' : 'MUTE'}
                    </button>
                </div>
            </div>
        `
    }

    renderMasterFader() {
        return `
             <div class="flex flex-col items-center h-full gap-2 w-10 py-1 shrink-0">
                <div class="w-6 h-6 flex items-center justify-center text-red-500 text-[10px] font-bold">M</div>
                
                <div class="flex-1 w-full flex justify-center h-0 min-h-[60px]">
                    <input type="range" orient="vertical" min="0" max="1" step="0.01" value="${audioService.getMasterVolume()}" 
                        id="master-slider" class="h-full w-4 accent-red-600 cursor-pointer" 
                        style="writing-mode: vertical-lr; direction: rtl; appearance: slider-vertical;" />
                </div>
                
                <div class="text-[9px] font-bold tracking-wider text-red-500">MST</div>
            </div>
        `
    }

    attachEventListeners() {
        // Sliders
        this.element.querySelectorAll('.volume-slider').forEach((slider: any) => {
            slider.addEventListener('input', (e: any) => {
                audioService.setChannelVolume(slider.dataset.id, parseFloat(e.target.value))
            })
        })

        const masterSlider = this.element.querySelector('#master-slider') as HTMLInputElement
        if (masterSlider) {
            masterSlider.addEventListener('input', (e: any) => {
                audioService.setMasterVolume(parseFloat(e.target.value))
            })
        }

        // Buttons
        this.element.querySelectorAll('button[data-action="toggle-mute"]').forEach((btn: any) => {
            btn.addEventListener('click', () => {
                audioService.toggleMute(btn.dataset.id)
            })
        })

        this.element.querySelectorAll('button[data-action="toggle-play"]').forEach((btn: any) => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id
                const ch = this.channels.find(c => c.id === id)
                if (ch && ch.source) {
                    if (ch.source.paused) ch.source.play()
                    else ch.source.pause()
                    this.render() // Play state changed
                }
            })
        })

        // Load Audio
        this.element.querySelector('#btn-load-audio')?.addEventListener('click', () => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'audio/*'
            input.onchange = (e: any) => {
                const file = e.target.files?.[0]
                if (file) {
                    const url = URL.createObjectURL(file)
                    const audio = new Audio(url)
                    // Create ID based on timestamp to allow multiples
                    const id = 'track-' + Date.now()
                    audioService.registerChannel(id, file.name.substring(0, 8))
                    audioService.assignSource(id, audio)
                    // Auto play
                    audio.play()
                    this.render()
                }
            }
            input.click()
        })

        // Ducking Toggle (Currently mock UI for automatic ducking state)
        // Real implementation would wire this to a global setting in store
    }
}
