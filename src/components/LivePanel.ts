import { store } from '../state/store'
import { LibraryItem } from '../types'
import { api } from '../services/api'

export class LivePanel {
    element: HTMLElement
    private currentItem: LibraryItem | null = null

    constructor() {
        this.element = document.createElement('div')
        this.element.className = 'flex flex-col h-full text-white border-l border-gray-800'

        // Initial Render
        this.renderShell()

        // Subscribe to Store
        // Subscribe to Store
        store.subscribe(state => {
            // Item Changed?
            if (state.live.item_id !== this.currentItem?.id) {
                if (state.live.item_id) {
                    this.loadItem(state.live.item_id)
                } else {
                    this.clear()
                }
            }
            // Slide Changed? (Re-render content to update highlights)
            // Ideally we'd just update classes, but re-render is cheap enough for text lists
            else if (state.live.item_id && state.live.slide_index !== undefined) {
                // Force re-render of current item to update highlights
                this.renderContent()
            }
        })
    }

    renderShell() {
        this.element.innerHTML = `
            <div class="panel-header bg-gray-900 border-b border-gray-700 flex h-12 select-none items-stretch">
                 <div class="px-4 flex items-center bg-gray-800 text-xs font-bold text-red-500 border-r border-gray-700 whitespace-nowrap tracking-wider h-full gap-2">
                    <span class="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.6)] animate-pulse"></span>
                    LIVE
                 </div>
                 <div class="flex-1 flex items-center justify-end bg-gray-900 h-full pl-2">
                    <div class="flex h-full text-[9px] font-bold">
                        <button id="btn-logo" class="output-btn w-14 h-full bg-gray-800 border-l border-gray-700 text-gray-400 hover:text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            <span>LOGO</span>
                        </button>
                        <button id="btn-black" class="output-btn w-14 h-full bg-gray-800 border-l border-gray-700 text-gray-400 hover:text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                            <span>BLACK</span>
                        </button>
                        <button id="btn-clear" class="output-btn w-14 h-full bg-gray-800 border-l border-gray-700 text-gray-400 hover:text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            <span>CLEAR</span>
                        </button>
                        <button id="btn-restore" class="output-btn w-14 h-full bg-gray-800 border-l border-gray-700 text-gray-400 hover:text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-colors">
                             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span>PLAY</span>
                        </button>
                    </div>
                 </div>
            </div>
            <div id="live-arrangement-strip" class="hidden bg-gray-900 border-b border-gray-800 px-2 py-1 gap-1 overflow-x-auto"></div>
            <div id="live-content" class="flex-1 flex flex-col items-center justify-center bg-black overflow-hidden relative">
                <div class="text-gray-700 text-sm">No live content</div>
            </div>
        `

        // Wire Output Controls with Toggle Logic
        const btnLogo = this.element.querySelector('#btn-logo') as HTMLElement
        const btnBlack = this.element.querySelector('#btn-black') as HTMLElement
        const btnClear = this.element.querySelector('#btn-clear') as HTMLElement
        const btnPlay = this.element.querySelector('#btn-restore') as HTMLElement

        const allBtns = [btnLogo, btnBlack, btnClear, btnPlay]

        const resetButtonStyles = () => {
            allBtns.forEach(btn => {
                if (btn) {
                    btn.classList.remove('bg-blue-600', 'text-white')
                    btn.classList.add('bg-gray-800', 'text-gray-400')
                }
            })
        }

        const setActive = (btn: HTMLElement | null) => {
            resetButtonStyles()
            if (btn) {
                btn.classList.remove('bg-gray-800', 'text-gray-400')
                btn.classList.add('bg-blue-600', 'text-white')
            }
        }

        // Simple click feedback: brief brightness flash
        const flashFeedback = (btn: HTMLElement) => {
            btn.classList.add('brightness-150')
            setTimeout(() => btn.classList.remove('brightness-150'), 100)
        }

        // Initialize state (assuming normal play start)
        setActive(btnPlay)

        btnBlack?.addEventListener('click', () => {
            flashFeedback(btnBlack)
            if (btnBlack.classList.contains('bg-blue-600')) {
                store.restore()
                setActive(btnPlay)
            } else {
                store.toggleBlack()
                setActive(btnBlack)
            }
        })

        btnClear?.addEventListener('click', () => {
            flashFeedback(btnClear)
            if (btnClear.classList.contains('bg-blue-600')) {
                store.restore()
                setActive(btnPlay)
            } else {
                store.clearOverlays()
                setActive(btnClear)
            }
        })

        btnLogo?.addEventListener('click', () => {
            flashFeedback(btnLogo)
            if (btnLogo.classList.contains('bg-blue-600')) {
                store.restore()
                setActive(btnPlay)
            } else {
                store.toggleLogo()
                setActive(btnLogo)
            }
        })

        btnPlay?.addEventListener('click', () => {
            flashFeedback(btnPlay)
            store.restore()
            setActive(btnPlay)
        })
    }

    async loadItem(id: string) {
        try {
            let item = store.library.find(i => i.id === id)
            if (!item) {
                item = await api.library.get(id)
            }
            this.currentItem = item
            this.renderContent()
        } catch (e) {
            console.error('Failed to load item for live', e)
        }
    }

    renderContent() {
        const container = this.element.querySelector('#live-content')
        if (!container || !this.currentItem) return

        container.innerHTML = ''
        const item = this.currentItem

        // Info Overlay
        const info = document.createElement('div')
        info.className = 'absolute top-2 left-2 bg-red-900/50 border border-red-900/50 bg-opacity-50 px-2 py-1 rounded text-xs text-red-200 z-10 pointer-events-none backdrop-blur-sm'
        info.innerHTML = `${item.title} <span class="opacity-75" > (${item.type})</span>`
        container.appendChild(info)

        // Reuse render logic? Or keep separate for specific "Live" behavior highlighting 
        // (For now simple placeholder replication of Preview logic)

        switch (item.type) {
            case 'song':
                this.renderSong(item as any, container)
                break
            case 'scripture':
                this.renderText(item as any, container)
                break
            case 'video':
            case 'image':
                this.renderMedia(item as any, container)
                break
            case 'presentation':
                this.renderPresentation(item as any, container)
                break
            default:
                container.innerHTML += `<div class="text-gray-500">Content not implemented for ${item.type}</div>`
        }
    }

    // TODO: Refactor these shared renderers into a "CardRenderer" helper
    renderSong(song: any, container: Element) {
        const wrapper = document.createElement('div')
        wrapper.className = 'w-full h-full overflow-y-auto p-4 space-y-2'

        // Determine Parts Order: Use Arrangement Sequence if exists, else Default Parts
        let slides: any[] = []

        if (song.arrangement && song.arrangement.length > 0) {
            // Map sequence UUIDs to actual part objects
            song.arrangement.forEach((partId: string) => {
                const part = song.parts.find((p: any) => p.id === partId)
                if (part) slides.push(part)
            })
        } else {
            // Default sequential
            slides = song.parts
        }

        // Render Cards
        slides.forEach((part: any, index: number) => {
            // Check slide index from store directly for highlighting
            const currentLiveIndex = store.state.live.slide_index
            const isActive = currentLiveIndex === index

            const div = document.createElement('div')
            div.id = `live-part-${index}`
            div.className = `p-3 rounded cursor-pointer text-sm border  ${isActive ? 'bg-red-900/40 border-red-500 ring-1 ring-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-gray-900/50 border-gray-800 hover:border-gray-600 hover:bg-gray-800'}`

            div.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                     <span class="text-xs font-bold ${isActive ? 'text-red-400' : 'text-gray-500'} uppercase tracking-wider">${part.label}</span>
                     ${isActive ? '<span class="text-[10px] bg-red-600 text-white px-1.5 rounded font-bold">LIVE</span>' : ''}
                </div>
                <div class="${isActive ? 'text-white text-lg font-medium' : 'text-gray-400'} whitespace-pre-wrap leading-relaxed">${part.lyrics}</div>
            `
            div.addEventListener('click', () => {
                store.setLiveSlide(index)
            })

            // Auto-scroll if active (on initial render)
            if (isActive) {
                setTimeout(() => div.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
            }

            wrapper.appendChild(div)
        })
        container.appendChild(wrapper)

        // Render Arrangement Strip
        this.renderArrangementStrip(song)
    }

    renderArrangementStrip(song: any) {
        const strip = this.element.querySelector('#live-arrangement-strip')
        if (!strip) return

        strip.classList.remove('hidden')
        strip.classList.add('flex')
        strip.innerHTML = ''

        // Determine parts order from arrangement or default
        let slides: any[] = []
        if (song.arrangement && song.arrangement.length > 0) {
            song.arrangement.forEach((partId: string) => {
                const part = song.parts.find((p: any) => p.id === partId)
                if (part) slides.push(part)
            })
        } else {
            slides = song.parts
        }

        // Color map for part types
        const colorMap: Record<string, string> = {
            'VERSE': 'bg-blue-600',
            'CHORUS': 'bg-red-600',
            'PRE-CHORUS': 'bg-purple-600',
            'BRIDGE': 'bg-orange-600',
            'INTRO': 'bg-teal-600',
            'OUTRO': 'bg-gray-600',
            'TAG': 'bg-yellow-600',
            'CODA': 'bg-pink-600'
        }

        slides.forEach((part: any, index: number) => {
            const isActive = store.state.live.slide_index === index
            const partType = (part.label || '').toUpperCase().split(' ')[0]
            const color = colorMap[partType] || 'bg-gray-600'

            const block = document.createElement('button')
            block.className = `px-2 py-0.5 rounded text-[10px] font-bold text-white  ${color} ${isActive ? 'ring-2 ring-red-400 scale-105' : 'opacity-60 hover:opacity-100'}`
            block.textContent = part.label || `S${index + 1}`
            block.addEventListener('click', () => store.setLiveSlide(index))
            strip.appendChild(block)
        })
    }

    renderMedia(media: any, container: Element) {
        const div = document.createElement('div')
        div.className = 'w-full h-full flex flex-col bg-black relative'

        if (media.type === 'video') {
            if (media.is_youtube && media.source_url.includes('youtube.com')) {
                let videoId = media.source_url.split('v=')[1]
                if (!videoId) videoId = media.file_hash.replace('youtube-ref-', '')

                // YouTube Embed (limited control)
                div.innerHTML = `
                    <div class="flex-1 relative">
                        <iframe 
                            id="yt-player"
                            width="100%" 
                            height="100%" 
                            src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&enablejsapi=1" 
                            title="YouTube video player" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen
                        ></iframe>
                        <div class="absolute bottom-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold ">ON AIR</div>
                    </div>
                    <div class="bg-gray-900 p-2 flex items-center gap-2 border-t border-gray-800">
                        <span class="text-gray-500 text-xs">YouTube Player - Limited Controls</span>
                    </div>
                `
            } else {
                // Local Video with Full Controls
                div.innerHTML = `
                    <div class="flex-1 relative overflow-hidden">
                        <video id="live-video" class="w-full h-full object-contain" autoplay>
                            <source src="${media.source_url}" type="video/mp4">
                        </video>
                        <div class="absolute bottom-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold  pointer-events-none">ON AIR</div>
                    </div>
                    <div class="bg-gray-900 p-3 flex items-center gap-3 border-t border-gray-800">
                        <button id="btn-play" class="w-10 h-10 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center text-white font-bold text-xl">▶</button>
                        <button id="btn-stop" class="w-8 h-8 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white font-bold">■</button>
                        <button id="btn-fade" class="px-3 py-1 rounded bg-yellow-700 hover:bg-yellow-600 text-white text-xs font-bold">FADE</button>
                        <div class="flex-1 flex flex-col gap-1">
                            <input type="range" id="video-progress" class="w-full h-1 bg-gray-700 rounded-lg cursor-pointer" value="0" min="0" max="100">
                            <div class="flex justify-between text-[10px] text-gray-500 font-mono">
                                <span id="video-elapsed">00:00</span>
                                <span id="video-remaining" class="text-yellow-400 font-bold">-00:00</span>
                            </div>
                        </div>
                    </div>
                `

                // Wire up controls
                const video = div.querySelector('#live-video') as HTMLVideoElement
                const playBtn = div.querySelector('#btn-play') as HTMLButtonElement
                const stopBtn = div.querySelector('#btn-stop') as HTMLButtonElement
                const fadeBtn = div.querySelector('#btn-fade') as HTMLButtonElement
                const progress = div.querySelector('#video-progress') as HTMLInputElement
                const elapsed = div.querySelector('#video-elapsed')!
                const remaining = div.querySelector('#video-remaining')!

                if (video) {
                    // Time Update
                    video.addEventListener('timeupdate', () => {
                        const current = video.currentTime
                        const duration = video.duration || 0
                        const remain = duration - current

                        elapsed.textContent = this.formatTime(current)
                        remaining.textContent = '-' + this.formatTime(remain)

                        if (duration > 0) {
                            progress.value = String((current / duration) * 100)
                        }
                    })

                    // Play/Pause Toggle
                    playBtn?.addEventListener('click', () => {
                        if (video.paused) {
                            video.play()
                            playBtn.textContent = '❚❚'
                        } else {
                            video.pause()
                            playBtn.textContent = '▶'
                        }
                    })

                    // Stop
                    stopBtn?.addEventListener('click', () => {
                        video.pause()
                        video.currentTime = 0
                        playBtn.textContent = '▶'
                    })

                    // Fade Out
                    fadeBtn?.addEventListener('click', () => {
                        let opacity = 1
                        const fadeInterval = setInterval(() => {
                            opacity -= 0.05
                            video.style.opacity = String(opacity)
                            if (opacity <= 0) {
                                clearInterval(fadeInterval)
                                video.pause()
                                video.style.opacity = '1'
                                video.currentTime = 0
                            }
                        }, 100)
                    })

                    // Seek
                    progress?.addEventListener('input', () => {
                        const seekTo = (parseFloat(progress.value) / 100) * video.duration
                        video.currentTime = seekTo
                    })
                }
            }
        } else {
            // Image
            div.innerHTML = `
                <div class="flex-1 flex items-center justify-center">
                    <img src="${media.source_url || 'placeholder.png'}" class="max-w-full max-h-full object-contain">
                </div>
                <div class="absolute bottom-4 right-4 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold ">ON AIR</div>
            `
        }

        container.appendChild(div)
    }

    formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    renderPresentation(presentation: any, container: Element) {
        if (presentation.data?.is_canva && presentation.source_url) {
            const div = document.createElement('div')
            div.className = 'w-full h-full bg-black relative'
            div.innerHTML = `
                <iframe src="${presentation.source_url}" class="w-full h-full border-0" allow="fullscreen" allowfullscreen></iframe>
                <div class="absolute bottom-4 right-4 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold  pointer-events-none">ON AIR</div>
             `
            container.appendChild(div)
        } else if (presentation.data?.slides) {
            // Local Deck - Similar to Song Parts Live
            const wrapper = document.createElement('div')
            wrapper.className = 'w-full h-full overflow-y-auto p-4 grid grid-cols-2 gap-4 content-start'

            presentation.data.slides.forEach((slide: any, index: number) => {
                const isActive = false // TODO

                const div = document.createElement('div')
                div.className = `aspect-video bg-black rounded border cursor-pointer relative group overflow-hidden  ${isActive ? 'border-red-600 ring-2 ring-red-500' : 'border-gray-800 hover:border-gray-500'}`
                div.innerHTML = `
                    <img src="${slide.source_url}" class="w-full h-full object-cover">
                    <div class="absolute bottom-0 left-0 bg-black/50 text-white text-[10px] px-1">${index + 1}</div>
                 `
                div.addEventListener('click', () => {
                    store.setLiveSlide(index)
                })
                wrapper.appendChild(div)
            })
            container.appendChild(wrapper)
        }
    }

    renderText(scripture: any, container: Element) {
        if (scripture.slides && scripture.slides.length > 0) {
            const wrapper = document.createElement('div')
            wrapper.className = 'w-full h-full overflow-y-auto p-4 space-y-2'

            scripture.slides.forEach((slide: any, index: number) => {
                const isActive = false // TODO

                const div = document.createElement('div')
                div.className = `p-3 rounded cursor-pointer text-sm border  ${isActive ? 'bg-red-900/30 border-red-600' : 'bg-gray-900/50 border-gray-800 hover:border-gray-600'}`

                div.innerHTML = `
                     <div class="text-xs font-bold ${isActive ? 'text-red-400' : 'text-yellow-600'} mb-1">${slide.label || scripture.title}</div>
                     <div class="${isActive ? 'text-white text-2xl' : 'text-gray-300 text-lg'} whitespace-pre-wrap leading-relaxed font-serif">"${slide.text}"</div>
                 `
                div.addEventListener('click', () => {
                    store.setLiveSlide(index)
                })
                wrapper.appendChild(div)
            })
            container.appendChild(wrapper)
        } else {
            const div = document.createElement('div')
            div.className = 'p-8 text-center max-w-lg'
            div.innerHTML = `
                 <div class="text-3xl font-serif mb-4 text-white leading-normal shadow-black drop-shadow-lg">"${scripture.text_content || scripture.data?.text_content || ''}"</div>
                 <div class="text-red-500 font-bold tracking-widest text-sm uppercase">${scripture.reference_title || scripture.title}</div>
              `
            container.appendChild(div)
        }
    }

    clear() {
        this.currentItem = null
        const container = this.element.querySelector('#live-content')
        if (container) container.innerHTML = '<div class="text-gray-700 text-sm">No live content</div>'
    }
}
