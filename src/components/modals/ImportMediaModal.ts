import { api } from '../../services/api'

import { ICONS } from '../../constants/icons'
import { showToast } from './ConfirmModal'

/**
 * ImportMediaModal - A comprehensive modal for uploading images and videos
 * Creates proper library items with all required fields
 */
export class ImportMediaModal {
    element: HTMLElement
    files: File[] = []
    mediaType: 'video' | 'image' = 'video'
    mediaSubtype: 'content' | 'background' = 'content'

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
                        <span class="text-blue-500 w-6 h-6">${ICONS.upload}</span> Import Media
                     </h2>
                     <button id="btn-close" class="text-zinc-400 hover:text-white w-6 h-6">
                        ${ICONS.close}
                     </button>
                </div>

                <!-- Body -->
                <div class="p-6 flex flex-col gap-6 overflow-y-auto">
                    <!-- Media Type Selection -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-zinc-400 mb-2 uppercase">Media Type</label>
                            <div class="flex gap-2">
                                <button type="button" class="media-type-btn flex-1 py-2 px-3 text-sm font-bold rounded ${this.mediaType === 'video' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}" data-type="video">
                                    Video
                                </button>
                                <button type="button" class="media-type-btn flex-1 py-2 px-3 text-sm font-bold rounded ${this.mediaType === 'image' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}" data-type="image">
                                    Image
                                </button>
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-zinc-400 mb-2 uppercase">Usage</label>
                            <div class="flex gap-2">
                                <button type="button" class="subtype-btn flex-1 py-2 px-3 text-sm font-bold rounded ${this.mediaSubtype === 'content' ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}" data-subtype="content">
                                    Content
                                </button>
                                <button type="button" class="subtype-btn flex-1 py-2 px-3 text-sm font-bold rounded ${this.mediaSubtype === 'background' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}" data-subtype="background">
                                    Background
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Help Text -->
                    <div class="text-xs text-zinc-500 p-2 bg-zinc-900/50 rounded">
                        ${this.mediaSubtype === 'content'
                ? '<strong>Content:</strong> Full-screen media for presentations and announcements'
                : '<strong>Background:</strong> Looped/static media for behind lyrics and scriptures'}
                    </div>

                    <!-- Drop Zone -->
                    <div class="border-2 border-dashed border-zinc-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer" id="drop-zone">
                        <input type="file" id="input-files" multiple accept="${this.mediaType === 'video' ? 'video/*' : 'image/*'}" class="hidden" />
                        <div class="text-4xl mb-2">${this.mediaType === 'video' ? '🎬' : '🖼️'}</div>
                        <div class="text-sm text-zinc-300 font-bold">Click to upload ${this.mediaType}s</div>
                        <div class="text-xs text-zinc-600 mt-1">or drag and drop here</div>
                    </div>

                    <!-- File List -->
                    <div id="file-list" class="space-y-2 max-h-40 overflow-y-auto">
                        ${this.files.length === 0 ? '<div class="text-center text-zinc-600 text-sm">No files selected</div>' : ''}
                        ${this.files.map((f, i) => `
                            <div class="flex items-center gap-2 bg-zinc-800 p-2 rounded text-sm">
                                <span class="w-5 h-5 text-zinc-400">${this.mediaType === 'video' ? ICONS.video : ICONS.image}</span>
                                <span class="flex-1 truncate text-zinc-200">${f.name}</span>
                                <span class="text-zinc-500">${(f.size / 1024 / 1024).toFixed(1)} MB</span>
                                <button type="button" class="remove-file text-zinc-500 hover:text-red-400" data-index="${i}">×</button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Footer -->
                <div class="h-16 border-t border-zinc-800 flex items-center justify-end px-6 bg-[#18181b] gap-2">
                    <button id="btn-cancel" class="text-zinc-500 hover:text-white text-sm px-4 font-bold transition-colors">Cancel</button>
                    <button id="btn-import" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" ${this.files.length === 0 ? 'disabled' : ''}>
                        Import ${this.files.length > 0 ? `(${this.files.length})` : ''}
                    </button>
                </div>
            </div>
        `

        this.attachListeners()
    }

    attachListeners() {
        // Close buttons
        this.element.querySelector('#btn-close')?.addEventListener('click', () => this.close())
        this.element.querySelector('#btn-cancel')?.addEventListener('click', () => this.close())

        // Media type toggles
        this.element.querySelectorAll('.media-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.mediaType = btn.getAttribute('data-type') as 'video' | 'image'
                this.files = [] // Clear files when changing type
                this.render()
            })
        })

        // Subtype toggles
        this.element.querySelectorAll('.subtype-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.mediaSubtype = btn.getAttribute('data-subtype') as 'content' | 'background'
                this.render()
            })
        })

        // Drop zone click
        const dropZone = this.element.querySelector('#drop-zone') as HTMLElement
        const fileInput = this.element.querySelector('#input-files') as HTMLInputElement

        dropZone?.addEventListener('click', () => fileInput.click())

        fileInput?.addEventListener('change', () => {
            if (fileInput.files) {
                this.files = [...this.files, ...Array.from(fileInput.files)]
                this.render()
            }
        })

        // Drag and drop
        dropZone?.addEventListener('dragover', (e) => {
            e.preventDefault()
            dropZone.classList.add('border-blue-500', 'bg-blue-900/10')
        })

        dropZone?.addEventListener('dragleave', () => {
            dropZone.classList.remove('border-blue-500', 'bg-blue-900/10')
        })

        dropZone?.addEventListener('drop', (e) => {
            e.preventDefault()
            dropZone.classList.remove('border-blue-500', 'bg-blue-900/10')
            const droppedFiles = Array.from(e.dataTransfer?.files || [])
            this.files = [...this.files, ...droppedFiles]
            this.render()
        })

        // Remove file buttons
        this.element.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation()
                const idx = parseInt(btn.getAttribute('data-index') || '0')
                this.files.splice(idx, 1)
                this.render()
            })
        })

        // Import button
        this.element.querySelector('#btn-import')?.addEventListener('click', () => this.handleImport())
    }

    async handleImport() {
        if (this.files.length === 0) return

        const btnImport = this.element.querySelector('#btn-import') as HTMLButtonElement
        btnImport.disabled = true
        btnImport.textContent = 'Uploading...'

        try {
            for (const file of this.files) {
                // 1. Upload the file to CAS
                const formData = new FormData()
                formData.append('files', file)
                formData.append('target', `${this.mediaType}_${this.mediaSubtype}`)

                const uploadRes = await api.upload(formData)
                const fileData = uploadRes.files[0]

                if (!fileData) throw new Error('Upload failed for ' + file.name)

                // 2. Create a library item with proper fields
                const title = file.name.replace(/\.[^/.]+$/, '') // Remove extension

                if (this.mediaType === 'video') {
                    await api.library.create({
                        type: 'video',
                        video_subtype: this.mediaSubtype,
                        title,
                        tags: [this.mediaSubtype === 'background' ? 'Background' : 'Content', 'Video'],
                        source_url: fileData.path,
                        file_hash: fileData.file_hash || fileData.hash,
                        file_size_bytes: fileData.size || 0,
                        duration_total: 0, // Would need ffprobe to get this
                        trim_start: 0,
                        trim_end: 0,
                        volume_multiplier: this.mediaSubtype === 'background' ? 0 : 1.0, // Mute backgrounds
                        is_loop: this.mediaSubtype === 'background',
                        is_youtube: false,
                        thumbnail_path: fileData.path // Simplified, would ideally generate
                    })
                } else {
                    await api.library.create({
                        type: 'image',
                        image_subtype: this.mediaSubtype,
                        title,
                        tags: [this.mediaSubtype === 'background' ? 'Background' : 'Content', 'Image'],
                        source_url: fileData.path,
                        file_hash: fileData.file_hash || fileData.hash,
                        scaling_mode: 'fill'
                    })
                }
            }

            await store.refreshLibrary()
            showToast({
                message: `Successfully imported ${this.files.length} file(s)`,
                type: 'success'
            })
            this.close()

        } catch (err: any) {
            showToast({
                message: 'Import failed: ' + err.message,
                type: 'error',
                duration: 5000
            })
            btnImport.disabled = false
            btnImport.textContent = `Import (${this.files.length})`
        }
    }

    close() {
        this.element.remove()
    }
}

export function openImportMediaModal() {
    new ImportMediaModal()
}
