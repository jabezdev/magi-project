import { ICONS } from '../../constants'

let activePresentationTab: 'templates' | 'canva' = 'templates'

export function renderPresentationsTab(): string {
    const sectionClass = "flex flex-col flex-1 overflow-hidden min-w-0 bg-bg-primary h-full presentations-section"

    // Header Style customized for "[Templates] [+] [Canva] [+]"
    const headerClass = "flex items-center bg-bg-secondary border-b border-border-color shrink-0 h-[2.2rem] px-0"

    const tabClass = "flex-1 h-full flex items-center justify-center text-xs font-medium text-text-muted cursor-pointer hover:bg-bg-hover transition-colors border-r border-border-color relative z-10"
    const activeTabClass = "bg-bg-tertiary text-text-primary shadow-[inset_0_-2px_0_0_var(--accent-primary)]"

    const addBtnClass = "h-full w-[2.2rem] flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover border-r border-border-color transition-colors z-20"

    return `
    <div class="${sectionClass}">
        <div class="${headerClass}">
             <!-- Templates Tab -->
             <div class="${tabClass} ${activePresentationTab === 'templates' ? activeTabClass : ''} pres-sub-tab" data-tab="templates">
                TEMPLATES
             </div>
             <button class="${addBtnClass} add-pres-btn" data-type="templates" title="New Template">${ICONS.plus}</button>
             
             <!-- Canva Tab -->
             <div class="${tabClass} ${activePresentationTab === 'canva' ? activeTabClass : ''} pres-sub-tab" data-tab="canva">
                CANVA
             </div>
             <button class="${addBtnClass} add-pres-btn" data-type="canva" title="Add Canva">${ICONS.plus}</button>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 flex items-center justify-center text-text-muted italic text-sm">
             ${activePresentationTab === 'templates' ? 'No templates functionality yet' : 'Canva integration coming soon'}
        </div>
    </div>
    `
}

export function initPresentationsTabListeners(): void {
    const section = document.querySelector('.presentations-section')
    if (!section) return

    // Tabs
    section.querySelectorAll('.pres-sub-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab') as 'templates' | 'canva'
            if (tabId) {
                activePresentationTab = tabId
                const newHTML = renderPresentationsTab()
                section.outerHTML = newHTML
                initPresentationsTabListeners()
            }
        })
    })

    // Add Buttons
    section.querySelectorAll('.add-pres-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Feature not implemented yet')
        })
    })
}
