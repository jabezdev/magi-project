/**
 * Schedule Item Settings Modal
 * Allows overriding settings for a specific item instance in the schedule.
 */
import { ICONS } from '../../constants'
import type { ScheduleItem, ItemSettings, AspectRatioMode, TransitionType } from '../../types'

function escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

export function openScheduleItemSettings(item: ScheduleItem, onSave: (settings: ItemSettings) => void): void {
    // Styles
    const modalContentClass = "w-[450px] flex flex-col bg-bg-primary border border-border-color rounded shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-scale-in"
    const headerClass = "flex justify-between items-center px-4 py-3 bg-bg-secondary border-b border-border-color shrink-0"
    const bodyClass = "p-4 flex flex-col gap-4 overflow-y-auto max-h-[80vh]"
    const footerClass = "flex justify-end items-center gap-2 px-4 py-3 bg-bg-secondary border-t border-border-color shrink-0"

    // Form Elements
    const labelClass = "block text-xs font-bold text-text-muted uppercase tracking-wide mb-1"
    const selectClass = "w-full bg-bg-tertiary border border-border-color rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary focus:bg-bg-secondary transition-colors cursor-pointer"

    // Buttons
    const btnCancelClass = "px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
    const btnSaveClass = "px-4 py-2 text-sm font-medium bg-accent-primary text-white hover:bg-accent-secondary rounded transition-colors flex items-center gap-2"

    const modal = document.createElement('div')
    modal.className = 'modal-overlay'

    const s = item.settings || {}

    // Tri-state helpers
    const getTriState = (val: boolean | undefined) => val === undefined ? 'default' : (val ? 'on' : 'off')
    const parseTriState = (val: string): boolean | undefined => val === 'default' ? undefined : (val === 'on')

    modal.innerHTML = `
        <div class="${modalContentClass}">
            <div class="${headerClass}">
                <div class="flex items-center gap-2">
                    <span class="text-text-secondary w-4 h-4">${ICONS.settings}</span>
                    <h3 class="font-bold text-text-primary">Item Settings</h3>
                </div>
                <button class="close-btn text-text-muted hover:text-text-primary p-1">${ICONS.close || '&times;'}</button>
            </div>
            
            <div class="${bodyClass}">
                <div class="text-xs text-text-muted mb-2">
                    Overrides for <span class="text-text-primary font-medium">"${escapeHtml(item.title)}"</span>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <!-- Loop -->
                     <div>
                        <label class="${labelClass}">Loop Video</label>
                        <select id="item-loop" class="${selectClass}">
                            <option value="default" ${getTriState(s.loop) === 'default' ? 'selected' : ''}>Default</option>
                            <option value="on" ${getTriState(s.loop) === 'on' ? 'selected' : ''}>Loop</option>
                            <option value="off" ${getTriState(s.loop) === 'off' ? 'selected' : ''}>Play Once</option>
                        </select>
                    </div>

                    <!-- Muted -->
                     <div>
                        <label class="${labelClass}">Audio</label>
                        <select id="item-muted" class="${selectClass}">
                            <option value="default" ${getTriState(s.muted) === 'default' ? 'selected' : ''}>Default</option>
                            <option value="on" ${getTriState(s.muted) === 'on' ? 'selected' : ''}>Mute</option>
                            <option value="off" ${getTriState(s.muted) === 'off' ? 'selected' : ''}>Unmute</option>
                        </select>
                    </div>

                    <!-- Auto Advance -->
                     <div>
                        <label class="${labelClass}">Auto Advance</label>
                        <select id="item-advance" class="${selectClass}">
                            <option value="default" ${getTriState(s.autoAdvance) === 'default' ? 'selected' : ''}>Default</option>
                            <option value="on" ${getTriState(s.autoAdvance) === 'on' ? 'selected' : ''}>Auto Advance</option>
                            <option value="off" ${getTriState(s.autoAdvance) === 'off' ? 'selected' : ''}>Manual</option>
                        </select>
                    </div>

                    <!-- Aspect Ratio -->
                     <div>
                        <label class="${labelClass}">Aspect Ratio</label>
                        <select id="item-aspect" class="${selectClass}">
                            <option value="" ${!s.aspectRatioMode ? 'selected' : ''}>Default</option>
                            <option value="fit" ${s.aspectRatioMode === 'fit' ? 'selected' : ''}>Fit</option>
                            <option value="fill" ${s.aspectRatioMode === 'fill' ? 'selected' : ''}>Fill</option>
                            <option value="stretch" ${s.aspectRatioMode === 'stretch' ? 'selected' : ''}>Stretch</option>
                        </select>
                    </div>
                </div>

                <!-- Transition Override -->
                <div>
                     <label class="${labelClass}">Transition Into Item</label>
                     <select id="item-transition" class="${selectClass}">
                        <option value="default" ${!s.transitionOverride ? 'selected' : ''}>Default</option>
                        <option value="crossfade" ${s.transitionOverride?.type === 'crossfade' ? 'selected' : ''}>Crossfade (1s)</option>
                        <option value="none" ${s.transitionOverride?.type === 'none' ? 'selected' : ''}>Cut (None)</option>
                     </select>
                </div>

            </div>

            <div class="${footerClass}">
                <button class="${btnCancelClass} cancel-btn">Cancel</button>
                <button class="${btnSaveClass} save-btn">Save</button>
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

    modal.querySelector('.save-btn')?.addEventListener('click', () => {
        const loopVal = (modal.querySelector('#item-loop') as HTMLSelectElement).value
        const mutedVal = (modal.querySelector('#item-muted') as HTMLSelectElement).value
        const advanceVal = (modal.querySelector('#item-advance') as HTMLSelectElement).value
        const aspectVal = (modal.querySelector('#item-aspect') as HTMLSelectElement).value
        const transVal = (modal.querySelector('#item-transition') as HTMLSelectElement).value

        const newSettings: ItemSettings = {
            ...s,
            loop: parseTriState(loopVal),
            muted: parseTriState(mutedVal),
            autoAdvance: parseTriState(advanceVal),
            aspectRatioMode: aspectVal ? aspectVal as AspectRatioMode : undefined,
        }

        // Handle Transition
        if (transVal === 'default') {
            delete newSettings.transitionOverride
        } else {
            newSettings.transitionOverride = {
                type: transVal as TransitionType,
                duration: transVal === 'crossfade' ? 1.0 : 0
            }
        }

        onSave(newSettings)
        closeModal()
    })
}
