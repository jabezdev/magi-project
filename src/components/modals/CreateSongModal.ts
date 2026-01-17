import { Modal } from '../Modal'
import { api } from '../../services/api'
import { v4 as uuidv4 } from 'uuid'
import { store } from '../../state/store'
import { showToast } from './ConfirmModal'


export function openCreateSongModal() {
    const form = document.createElement('form')
    form.className = 'space-y-4'
    form.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-xs font-bold text-zinc-400 mb-1">TITLE</label>
                <input type="text" name="title" required class="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none" placeholder="Amazing Grace" />
            </div>
            <div>
                <label class="block text-xs font-bold text-zinc-400 mb-1">ARTIST</label>
                <input type="text" name="artist" class="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none" placeholder="John Newton" />
            </div>
        </div>
        <div>
            <label class="block text-xs font-bold text-zinc-400 mb-1">QUICK LYRICS (Double enter to separate slides)</label>
            <textarea name="lyrics" rows="10" class="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono text-sm focus:border-blue-500 outline-none" placeholder="Verse 1\nAmazing grace how sweet the sound\n\nChorus\nMy chains are gone..."></textarea>
        </div>
    `

    const footer = document.createElement('div')
    footer.className = 'flex gap-2'
    footer.innerHTML = `
        <button type="button" class="px-4 py-2 text-sm text-zinc-500 hover:text-white transition-colors font-bold" id="btn-cancel">Cancel</button>
        <button type="submit" class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-colors">Create Song</button>
    `

    const modal = new Modal('Add New Song', form, footer)

    footer.querySelector('#btn-cancel')?.addEventListener('click', () => modal.close())

    // Handle Submit
    footer.querySelector('button[type="submit"]')?.addEventListener('click', async (e) => {
        e.preventDefault()

        const title = (form.querySelector('[name="title"]') as HTMLInputElement).value
        const artist = (form.querySelector('[name="artist"]') as HTMLInputElement).value
        const rawLyrics = (form.querySelector('[name="lyrics"]') as HTMLTextAreaElement).value

        if (!title) return showToast({ message: 'Title is required', type: 'warning' })

        // Simple Parser
        const parts = []
        const blocks = rawLyrics.split(/\n\n+/)

        for (const block of blocks) {
            if (!block.trim()) continue

            const lines = block.trim().split('\n')
            let label = 'Slide'
            let content = block.trim()

            // Heuristic: If first line is "Verse 1" or "Chorus", use it as label
            const headerMatch = lines[0].match(/^(Verse|Chorus|Bridge|Intro|Ending|Pre-Chorus)/i)
            if (headerMatch) {
                label = lines[0]
                content = lines.slice(1).join('\n').trim()
            }

            parts.push({
                id: uuidv4(),
                type: 'lyrics',
                label,
                lyrics: content
            })
        }

        try {
            await api.library.create({
                type: 'song',
                title,
                subtitle: artist,
                tags: [],
                // @ts-ignore - Partial type mismatch in create vs specific SongItem
                artist,
                parts,
                arrangements: [{ id: uuidv4(), name: 'Default', is_default: true, sequence: parts.map(p => p.id) }]
            })

            await store.refreshLibrary()
            modal.close()
        } catch (err: any) {
            showToast({ message: 'Failed to create song: ' + err.message, type: 'error' })
        }
    })
}
