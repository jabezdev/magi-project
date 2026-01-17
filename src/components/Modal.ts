export interface ModalOptions {
    width?: string
    padding?: boolean
    onClose?: () => void
}

export class Modal {
    element: HTMLElement
    private onClose?: () => void

    constructor(title: string, content: HTMLElement | string, footer?: HTMLElement | string, optionsOrOnClose?: ModalOptions | (() => void)) {
        let options: ModalOptions = {}
        if (typeof optionsOrOnClose === 'function') {
            options.onClose = optionsOrOnClose
        } else if (optionsOrOnClose) {
            options = optionsOrOnClose
        }

        this.onClose = options.onClose
        this.element = document.createElement('div')
        this.element.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm'

        const card = document.createElement('div')
        // Default to max-w-lg unless width provided. Premium style: rounded, subtle border, heavy shadow.
        const widthClass = options.width || 'w-full max-w-lg'
        card.className = `${widthClass} bg-zinc-900 shadow-2xl border border-zinc-800 rounded-xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all`

        // Header
        const headerDiv = document.createElement('div')
        headerDiv.className = 'px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 flex-shrink-0'
        headerDiv.innerHTML = `
            <div class="flex items-center gap-2">
                <h3 class="font-bold text-white text-sm uppercase tracking-wider">${title}</h3>
            </div>
            <button class="text-zinc-500 hover:text-white transition-colors rounded-lg p-1 hover:bg-zinc-800" id="modal-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        `
        headerDiv.querySelector('#modal-close')?.addEventListener('click', () => this.close())
        card.appendChild(headerDiv)

        // Content
        const contentDiv = document.createElement('div')
        // Padding default true
        const paddingClass = options.padding === false ? 'p-0' : 'p-6'
        contentDiv.className = `${paddingClass} overflow-y-auto text-zinc-300 flex-1 custom-scrollbar`

        if (typeof content === 'string') contentDiv.innerHTML = content
        else contentDiv.appendChild(content)
        card.appendChild(contentDiv)

        // Footer
        if (footer) {
            const footerDiv = document.createElement('div')
            footerDiv.className = 'px-6 py-4 bg-zinc-900 border-t border-zinc-800 flex justify-end gap-3 flex-shrink-0'
            if (typeof footer === 'string') footerDiv.innerHTML = footer
            else footerDiv.appendChild(footer)
            card.appendChild(footerDiv)
        }

        this.element.appendChild(card)

        // Click outside to close
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) this.close()
        })

        // Mount
        document.body.appendChild(this.element)
    }

    close() {
        this.element.remove()
        if (this.onClose) this.onClose()
    }
}
