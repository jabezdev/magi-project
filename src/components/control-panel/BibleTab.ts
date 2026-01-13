import { ICONS } from '../../constants'
import { addItemToSchedule } from '../../actions'

let activeBibleTab: 'translations' | 'scripture' = 'scripture'

export function renderScripturePicker(): string {
    const sectionClass = "flex flex-col flex-1 overflow-hidden min-w-0 bg-bg-primary scripture-section h-full"

    // Header Style customized for "[Translations] [Scripture]"
    const headerClass = "flex items-center bg-bg-secondary border-b border-border-color shrink-0 h-[2.2rem] px-0"

    const tabClass = "flex-1 h-full flex items-center justify-center text-xs font-medium text-text-muted cursor-pointer hover:bg-bg-hover transition-colors border-r border-border-color relative z-10 last:border-r-0"
    const activeTabClass = "bg-bg-tertiary text-text-primary shadow-[inset_0_-2px_0_0_var(--accent-primary)]"

    return `
    <div class="${sectionClass}">
        <div class="${headerClass}">
            <div class="${tabClass} ${activeBibleTab === 'translations' ? activeTabClass : ''} bible-sub-tab" data-tab="translations">
                TRANSLATIONS
            </div>
            <div class="${tabClass} ${activeBibleTab === 'scripture' ? activeTabClass : ''} bible-sub-tab" data-tab="scripture">
                SCRIPTURE
            </div>
        </div>
        
        <div class="flex-1 overflow-hidden relative">
             ${activeBibleTab === 'scripture' ? renderScriptureForm() : renderTranslationsList()}
        </div>
    </div>
    `
}

function renderScriptureForm(): string {
    const bodyClass = "flex-1 overflow-y-auto p-4 flex flex-col gap-4 h-full"
    const inputClass = "w-full p-2 bg-bg-tertiary border border-border-color rounded-sm text-text-primary text-sm focus:border-accent-primary outline-none"
    const labelClass = "text-xs font-semibold text-text-secondary uppercase mb-1 block"
    const btnClass = "w-full py-2 px-4 bg-accent-primary text-white font-medium rounded-sm hover:bg-accent-secondary transition-colors"

    return `
        <div class="${bodyClass}">
            <div>
                <label class="${labelClass}">Reference</label>
                <input type="text" id="scripture-ref" class="${inputClass}" placeholder="e.g. John 3:16" />
            </div>
            
            <div>
                <label class="${labelClass}">Version</label>
                <input type="text" id="scripture-version" class="${inputClass}" placeholder="e.g. NIV" value="NIV" />
            </div>

            <div class="flex-1 flex flex-col min-h-0">
                <label class="${labelClass}">Text</label>
                <textarea id="scripture-text" class="${inputClass} flex-1 resize-none" placeholder="Paste scripture text here..."></textarea>
            </div>

            <button id="add-scripture-btn" class="${btnClass}">
                ${ICONS.plus} Add to Schedule
            </button>
        </div>
    `
}

function renderTranslationsList(): string {
    const list = ['NIV - New International Version', 'KJV - King James Version', 'ESV - English Standard Version']
    return `
        <div class="p-2 flex flex-col gap-1">
            ${list.map(t => `
                <div class="px-3 py-2 bg-bg-tertiary border border-transparent rounded hover:border-accent-primary cursor-pointer text-sm">
                    ${t}
                </div>
            `).join('')}
             <div class="text-xs text-text-muted italic text-center mt-4">More translations coming soon</div>
        </div>
     `
}

export function initScripturePickerListeners(): void {
    const section = document.querySelector('.scripture-section')
    if (!section) return

    // Tabs
    section.querySelectorAll('.bible-sub-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab') as 'translations' | 'scripture'
            if (tabId) {
                activeBibleTab = tabId
                const newHTML = renderScripturePicker()
                section.outerHTML = newHTML
                initScripturePickerListeners()
            }
        })
    })

    // Form Listeners
    if (activeBibleTab === 'scripture') {
        const btn = document.getElementById('add-scripture-btn')
        if (btn) {
            btn.addEventListener('click', () => {
                const refLink = document.getElementById('scripture-ref') as HTMLInputElement
                const verLink = document.getElementById('scripture-version') as HTMLInputElement
                const textLink = document.getElementById('scripture-text') as HTMLTextAreaElement

                const reference = refLink.value.trim()
                const version = verLink.value.trim()
                const text = textLink.value.trim()

                if (!reference || !text) {
                    alert('Please enter reference and text')
                    return
                }

                addItemToSchedule({
                    id: crypto.randomUUID(),
                    type: 'scripture',
                    reference,
                    translation: version,
                    verses: [{
                        book: reference.split(' ')[0] || 'Unknown',
                        chapter: 1,
                        verse: 1,
                        text: text
                    }]
                })

                textLink.value = ''
                refLink.value = ''
                refLink.focus()
            })
        }
    }
}
