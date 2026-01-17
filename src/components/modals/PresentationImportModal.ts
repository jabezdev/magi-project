import { api } from '../../services/api'
import { v4 as uuidv4 } from 'uuid'
import { store } from '../../state/store'
import { ICONS } from '../../constants/icons'
import { MediaType } from '../../types'
import { showToast } from './ConfirmModal'

export class PresentationImportModal {
    element: HTMLElement
    files: File[] = []
    mode: 'local' | 'canva' = 'local'

    constructor() {
        this.element = document.createElement('div')
        this.element.className = 'fixed inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm'
        this.render()
        document.body.appendChild(this.element)
    }

    render() {
        this.element.innerHTML = `
            <div class="bg-[#18181b] w-full max-w-2xl rounded-xl shadow-2xl border border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
                <!-- Header -->
                <div class="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#18181b]">
                     <h2 class="text-lg font-bold text-white flex items-center gap-2">
                        <span class="text-blue-500 w-6 h-6">${ICONS.slides}</span> New Presentation
                     </h2>
                     <button id="btn-close" class="text-zinc-400 hover:text-white w-6 h-6">
                         ${ICONS.close}
                     </button>
                </div>

                <!-- Tabs -->
                <div class="flex border-b border-zinc-800 bg-[#18181b]">
                    <button class="flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${this.mode === 'local' ? 'border-blue-500 text-white bg-zinc-800' : 'border-transparent text-zinc-500 hover:text-zinc-300'}" id="tab-local">
                        Local Images
                    </button>
                    <button class="flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${this.mode === 'canva' ? 'border-purple-500 text-white bg-zinc-800' : 'border-transparent text-zinc-500 hover:text-zinc-300'}" id="tab-canva">
                        Canva URL
                    </button>
                </div>

                <!-- Content -->
                <div class="p-6 flex-1 overflow-y-auto">
                    ${this.mode === 'local' ? this.renderLocal() : this.renderCanva()}
                </div>

                <!-- Footer -->
                <div class="p-4 border-t border-zinc-800 flex justify-end gap-2 bg-[#18181b]">
                    <button id="btn-cancel" class="px-4 py-2 text-zinc-400 hover:text-white text-sm font-bold">Cancel</button>
                    <button id="btn-import" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        ${this.mode === 'local' ? 'Created Presentation' : 'Import Canva'}
                    </button>
                </div>
            </div>
        `

        this.attachListeners()
    }

    renderLocal() {
        return `
            <div class="space-y-4">
                 <div class="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200">
                    Upload multiple images to create a slide deck. They will be ordered by filename.
                 </div>

                 <!-- File Input -->
                 <div class="border-2 border-dashed border-zinc-700 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors cursor-pointer" id="drop-zone">
                    <input type="file" id="input-files" multiple accept="image/*" class="hidden" />
                    <div class="text-zinc-400 mb-2 w-8 h-8">${ICONS.upload}</div>
                    <div class="text-zinc-300 font-bold">Click to upload images</div>
                    <div class="text-zinc-600 text-xs mt-1">or drag and drop here</div>
                 </div>

                 <!-- Preview Grid -->
                 <div class="grid grid-cols-4 gap-2 mt-4" id="preview-grid">
                    ${this.files.map((f, i) => `
                        <div class="aspect-video bg-zinc-800 rounded-lg relative overflow-hidden group border border-zinc-700">
                            <img src="${URL.createObjectURL(f)}" class="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity" />
                            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span class="text-xs text-white font-mono bg-black/50 px-1 rounded-lg">${i + 1}</span>
                            </div>
                        </div>
                    `).join('')}
                 </div>
                 
                 <div class="space-y-2 mt-4">
                     <label class="block text-xs uppercase text-zinc-500 font-bold">Title</label>
                     <input type="text" id="input-title" class="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white outline-none focus:border-blue-500" placeholder="Presentation Title" value="${this.files.length > 0 ? this.files[0].name.split('.')[0] : ''}">
                 </div>
            </div>
        `
    }

    renderCanva() {
        return `
            <div class="space-y-6">
                <div class="bg-purple-900/20 border border-purple-900/50 p-4 rounded-lg text-sm text-purple-200">
                    Paste a Canva Embed URL or Share Link.
                </div>

                <div class="space-y-2">
                    <label class="block text-xs uppercase text-gray-500 font-bold">Canva URL</label>
                    <input type="text" id="input-canva-url" class="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white outline-none focus:border-purple-500" placeholder="https://www.canva.com/design/..." />
                </div>

                 <div class="space-y-2">
                     <label class="block text-xs uppercase text-gray-500 font-bold">Title</label>
                     <input type="text" id="input-title" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white outline-none focus:border-purple-500" placeholder="Presentation Title">
                 </div>
            </div>
        `
    }

    attachListeners() {
        this.element.querySelector('#btn-close')?.addEventListener('click', () => this.close())
        this.element.querySelector('#btn-cancel')?.addEventListener('click', () => this.close())

        // Tab Switching
        const setMode = (m: 'local' | 'canva') => {
            this.mode = m
            this.render()
        }
        this.element.querySelector('#tab-local')?.addEventListener('click', () => setMode('local'))
        this.element.querySelector('#tab-canva')?.addEventListener('click', () => setMode('canva'))

        if (this.mode === 'local') {
            const dropZone = this.element.querySelector('#drop-zone')
            const fileInput = this.element.querySelector('#input-files') as HTMLInputElement

            dropZone?.addEventListener('click', () => fileInput.click())
            fileInput?.addEventListener('change', (e) => {
                const newFiles = Array.from((e.target as HTMLInputElement).files || [])
                this.files = [...this.files, ...newFiles]
                this.render()
            })

            // Drag and Drop (Basic)
            dropZone?.addEventListener('dragover', (e) => e.preventDefault())
            dropZone?.addEventListener('drop', (e) => {
                e.preventDefault()
                // @ts-ignore
                const newFiles = Array.from(e.dataTransfer?.files || []) as File[]
                this.files = [...this.files, ...newFiles]
                this.render()
            })
        }

        // Import
        this.element.querySelector('#btn-import')?.addEventListener('click', () => this.handleImport())
    }

    async handleImport() {
        const titleInput = this.element.querySelector('#input-title') as HTMLInputElement
        const title = titleInput?.value || 'Untitled Presentation'

        if (this.mode === 'local') {
            if (this.files.length === 0) return showToast({ message: 'Please upload at least one image.', type: 'warning' })

            // Upload images
            // const slides: any[] = []

            // We need to upload each file
            // Parallel upload
            try {
                const uploadPromises = this.files.map(async (file) => {
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('target', 'image_slides')
                    formData.append('subfolder', 'presentation_' + uuidv4()) // Organize in subfolder

                    const res = await api.upload(formData)
                    const fileData = res.files[0]

                    return {
                        id: uuidv4(),
                        type: 'image',
                        image_subtype: 'content',  // Presentation slides are content images
                        label: file.name,
                        source_url: fileData.path,
                        file_hash: fileData.file_hash
                    }
                })

                const uploadedSlides = await Promise.all(uploadPromises)

                // Create Item
                const item = {
                    id: uuidv4(),
                    type: 'presentation' as MediaType,
                    title: title,
                    data: {
                        is_canva: false,
                        slides: uploadedSlides
                    }
                }

                await api.library.create(item as any)
                await store.refreshLibrary()
                this.close()

            } catch (e: any) {
                showToast({ message: 'Upload failed: ' + e.message, type: 'error' })
            }

        } else {
            const urlInput = this.element.querySelector('#input-canva-url') as HTMLInputElement
            const url = urlInput.value.trim()
            if (!url) return showToast({ message: 'Please enter a URL', type: 'warning' })

            const item = {
                id: uuidv4(),
                type: 'presentation' as MediaType,
                title: title,
                source_url: url, // Store main URL here
                data: {
                    is_canva: true,
                    slides: [] // Canva handles its own slides
                }
            }

            await api.library.create(item as any)
            await store.refreshLibrary()
            this.close()
        }
    }

    close() {
        this.element.remove()
    }
}

export function openPresentationImportModal() {
    new PresentationImportModal()
}
