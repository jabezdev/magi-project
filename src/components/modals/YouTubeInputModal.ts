/**
 * YouTube Input Modal
 */
import { ICONS } from '../../constants'

export function openYouTubeInputModal(onConfirm: (url: string) => void): void {
    const modal = document.createElement('div')
    modal.className = 'modal-overlay'
    modal.innerHTML = `
    <div class="bg-bg-primary border border-border-color rounded shadow-2xl w-[400px] flex flex-col overflow-hidden animate-fade-in-up">
      <div class="px-3 py-2 bg-bg-secondary border-b border-border-color flex justify-between items-center">
        <h2 class="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
            ${ICONS.link} Add YouTube Video
        </h2>
        <button class="close-btn text-text-muted hover:text-text-primary px-1">${ICONS.close}</button>
      </div>
      
      <div class="p-4 flex flex-col gap-3">
        <label class="text-xs font-semibold text-text-secondary">Video URL</label>
        <div class="flex gap-2">
            <input type="text" id="yt-url-input" class="flex-1 bg-bg-tertiary border border-border-color rounded px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary placeholder:text-text-muted" placeholder="https://youtube.com/watch?v=..." autofocus />
        </div>
        <p class="text-[10px] text-text-muted">Supports valid YouTube video links. Metadata will be fetched automatically.</p>
      </div>

      <div class="px-3 py-2 bg-bg-secondary border-t border-border-color flex justify-end gap-2">
        <button class="close-btn px-3 py-1 text-sm text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
        <button id="yt-confirm-btn" class="px-3 py-1 text-sm bg-accent-primary text-white rounded font-medium hover:brightness-110 transition-colors flex items-center gap-2">
            Add Video
        </button>
      </div>
    </div>
  `

    document.body.appendChild(modal)

    const input = modal.querySelector('#yt-url-input') as HTMLInputElement
    const confirmBtn = modal.querySelector('#yt-confirm-btn') as HTMLButtonElement

    const close = () => modal.remove()

    const confirm = () => {
        const url = input.value.trim()
        if (url) {
            confirmBtn.disabled = true
            confirmBtn.textContent = 'Adding...'
            onConfirm(url)
            close()
        } else {
            input.classList.add('border-danger')
            input.focus()
        }
    }

    modal.querySelectorAll('.close-btn').forEach(b => b.addEventListener('click', close))
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close()
    })

    confirmBtn.addEventListener('click', confirm)
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirm()
        if (e.key === 'Escape') close()
        input.classList.remove('border-danger')
    })

    // Auto focus
    setTimeout(() => input.focus(), 50)
}
