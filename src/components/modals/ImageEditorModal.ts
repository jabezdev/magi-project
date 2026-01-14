/**
 * Image Editor Modal Component
 */
import { ICONS } from '../../constants'
import { updateMediaMetadata } from '../../services/api'
import type { ImageItem, AspectRatioMode } from '../../types'

function escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

export function openImageEditor(item: ImageItem, onSave?: () => void): void {
    // Styles
    const modalContentClass = "w-[500px] flex flex-col bg-bg-primary border border-border-color rounded shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-scale-in"
    const headerClass = "flex justify-between items-center px-4 py-3 bg-bg-secondary border-b border-border-color shrink-0"
    const bodyClass = "p-4 flex flex-col gap-4 overflow-y-auto max-h-[80vh]"
    const footerClass = "flex justify-end items-center gap-2 px-4 py-3 bg-bg-secondary border-t border-border-color shrink-0"

    // Form Elements
    const labelClass = "block text-xs font-bold text-text-muted uppercase tracking-wide mb-1"
    const inputClass = "w-full bg-bg-tertiary border border-border-color rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary focus:bg-bg-secondary transition-colors"

    // Buttons
    const btnCancelClass = "px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
    const btnSaveClass = "px-4 py-2 text-sm font-medium bg-accent-primary text-white hover:bg-accent-secondary rounded transition-colors flex items-center gap-2"

    const modal = document.createElement('div')
    modal.className = 'modal-overlay'

    // Initialize state
    const settings = item.settings || {}
    let title = item.title
    let subtitle = item.subtitle || ''
    let aspectRatio: AspectRatioMode = settings.aspectRatioMode || 'fit'
    let duration = settings.duration || 0

    modal.innerHTML = `
        <div class="${modalContentClass}">
            <div class="${headerClass}">
                <div class="flex items-center gap-2">
                    <span class="text-text-secondary">${ICONS.image}</span>
                    <h3 class="font-bold text-text-primary">Edit Image</h3>
                </div>
                <button class="close-btn text-text-muted hover:text-text-primary p-1">${ICONS.close || '&times;'}</button>
            </div>
            
            <div class="${bodyClass}">
                <!-- Thumbnail Check -->
                ${item.thumbnail ? `
                <div class="w-full h-32 bg-black rounded overflow-hidden border border-border-color mb-2">
                    <img src="${item.thumbnail}" class="w-full h-full object-contain opacity-80" />
                </div>
                ` : ''}

                <!-- Basics -->
                <div class="grid grid-cols-1 gap-3">
                    <div>
                        <label class="${labelClass}">Title</label>
                        <input type="text" id="img-title" class="${inputClass}" value="${escapeHtml(title)}" />
                    </div>
                    <div>
                        <label class="${labelClass}">Subtitle</label>
                        <input type="text" id="img-subtitle" class="${inputClass}" value="${escapeHtml(subtitle)}" />
                    </div>
                </div>

                <div class="h-px bg-border-color my-1"></div>

                <!-- Settings -->
                <div class="grid grid-cols-2 gap-4">
                     <div>
                        <label class="${labelClass}">Aspect Ratio</label>
                        <select id="img-aspect" class="${inputClass} cursor-pointer">
                            <option value="fit" ${aspectRatio === 'fit' ? 'selected' : ''}>Fit (Letterbox)</option>
                            <option value="fill" ${aspectRatio === 'fill' ? 'selected' : ''}>Fill (Crop)</option>
                            <option value="stretch" ${aspectRatio === 'stretch' ? 'selected' : ''}>Stretch</option>
                        </select>
                    </div>
                    <div>
                        <label class="${labelClass}">Default Duration (s)</label>
                        <input type="number" id="img-duration" class="${inputClass}" value="${duration}" min="0" step="1" />
                        <p class="text-[0.65rem] text-text-muted mt-1">For presentation playback</p>
                    </div>
                </div>
            </div>

            <div class="${footerClass}">
                <button class="${btnCancelClass} cancel-btn">Cancel</button>
                <button class="${btnSaveClass} save-btn">${ICONS.save || ''} Save Changes</button>
            </div>
        </div>
    `

    document.body.appendChild(modal)

    const closeModal = () => modal.remove()

    // Listeners
    modal.querySelector('.close-btn')?.addEventListener('click', closeModal)
    modal.querySelector('.cancel-btn')?.addEventListener('click', closeModal)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal()
    })

    modal.querySelector('.save-btn')?.addEventListener('click', async () => {
        const titleInput = modal.querySelector('#img-title') as HTMLInputElement
        const subtitleInput = modal.querySelector('#img-subtitle') as HTMLInputElement
        const aspectInput = modal.querySelector('#img-aspect') as HTMLSelectElement
        const durationInput = modal.querySelector('#img-duration') as HTMLInputElement

        const metadata = {
            title: titleInput.value.trim(),
            subtitle: subtitleInput.value.trim(),
            settings: {
                ...item.settings,
                aspectRatioMode: aspectInput.value as AspectRatioMode,
                duration: parseFloat(durationInput.value) || 0
            }
        }

        const btn = modal.querySelector('.save-btn') as HTMLButtonElement
        btn.disabled = true
        btn.textContent = 'Saving...'

        const result = await updateMediaMetadata(item.id, metadata)

        if (result?.success) {
            if (onSave) onSave()
            closeModal()
        } else {
            alert('Failed to save changes')
            btn.disabled = false
            btn.textContent = 'Save Changes'
        }
    })
}
