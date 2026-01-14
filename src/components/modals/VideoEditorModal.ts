/**
 * Video Editor Modal Component
 */
import { ICONS } from '../../constants'
import { updateMediaMetadata } from '../../services/api'
import type { VideoItem, AspectRatioMode } from '../../types'

function escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

// Helpers for time formatting
function formatSeconds(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function parseSeconds(timeStr: string): number {
    const parts = timeStr.split(':')
    if (parts.length === 2) {
        const m = parseInt(parts[0]) || 0
        const s = parseInt(parts[1]) || 0
        return (m * 60) + s
    }
    return 0
}

export function openVideoEditor(item: VideoItem, onSave?: () => void): void {
    // Styles
    const modalContentClass = "w-[500px] flex flex-col bg-bg-primary border border-border-color rounded shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-scale-in"
    const headerClass = "flex justify-between items-center px-4 py-3 bg-bg-secondary border-b border-border-color shrink-0"
    const bodyClass = "p-4 flex flex-col gap-4 overflow-y-auto max-h-[80vh]"
    const footerClass = "flex justify-end items-center gap-2 px-4 py-3 bg-bg-secondary border-t border-border-color shrink-0"

    // Form Elements
    const labelClass = "block text-xs font-bold text-text-muted uppercase tracking-wide mb-1"
    const inputClass = "w-full bg-bg-tertiary border border-border-color rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary focus:bg-bg-secondary transition-colors"
    const checkboxClass = "w-4 h-4 rounded border-border-color bg-bg-tertiary text-accent-primary focus:ring-offset-0 focus:ring-0 cursor-pointer"

    // Buttons
    const btnCancelClass = "px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
    const btnSaveClass = "px-4 py-2 text-sm font-medium bg-accent-primary text-white hover:bg-accent-secondary rounded transition-colors flex items-center gap-2"

    const modal = document.createElement('div')
    modal.className = 'modal-overlay' // Reuse global overlay class if exists

    // Initialize state from item
    const settings = item.settings || {}
    let title = item.title
    let subtitle = item.subtitle || ''
    let isMuted = settings.muted ?? false
    let isLoop = settings.loop ?? item.loop ?? false
    let aspectRatio: AspectRatioMode = settings.aspectRatioMode || 'fit'
    let startTime = settings.startTime ?? 0
    let endTime = settings.endTime ?? 0

    modal.innerHTML = `
        <div class="${modalContentClass}">
            <div class="${headerClass}">
                <div class="flex items-center gap-2">
                    <span class="text-text-secondary">${ICONS.video}</span>
                    <h3 class="font-bold text-text-primary">Edit Video</h3>
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
                        <input type="text" id="video-title" class="${inputClass}" value="${escapeHtml(title)}" />
                    </div>
                    <div>
                        <label class="${labelClass}">Subtitle / Artist</label>
                        <input type="text" id="video-subtitle" class="${inputClass}" value="${escapeHtml(subtitle)}" />
                    </div>
                </div>

                <div class="h-px bg-border-color my-1"></div>

                <!-- Settings Row 1 -->
                <div class="grid grid-cols-2 gap-4">
                     <div>
                        <label class="${labelClass}">Aspect Ratio</label>
                        <select id="video-aspect" class="${inputClass} cursor-pointer">
                            <option value="fit" ${aspectRatio === 'fit' ? 'selected' : ''}>Fit (Letterbox)</option>
                            <option value="fill" ${aspectRatio === 'fill' ? 'selected' : ''}>Fill (Crop)</option>
                            <option value="stretch" ${aspectRatio === 'stretch' ? 'selected' : ''}>Stretch</option>
                        </select>
                    </div>
                    <div class="flex flex-col gap-2 pt-6">
                         <label class="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" id="video-muted" class="${checkboxClass}" ${isMuted ? 'checked' : ''} />
                            <span class="text-sm text-text-primary">Muted</span>
                        </label>
                         <label class="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" id="video-loop" class="${checkboxClass}" ${isLoop ? 'checked' : ''} />
                            <span class="text-sm text-text-primary">Loop Default</span>
                        </label>
                    </div>
                </div>

                <!-- Trim -->
                 <div>
                    <label class="${labelClass}">Trim (MM:SS)</label>
                    <div class="flex items-center gap-2">
                        <input type="text" id="video-start" class="${inputClass} text-center font-mono" placeholder="00:00" value="${formatSeconds(startTime)}" />
                        <span class="text-text-muted">-</span>
                        <input type="text" id="video-end" class="${inputClass} text-center font-mono" placeholder="00:00" value="${formatSeconds(endTime)}" />
                    </div>
                    <p class="text-[0.65rem] text-text-muted mt-1">Leave 00:00 for full duration</p>
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
        const titleInput = modal.querySelector('#video-title') as HTMLInputElement
        const subtitleInput = modal.querySelector('#video-subtitle') as HTMLInputElement
        const aspectInput = modal.querySelector('#video-aspect') as HTMLSelectElement
        const mutedInput = modal.querySelector('#video-muted') as HTMLInputElement
        const loopInput = modal.querySelector('#video-loop') as HTMLInputElement

        const startInput = modal.querySelector('#video-start') as HTMLInputElement
        const endInput = modal.querySelector('#video-end') as HTMLInputElement

        const newStart = parseSeconds(startInput.value)
        const newEnd = parseSeconds(endInput.value)

        const metadata = {
            title: titleInput.value.trim(),
            subtitle: subtitleInput.value.trim(),
            loop: loopInput.checked,
            settings: {
                ...item.settings, // Preserve other settings if any
                aspectRatioMode: aspectInput.value as AspectRatioMode,
                muted: mutedInput.checked,
                startTime: newStart,
                endTime: newEnd,
                loop: loopInput.checked // Redundant but safe
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
