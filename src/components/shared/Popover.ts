/**
 * Popover - Generic positioned popover component
 * Handles positioning, click-outside dismissal, and cleanup
 */

export interface PopoverOptions {
    target: HTMLElement          // Element to anchor to
    content: HTMLElement         // Content to display
    position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
    offset?: number              // Gap between target and popover
    onClose?: () => void         // Callback when closed
}

export class Popover {
    private element: HTMLElement
    private options: PopoverOptions
    private closeHandler: (e: MouseEvent) => void

    constructor(options: PopoverOptions) {
        this.options = { position: 'bottom', offset: 8, ...options }
        this.element = document.createElement('div')
        this.element.className = 'fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden'
        this.element.appendChild(options.content)

        this.closeHandler = (e: MouseEvent) => {
            if (!this.element.contains(e.target as Node) && !this.options.target.contains(e.target as Node)) {
                this.close()
            }
        }
    }

    open() {
        document.body.appendChild(this.element)
        this.position()

        // Delay to prevent immediate close from same click
        setTimeout(() => {
            document.addEventListener('click', this.closeHandler)
        }, 10)
    }

    private position() {
        const rect = this.options.target.getBoundingClientRect()
        const offset = this.options.offset!

        // Calculate position
        let top = 0, left = 0

        switch (this.options.position) {
            case 'bottom':
                top = rect.bottom + offset
                left = rect.left
                break
            case 'top':
                top = rect.top - this.element.offsetHeight - offset
                left = rect.left
                break
            case 'right':
                top = rect.top
                left = rect.right + offset
                break
            case 'left':
                top = rect.top
                left = rect.left - this.element.offsetWidth - offset
                break
            case 'auto':
            default:
                // Default to bottom, flip if needed
                top = rect.bottom + offset
                left = rect.left
                if (top + this.element.offsetHeight > window.innerHeight) {
                    top = rect.top - this.element.offsetHeight - offset
                }
        }

        // Keep within viewport
        left = Math.max(8, Math.min(left, window.innerWidth - this.element.offsetWidth - 8))
        top = Math.max(8, Math.min(top, window.innerHeight - this.element.offsetHeight - 8))

        this.element.style.top = `${top}px`
        this.element.style.left = `${left}px`
    }

    close() {
        document.removeEventListener('click', this.closeHandler)
        this.element.remove()
        this.options.onClose?.()
    }

    getElement() {
        return this.element
    }
}

// Factory function for quick usage
export function showPopover(options: PopoverOptions): Popover {
    const popover = new Popover(options)
    popover.open()
    return popover
}
