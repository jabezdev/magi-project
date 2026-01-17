import { Modal } from '../Modal'
import { api } from '../../services/api'
import { GlobalSettings } from '../../types'
import { ICONS } from '../../constants/icons'
import { showToast } from './ConfirmModal'

// Tab Renderers
import { renderGeneral } from './settings/GeneralTab'
import { renderMainDisplay } from './settings/DisplayTab'
import { renderConfidence } from './settings/ConfidenceTab'
import { renderLowerThirds } from './settings/LowerThirdsTab'
import { renderMobile } from './settings/MobileTab'
import { renderLayout } from './settings/LayoutTab'
import { renderColors } from './settings/ColorsTab'

type SettingsTab = 'general' | 'main' | 'confidence' | 'thirds' | 'mobile' | 'layout' | 'colors'

export function openSettingsModal() {
    api.settings.get().then(settings => {
        new SettingsController(settings)
    }).catch(err => {
        showToast({ message: 'Failed to load settings', type: 'error' })
        console.error(err)
    })
}

class SettingsController {
    private settings: GlobalSettings
    private currentTab: SettingsTab = 'general'
    private modal: Modal
    private contentContainer: HTMLElement
    private sidebarButtons: Map<SettingsTab, HTMLButtonElement> = new Map()

    constructor(initialSettings: GlobalSettings) {
        // Deep clone to avoid mutating local state references before save
        this.settings = JSON.parse(JSON.stringify(initialSettings))

        const { modal, content, sidebar } = this.renderShell()
        this.modal = modal
        this.contentContainer = content

        this.setupSidebar(sidebar)
        this.renderTab()
    }

    private renderShell() {
        // Inner container for Sidebar + Content
        const container = document.createElement('div')
        container.className = 'flex h-[75vh] w-full bg-zinc-900 text-zinc-100 overflow-hidden'

        // Sidebar
        const sidebar = document.createElement('div')
        sidebar.className = 'w-72 flex-shrink-0 bg-zinc-950 border-r border-zinc-800 p-0 overflow-y-auto flex flex-col'

        // Content Area
        const content = document.createElement('div')
        content.className = 'flex-1 overflow-y-auto p-10 bg-zinc-900 custom-scrollbar'

        // Footer Content
        const footerActions = document.createElement('div')
        footerActions.className = 'flex w-full justify-end gap-3'
        footerActions.innerHTML = `
            <button class="px-6 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-wide" id="btn-cancel">Cancel</button>
            <button class="px-6 py-2 text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors uppercase tracking-wide rounded-lg shadow-lg shadow-blue-900/20" id="btn-save">Save Changes</button>
        `

        // Create Modal with custom width and no padding on content wrapper (so sidebar sits flush)
        const modal = new Modal('Settings', container, footerActions, {
            width: 'w-[90vw] max-w-7xl',
            padding: false
        })

        container.appendChild(sidebar)
        container.appendChild(content)

        footerActions.querySelector('#btn-cancel')?.addEventListener('click', () => modal.close())
        footerActions.querySelector('#btn-save')?.addEventListener('click', () => this.save())

        return { modal, content, sidebar }
    }

    private setupSidebar(sidebar: HTMLElement) {
        const tabs: { id: SettingsTab, label: string, icon: string }[] = [
            { id: 'general', label: 'General', icon: ICONS.settings },
            { id: 'main', label: 'Main Projection', icon: ICONS.screen },
            { id: 'confidence', label: 'Confidence Monitor', icon: ICONS.monitor },
            { id: 'thirds', label: 'Lower Thirds', icon: ICONS.media },
            { id: 'mobile', label: 'Mobile View', icon: ICONS.file },
            { id: 'layout', label: 'Layout & Controls', icon: ICONS.grip },
            { id: 'colors', label: 'Theme & Colors', icon: ICONS.palette }
        ]

        tabs.forEach(tab => {
            const btn = document.createElement('button')
            btn.className = `w-full text-left px-6 py-4 font-bold text-sm flex items-center gap-3 transition-colors border-b border-zinc-800
                ${this.currentTab === tab.id ? 'bg-zinc-800 text-blue-400 border-l-4 border-l-blue-500' : 'bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`

            btn.innerHTML = `<span class="w-5 h-5 fill-current">${tab.icon}</span> ${tab.label}`

            btn.addEventListener('click', () => {
                this.currentTab = tab.id
                this.updateSidebarState()
                this.renderTab()
            })

            this.sidebarButtons.set(tab.id, btn)
            sidebar.appendChild(btn)
        })
    }

    private updateSidebarState() {
        this.sidebarButtons.forEach((btn, id) => {
            if (id === this.currentTab) {
                btn.className = 'w-full text-left px-6 py-4 font-bold text-sm flex items-center gap-3 transition-colors border-b border-zinc-900 bg-zinc-900 text-blue-500 border-l-2 border-l-blue-500'
            } else {
                btn.className = 'w-full text-left px-6 py-4 font-bold text-sm flex items-center gap-3 transition-colors border-b border-zinc-900 bg-transparent text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
            }
        })
    }

    private renderTab() {
        this.contentContainer.innerHTML = ''
        const container = document.createElement('div')
        container.className = 'space-y-10 animate-fade-in'

        switch (this.currentTab) {
            case 'general': renderGeneral(container, this.settings); break;
            case 'main': renderMainDisplay(container, this.settings); break;
            case 'confidence': renderConfidence(container, this.settings); break;
            case 'thirds': renderLowerThirds(container, this.settings); break;
            case 'mobile': renderMobile(container, this.settings); break;
            case 'layout': renderLayout(container, this.settings); break;
            case 'colors': renderColors(container, this.settings); break;
        }

        this.contentContainer.appendChild(container)
    }

    private async save() {
        try {
            await api.settings.update(this.settings)
            this.modal.close()
        } catch (e) {
            showToast({ message: 'Failed to save settings', type: 'error' })
            console.error(e)
        }
    }
}
