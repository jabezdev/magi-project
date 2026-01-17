import { api } from '../../services/api'
import { v4 as uuidv4 } from 'uuid'
import { store } from '../../state/store'
import { ICONS } from '../../constants/icons'
import { MediaType } from '../../types'
import { showToast } from './ConfirmModal'

export class YouTubeImportModal {
    element: HTMLElement
    videoId: string | null = null
    title: string = ''
    duration: number = 0 // Seconds
    trimStart: number = 0
    trimEnd: number = 0

    constructor() {
        this.element = document.createElement('div')
        this.element.className = 'fixed inset-0 z-50 bg-[#09090b] flex items-center justify-center p-4'
        this.render()
        document.body.appendChild(this.element)
    }

    render() {
        this.element.innerHTML = `
            <div class="bg-[#18181b] w-full max-w-2xl rounded-xl border border-zinc-800 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
                <!-- Header -->
                <div class="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#18181b]">
                     <h2 class="text-lg font-bold text-white flex items-center gap-2">
                        <span class="text-red-600 w-6 h-6">${ICONS.youtube}</span> YouTube Import
                     </h2>
                     <button id="btn-close" class="text-zinc-400 hover:text-white w-6 h-6">
                        ${ICONS.close}
                     </button>
                </div>

                <!-- Body -->
                <div class="p-6 flex flex-col gap-6 overflow-y-auto">
                    <!-- URL Input -->
                    <div class="flex gap-2">
                        <input type="text" id="input-url" class="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-red-600 placeholder-zinc-600" placeholder="Paste YouTube URL (e.g. https://youtu.be/...)" />
                        <button id="btn-fetch" class="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm border border-zinc-700 transition-colors">Fetch</button>
                    </div>

                    <!-- Preview Area (Hidden initially) -->
                    <div id="preview-section" class="hidden flex-col gap-4">
                         <div id="player-container" class="aspect-video bg-black rounded-lg overflow-hidden relative">
                            <!-- Iframe mounts here -->
                         </div>
                         
                         <div>
                            <label class="text-xs text-zinc-500 uppercase font-bold mb-1 block">Title</label>
                            <input type="text" id="input-title" class="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white" />
                         </div>

                         <!-- Trim Range Slider -->
                         <div>
                             <label class="text-xs text-zinc-500 uppercase font-bold mb-2 block">Trim Range</label>
                             <div class="relative h-8 bg-zinc-900 rounded-lg border border-zinc-700">
                                 <input type="range" id="input-start" min="0" max="100" value="0" 
                                     class="absolute w-full h-full opacity-50 cursor-pointer" style="pointer-events: auto;" />
                                 <input type="range" id="input-end" min="0" max="100" value="100" 
                                     class="absolute w-full h-full opacity-50 cursor-pointer" style="pointer-events: auto;" />
                                 <div class="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                                     <span id="trim-start-display" class="text-xs text-green-400 font-mono">0:00</span>
                                     <span id="trim-end-display" class="text-xs text-red-400 font-mono">0:00</span>
                                 </div>
                             </div>
                             <div class="flex justify-between text-[10px] text-zinc-600 mt-1">
                                 <span>Start</span>
                                 <span id="duration-display">Duration: --:--</span>
                                 <span>End</span>
                             </div>
                         </div>
                    </div>

                    <div id="status-msg" class="text-center text-sm text-zinc-500 hidden"></div>
                </div>

                <!-- Footer -->
                <div class="h-16 border-t border-zinc-800 flex items-center justify-end px-6 bg-[#18181b] gap-2">
                    <button id="btn-cancel" class="text-zinc-400 hover:text-white text-sm px-4">Cancel</button>
                    <button id="btn-import" class="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                        Import Video
                    </button>
                </div>
            </div>
        `

        // Bindings
        this.element.querySelector('#btn-close')?.addEventListener('click', () => this.close())
        this.element.querySelector('#btn-cancel')?.addEventListener('click', () => this.close())
        this.element.querySelector('#btn-fetch')?.addEventListener('click', () => this.fetchVideo())
        this.element.querySelector('#btn-import')?.addEventListener('click', () => this.importVideo())
    }

    async fetchVideo() {
        const urlInput = this.element.querySelector('#input-url') as HTMLInputElement
        const status = this.element.querySelector('#status-msg')!
        const preview = this.element.querySelector('#preview-section')!
        const btnImport = this.element.querySelector('#btn-import') as HTMLButtonElement

        const url = urlInput.value.trim()
        if (!url) return

        status.textContent = 'Fetching metadata...'
        status.classList.remove('hidden')
        preview.classList.add('hidden')

        try {
            // Mock API or regex extraction
            // Simple ID extraction
            const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
            if (!videoIdMatch) throw new Error('Invalid YouTube URL')

            this.videoId = videoIdMatch[1]

            // Fetch Metadata from Server
            const meta = await api.youtube.getMeta(url)

            this.title = meta.title
            this.duration = meta.duration
            this.trimStart = 0
            this.trimEnd = this.duration

            // UPDATE UI
            status.classList.add('hidden')
            preview.classList.remove('hidden')
            preview.classList.add('flex')

            const titleInput = this.element.querySelector('#input-title') as HTMLInputElement
            titleInput.value = this.title

            const startInput = this.element.querySelector('#input-start') as HTMLInputElement
            startInput.value = '0'

            const endInput = this.element.querySelector('#input-end') as HTMLInputElement
            endInput.value = this.duration.toString()

            // Embed Player
            const playerContainer = this.element.querySelector('#player-container')!
            playerContainer.innerHTML = `
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/${this.videoId}" 
                    title="YouTube video player" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                ></iframe>
            `

            btnImport.disabled = false

            // Update slider displays
            this.updateTrimDisplays()

            // Slider handlers
            const startSlider = this.element.querySelector('#input-start') as HTMLInputElement
            const endSlider = this.element.querySelector('#input-end') as HTMLInputElement

            startSlider.max = this.duration.toString()
            startSlider.value = '0'
            endSlider.max = this.duration.toString()
            endSlider.value = this.duration.toString()

            startSlider.addEventListener('input', () => this.updateTrimDisplays())
            endSlider.addEventListener('input', () => this.updateTrimDisplays())

        } catch (e: any) {
            status.textContent = 'Error: ' + e.message
        }
    }

    async importVideo() {
        if (!this.videoId) return

        const titleInput = this.element.querySelector('#input-title') as HTMLInputElement
        const startInput = this.element.querySelector('#input-start') as HTMLInputElement
        const endInput = this.element.querySelector('#input-end') as HTMLInputElement

        const newItem = {
            id: uuidv4(),
            type: 'video' as MediaType,
            video_subtype: 'youtube' as const,  // YouTube videos
            title: titleInput.value,
            tags: ['YouTube', 'Video'],
            // Specific fields for video
            source_url: `https://www.youtube.com/watch?v=${this.videoId}`,
            duration_total: this.duration,
            trim_start: parseInt(startInput.value) || 0,
            trim_end: parseInt(endInput.value) || this.duration,
            is_youtube: true,
            file_hash: 'youtube-ref-' + this.videoId, // Pseudo hash
            volume_multiplier: 1.0,
            is_loop: false
        }

        try {
            await api.library.create(newItem)
            await store.refreshLibrary()
            this.close()
        } catch (e: any) {
            showToast({ message: 'Error creating item: ' + e.message, type: 'error' })
        }
    }

    updateTrimDisplays() {
        const startSlider = this.element.querySelector('#input-start') as HTMLInputElement
        const endSlider = this.element.querySelector('#input-end') as HTMLInputElement
        const startDisplay = this.element.querySelector('#trim-start-display')!
        const endDisplay = this.element.querySelector('#trim-end-display')!
        const durationDisplay = this.element.querySelector('#duration-display')!

        const start = parseInt(startSlider.value) || 0
        const end = parseInt(endSlider.value) || this.duration
        const trimDuration = end - start

        startDisplay.textContent = this.formatTime(start)
        endDisplay.textContent = this.formatTime(end)
        durationDisplay.textContent = `Duration: ${this.formatTime(trimDuration)}`
    }

    formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    close() {
        this.element.remove()
    }
}

export function openYouTubeImportModal() {
    new YouTubeImportModal()
}
