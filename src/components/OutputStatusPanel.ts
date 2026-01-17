export class OutputStatusPanel {
    element: HTMLElement

    constructor() {
        this.element = document.createElement('div')
        this.element.className = 'flex flex-col h-full bg-gray-900 border-l border-gray-800'
        this.render()
    }

    static focusAll() {
        const screens = [
            { id: 'main-projection', url: '/main' },
            { id: 'confidence', url: '/confidence' },
            { id: 'lower-thirds', url: '/thirds' }
        ]

        screens.forEach(s => {
            const w = window.open(s.url, `magi-screen-${s.id}`, 'width=800,height=600')
            w?.focus()
        })
    }

    render() {
        this.element.innerHTML = `
            <div class="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-gray-700">
                ${this.renderMonitor('Main Projection', '/main', true, '1920', '1080', true)}
                ${this.renderMonitor('Confidence', '/confidence', false, '1024', '768', true)}
                ${this.renderMonitor('Lower Thirds', '/thirds', false, '1920', '1080', true)}
                ${this.renderMonitor('Mobile', '/mobile', false, '1080', '1920', false)}
            </div>
        `

        // Bind Toggles
        this.element.querySelectorAll('.monitor-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const targetId = (e.target as HTMLElement).getAttribute('data-target')
                const checked = (e.target as HTMLInputElement).checked
                this.toggleFrame(targetId!, checked)
            })
        })

        // Bind Open Buttons
        this.element.querySelectorAll('.btn-open-window').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault()
                const url = (e.currentTarget as HTMLElement).getAttribute('data-url')
                const id = (e.currentTarget as HTMLElement).getAttribute('data-id')
                const w = window.open(url!, `magi-screen-${id}`, 'width=800,height=600')
                w?.focus()
            })
        })

        // Initialize Scalers
        this.initScalers()
    }

    renderMonitor(label: string, url: string, defaultActive: boolean, baseW: string, baseH: string, isLandscape: boolean) {
        const id = label.replace(/\s+/g, '-').toLowerCase()
        // Determine aspect ratio class for the CONTAINER
        const aspectClass = isLandscape
            ? (baseW === '1024' ? 'aspect-[4/3]' : 'aspect-video')
            : 'aspect-[9/16]'

        // Compact height for disabled state
        const wrapperStyle = defaultActive ? '' : 'height: 60px;'

        return `
            <div class="border-b border-gray-700 monitor-item" data-id="${id}" data-w="${baseW}" data-h="${baseH}">
                <div class="flex justify-between items-center px-2 py-1 bg-gray-800 select-none">
                    <div class="flex items-center gap-2">
                        <div class="text-xs font-bold text-gray-300">${label}</div>
                        <div id="badge-${id}" class="${defaultActive ? 'hidden' : ''} px-1.5 py-0.5 bg-red-900/50 border border-red-800 rounded text-[9px] font-bold text-red-400 uppercase tracking-wide">
                            Disabled
                        </div>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer monitor-toggle" data-target="${id}" ${defaultActive ? 'checked' : ''}>
                        <div class="w-8 h-4 bg-gray-700 peer-focus:outline-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[0px] after:left-[0px] after:bg-white after:border-gray-300 after:border after:h-4 after:w-4 after: peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                
                <!-- Wrapper for Hover Area (Full Width) -->
                <div id="wrapper-${id}" class="bg-black border-t border-gray-700 overflow-hidden relative group  duration-300 w-full flex flex-col justify-center" style="${wrapperStyle}">
                    
                    <!-- Scalable Container (Aspect Ratio Locked) -->
                    <div class="${aspectClass} w-full mx-auto relative flex-none ${defaultActive ? '' : 'hidden'}  duration-300 overflow-hidden scale-container" id="content-${id}">
                        <!-- Fixed Size Content Wrapper -->
                        <div class="origin-top-left absolute top-0 left-0 bg-black scale-target" style="width: ${baseW}px; height: ${baseH}px;">
                            <iframe id="iframe-${id}" src="${defaultActive ? url : ''}" class="w-full h-full pointer-events-none border-0" scrolling="no"></iframe>
                        </div>
                    </div>

                    <!-- Placeholder for Disabled State -->
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none ${defaultActive ? 'hidden' : ''}" id="placeholder-${id}">
                         <span class="text-xs text-gray-700 uppercase font-bold tracking-widest">Screen Off</span>
                    </div>

                    <!-- Full Width Overlay Link -->
                    <div data-url="${url}" data-id="${id}" class="btn-open-window absolute inset-0 bg-blue-900/80 opacity-0 group-hover:opacity-100  flex items-center justify-center cursor-pointer z-10 backdrop-blur-sm">
                        <span class="text-white text-xs font-bold flex items-center gap-2">
                            OPEN WINDOW 
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </span>
                    </div>
                </div>
            </div>
        `
    }

    initScalers() {
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const container = entry.target as HTMLElement
                const target = container.querySelector('.scale-target') as HTMLElement
                if (target) {
                    const baseW = parseFloat(target.style.width) // 1920
                    const currentW = entry.contentRect.width
                    const scale = currentW / baseW
                    target.style.transform = `scale(${scale})`
                }
            }
        })

        this.element.querySelectorAll('.scale-container').forEach(el => {
            resizeObserver.observe(el)
        })
    }

    toggleFrame(id: string, active: boolean) {
        const iframe = this.element.querySelector(`#iframe-${id}`) as HTMLIFrameElement
        const placeholder = this.element.querySelector(`#placeholder-${id}`) as HTMLElement
        const wrapper = this.element.querySelector(`#wrapper-${id}`) as HTMLElement
        const content = this.element.querySelector(`#content-${id}`) as HTMLElement
        const badge = this.element.querySelector(`#badge-${id}`) as HTMLElement

        const urlMap: any = {
            'main-projection': '/main',
            'confidence': '/confidence',
            'lower-thirds': '/thirds',
            'mobile': '/mobile'
        }

        if (active) {
            iframe.src = urlMap[id]
            content.classList.remove('hidden')
            placeholder.classList.add('hidden')
            badge.classList.add('hidden')
            wrapper.style.height = '' // Auto height
        } else {
            iframe.src = ''
            content.classList.add('hidden')
            placeholder.classList.remove('hidden')
            badge.classList.remove('hidden')
            wrapper.style.height = '60px' // Compact height
        }
    }
}
