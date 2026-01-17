/**
 * ContextMenu - A custom dropdown context menu component
 * Replaces the need for browser confirm() dialogs
 */
export interface ContextMenuItem {
    label: string
    icon?: string
    action: () => void
    danger?: boolean
    disabled?: boolean
}

export interface ContextMenuDivider {
    divider: true
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuDivider

export class ContextMenu {
    private element: HTMLElement
    private closeHandler: (e: MouseEvent) => void

    constructor(items: ContextMenuEntry[], x: number, y: number) {
        this.element = document.createElement('div')
        this.element.className = 'fixed z-[100] bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl py-1 min-w-[160px] animate-fade-in'

        // Render items
        items.forEach(entry => {
            if ('divider' in entry) {
                const divider = document.createElement('div')
                divider.className = 'border-t border-zinc-800 my-1'
                this.element.appendChild(divider)
            } else {
                const btn = document.createElement('button')
                btn.className = `w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${entry.danger
                    ? 'text-red-400 hover:bg-red-900/30 hover:text-red-300'
                    : 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
                    } ${entry.disabled ? 'opacity-50 cursor-not-allowed' : ''}`

                if (entry.icon) {
                    btn.innerHTML = `<span class="w-4 h-4">${entry.icon}</span>${entry.label}`
                } else {
                    btn.textContent = entry.label
                }

                if (!entry.disabled) {
                    btn.addEventListener('click', () => {
                        entry.action()
                        this.close()
                    })
                }

                this.element.appendChild(btn)
            }
        })

        // Position - ensure it fits in viewport
        this.element.style.left = `${x}px`
        this.element.style.top = `${y}px`

        document.body.appendChild(this.element)

        // Adjust position if overflowing
        requestAnimationFrame(() => {
            const rect = this.element.getBoundingClientRect()
            if (rect.right > window.innerWidth) {
                this.element.style.left = `${window.innerWidth - rect.width - 8}px`
            }
            if (rect.bottom > window.innerHeight) {
                this.element.style.top = `${window.innerHeight - rect.height - 8}px`
            }
        })

        // Close on click outside
        this.closeHandler = (e: MouseEvent) => {
            if (!this.element.contains(e.target as Node)) {
                this.close()
            }
        }
        setTimeout(() => document.addEventListener('click', this.closeHandler), 0)

        // Close on escape
        const escHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.close()
                document.removeEventListener('keydown', escHandler)
            }
        }
        document.addEventListener('keydown', escHandler)
    }

    close() {
        this.element.remove()
        document.removeEventListener('click', this.closeHandler)
    }
}

/**
 * Helper to open a context menu at mouse position
 */
export function openContextMenu(e: MouseEvent, items: ContextMenuEntry[]) {
    e.preventDefault()
    e.stopPropagation()

    // Close any existing context menus
    document.querySelectorAll('.context-menu-instance').forEach(el => el.remove())

    return new ContextMenu(items, e.clientX, e.clientY)
}
