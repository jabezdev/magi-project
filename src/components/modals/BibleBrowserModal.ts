// Modal class is available but not used directly in this implementation
// import { Modal } from '../Modal'
import { BibleApi, ScriptureReference } from '../../lib/scripture/bible'
import { v4 as uuidv4 } from 'uuid'
import { api } from '../../services/api'
import { store } from '../../state/store'
import { showToast } from './ConfirmModal'

export class BibleBrowserModal {
    element: HTMLElement
    selectedBook: string | null = null
    selectedChapter: number | null = null
    selectedVerses: number[] = []

    constructor() {
        this.element = document.createElement('div')
        this.element.className = 'fixed inset-0 z-50 bg-[#09090b] flex flex-col'
        this.render()
        document.body.appendChild(this.element)
        this.loadBooks()
    }

    render() {
        this.element.innerHTML = `
            <!-- HEADER -->
            <div class="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#18181b]">
                <div class="flex items-center gap-4">
                    <button id="btn-close" class="text-zinc-400 hover:text-white transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <h2 class="text-xl font-bold text-white">Bible Browser</h2>
                    <select class="ml-4 bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-sm text-zinc-300 outline-none">
                        <option value="KJV">KJV (King James Version)</option>
                        <option value="WEB">WEB (World English Bible)</option>
                    </select>
                </div>
                <button id="btn-add" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold text-sm transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                    Add to Library
                </button>
            </div>

            <!-- BODY -->
            <div class="flex-1 flex overflow-hidden">
                <!-- COL 1: BOOKS -->
                <div class="w-64 border-r border-zinc-800 flex flex-col bg-[#18181b]">
                    <div class="p-3 border-b border-zinc-800">
                        <input type="text" placeholder="Search Books..." class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-sm outline-none text-zinc-300 focus:border-blue-500">
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar" id="list-books">
                        <!-- Books -->
                    </div>
                </div>

                <!-- COL 2: CHAPTERS -->
                <div class="w-24 border-r border-zinc-800 flex flex-col bg-[#18181b]">
                    <div class="p-3 border-b border-zinc-800 text-xs font-bold text-zinc-500 text-center uppercase">Chapter</div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-2 grid grid-cols-1 gap-1 content-start" id="list-chapters">
                        <!-- Chapters -->
                    </div>
                </div>

                <!-- COL 3: VERSES -->
                <div class="w-24 border-r border-zinc-800 flex flex-col bg-[#18181b]">
                    <div class="p-3 border-b border-zinc-800 text-xs font-bold text-zinc-500 text-center uppercase">Verse</div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-2 grid grid-cols-1 gap-1 content-start" id="list-verses">
                        <!-- Verses -->
                    </div>
                </div>

                <!-- COL 4: PREVIEW -->
                <div class="flex-1 bg-[#09090b] p-8 overflow-y-auto custom-scrollbar flex flex-col">
                    <div id="preview-area" class="flex-1">
                        <div class="text-zinc-500 text-center mt-20">Select a verse to preview</div>
                    </div>
                </div>
            </div>
        `

        this.element.querySelector('#btn-close')?.addEventListener('click', () => this.close())
        this.element.querySelector('#btn-add')?.addEventListener('click', () => this.addToLibrary())
    }

    loadBooks() {
        const books = BibleApi.getBooks()
        const container = this.element.querySelector('#list-books')!
        container.innerHTML = books.map(b => `
            <div class="px-4 py-3 hover:bg-zinc-800 cursor-pointer text-sm text-zinc-300 transition-colors border-b border-zinc-800/50 book-item" data-name="${b.name}">
                ${b.name}
            </div>
        `).join('')

        container.querySelectorAll('.book-item').forEach(el => {
            el.addEventListener('click', () => {
                // UI Highlight
                container.querySelectorAll('.book-item').forEach(b => b.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-500'))
                el.classList.add('bg-blue-600', 'text-white')
                el.classList.remove('hover:bg-zinc-800', 'text-zinc-300')

                this.selectedBook = (el as HTMLElement).dataset.name!
                this.selectedChapter = null
                this.selectedVerses = []
                this.loadChapters()
                this.clearVerses()
                this.updatePreview()
            })
        })
    }

    loadChapters() {
        if (!this.selectedBook) return
        const count = BibleApi.getChapterCount(this.selectedBook)
        const container = this.element.querySelector('#list-chapters')!

        // Simple grid 1..count
        let html = ''
        for (let i = 1; i <= count; i++) {
            html += `<div class="aspect-square flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 cursor-pointer text-sm text-zinc-300 chapter-item" data-num="${i}">${i}</div>`
        }
        container.innerHTML = html

        container.querySelectorAll('.chapter-item').forEach(el => {
            el.addEventListener('click', () => {
                container.querySelectorAll('.chapter-item').forEach(c => c.classList.remove('bg-blue-600', 'text-white'))
                el.classList.add('bg-blue-600', 'text-white')

                this.selectedChapter = parseInt((el as HTMLElement).dataset.num!)
                this.selectedVerses = []
                this.loadVerses()
                this.updatePreview()
            })
        })
    }

    loadVerses() {
        if (!this.selectedBook || !this.selectedChapter) return
        const count = BibleApi.getVerseCount(this.selectedBook, this.selectedChapter)
        const container = this.element.querySelector('#list-verses')!

        let html = ''
        for (let i = 1; i <= count; i++) {
            html += `<div class="aspect-square flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 cursor-pointer text-sm text-zinc-300 verse-item" data-num="${i}">${i}</div>`
        }
        container.innerHTML = html

        container.querySelectorAll('.verse-item').forEach(el => {
            el.addEventListener('click', (_e) => {
                const num = parseInt((el as HTMLElement).dataset.num!)

                // Multi-select logic (Shift for range could be added, just toggle for now)
                if (this.selectedVerses.includes(num)) {
                    this.selectedVerses = this.selectedVerses.filter(v => v !== num)
                    el.classList.remove('bg-blue-600', 'text-white')
                } else {
                    this.selectedVerses.push(num)
                    this.selectedVerses.sort((a, b) => a - b)
                    el.classList.add('bg-blue-600', 'text-white')
                }

                this.updatePreview()
            })
        })
    }

    clearVerses() {
        this.element.querySelector('#list-verses')!.innerHTML = ''
    }

    async updatePreview() {
        const container = this.element.querySelector('#preview-area')!
        const btnAdd = this.element.querySelector('#btn-add') as HTMLButtonElement

        if (!this.selectedBook || !this.selectedChapter || this.selectedVerses.length === 0) {
            container.innerHTML = '<div class="text-zinc-500 text-center mt-20">Select a verse to preview</div>'
            btnAdd.disabled = true
            return
        }

        container.innerHTML = '<div class="text-zinc-500 text-center mt-20">Loading...</div>'

        const ref: ScriptureReference = {
            book: this.selectedBook,
            chapter: this.selectedChapter,
            verses: this.selectedVerses,
            translation: 'KJV' // From select, TODO
        }

        const verses = await BibleApi.getVerses(ref)

        container.innerHTML = `
            <div class="max-w-2xl mx-auto">
                <h1 class="text-2xl font-bold text-white mb-6 text-center">
                    ${this.selectedBook} ${this.selectedChapter}:${this.selectedVerses[0]}${this.selectedVerses.length > 1 ? '-' + this.selectedVerses[this.selectedVerses.length - 1] : ''}
                </h1>
                <div class="space-y-6">
                    ${verses.map(v => `
                        <div>
                            <span class="text-blue-500 font-bold text-sm mr-1">${v.reference.split(':')[1]}</span>
                            <span class="text-zinc-200 text-lg leading-relaxed">${v.text}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `
        btnAdd.disabled = false
    }

    async addToLibrary() {
        if (!this.selectedBook || !this.selectedChapter || this.selectedVerses.length === 0) return

        const refDisplay = `${this.selectedBook} ${this.selectedChapter}:${this.selectedVerses[0]}${this.selectedVerses.length > 1 ? '-' + this.selectedVerses[this.selectedVerses.length - 1] : ''}`

        // Create Item
        // Note: In a real app we'd fetch the text again or store it. For now, fetch.
        const ref: ScriptureReference = {
            book: this.selectedBook,
            chapter: this.selectedChapter,
            verses: this.selectedVerses,
            translation: 'KJV'
        }
        const verses = await BibleApi.getVerses(ref)

        // Format Content for slides
        // One slide per verse
        const slides = verses.map(v => ({
            id: uuidv4(),
            text: v.text, // This is the visible text
            type: 'scripture',
            label: v.reference
        }))

        const newItem = {
            id: uuidv4(),
            type: 'scripture',
            title: refDisplay,
            tags: ['Scripture', 'KJV'],
            // We use 'slides' property for generic slide storage on the item for now?
            // Need to check BaseMediaItem or extend it. 
            // The specs say 'Scripture' is a valid type.
            // Let's assume we store the data in a custom payload or just use a generic 'content' field if available?
            // looking at types.ts, we might need to cast or add a specialized interface.
            // For now, let's treat it similar to a Song but with slides.
            // Actually, type 'scripture' usually dynamic generates slides. 
            // But for this MVP, let's persist the "slides" array so Preview/Live panels can just read "slides".
            data: {
                book: this.selectedBook,
                chapter: this.selectedChapter,
                verses: this.selectedVerses,
                translation: 'KJV',
                slides: slides
            }
        }

        // Temporary Hack: store 'data' in a way the store accepts.
        // LibraryStore just stores the JSON object. 
        // But UnifiedLibrary and PreviewPanel need to know how to read it.
        // Let's flatten 'slides' to the top level if possible or keep in data.
        // To make it easy for existing Preview logic (which expects 'parts' for Songs), we might map it.
        // But Scripture is different.
        // Let's add 'slides' to the top level object for now.
        const payload: any = {
            ...newItem,
            slides: slides // Store explicitly
        }

        try {
            await api.library.create(payload)
            await store.refreshLibrary()
            this.close()
        } catch (e: any) {
            showToast({ message: 'Error creating item: ' + e.message, type: 'error' })
        }
    }

    close() {
        this.element.remove()
    }
}

export function openBibleBrowser() {
    new BibleBrowserModal()
}
