/**
 * ListItem - Reusable list item component
 * Displays thumbnail, title, subtitle, and action buttons
 */


export interface ListItemOptions {
    id: string
    typeIcon?: string             // SVG string for small type icon
    thumbnail?: string | null     // URL or null 
    thumbnailColor?: string       // Fallback color class if no image
    title: string
    subtitle?: string
    badge?: { text: string; color: string }
    actions?: ListItemAction[]
    onClick?: () => void
    onDoubleClick?: () => void
    onContextMenu?: (e: MouseEvent) => void
    draggable?: boolean
    onDragStart?: (e: DragEvent) => void
    isActive?: boolean
    searchQuery?: string // NEW: Query to highlight
}

export interface ListItemAction {
    icon: string
    title: string
    onClick: (e: MouseEvent) => void
    className?: string
    danger?: boolean
}

function highlightText(text: string, query?: string): string {
    if (!query || !text) return text

    // Split query into tokens, filter out empty and very short ones (unless query is short)
    const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 0)
    if (tokens.length === 0) return text

    // Escape regex characters for all tokens
    const escapedTokens = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

    // Create alternation regex: (token1|token2|token3)
    // Use word boundary check if possible, or just loose match? 
    // User wants "patchy" matching, so "amaz" should match inside "Amazing". 
    // So simple alternation is best.
    const pattern = `(${escapedTokens.join('|')})`
    const regex = new RegExp(pattern, 'gi')

    return text.replace(regex, '<span class="text-blue-400 font-bold bg-blue-500/30 rounded-sm px-0.5 mx-[-2px]">$1</span>')
}

export function createListItem(options: ListItemOptions): HTMLElement {
    const el = document.createElement('div')
    el.dataset.id = options.id
    // Height h-12 (48px). Removed border-l-4. Added relative for absolute positioning of active strip.
    el.className = `group relative flex items-center h-12 w-full bg-gray-900 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors overflow-hidden select-none ${options.isActive ? 'bg-blue-900/20' : ''}`

    if (options.draggable) {
        el.draggable = true
        el.addEventListener('dragstart', e => options.onDragStart?.(e))
    }

    // Active Indicator Strip (Absolute to not affect layout)
    if (options.isActive) {
        const activeStrip = document.createElement('div')
        activeStrip.className = 'absolute left-0 top-0 bottom-0 w-1 bg-blue-500 z-20'
        el.appendChild(activeStrip)
    }

    // 1. Type Icon
    if (options.typeIcon) {
        const typeIconEl = document.createElement('div')
        // Centered icon in w-6. No active border pushing it.
        typeIconEl.className = 'w-6 h-full flex-shrink-0 flex items-center justify-center text-gray-500 border-r border-gray-800 bg-black/20'
        typeIconEl.innerHTML = `<span class="w-3.5 h-3.5">${options.typeIcon}</span>`
        el.appendChild(typeIconEl)
    }

    // 2. Thumbnail
    const thumb = document.createElement('div')
    // Border added: border-r border-gray-700/50
    thumb.className = 'h-full aspect-video flex-shrink-0 relative flex items-center justify-center border-r border-gray-700/50'

    if (options.thumbnail) {
        thumb.innerHTML = `<img src="${options.thumbnail}" class="w-full h-full object-cover" alt="">`
    } else {
        // Fallback styling
        thumb.className += ` ${options.thumbnailColor || 'bg-gray-800'}`
        thumb.innerHTML = `<div class="w-full h-full opacity-30 bg-gradient-to-br from-white/10 to-transparent"></div>`
    }
    el.appendChild(thumb)

    // 3. Content
    const content = document.createElement('div')
    content.className = 'flex-1 min-w-0 px-3 flex flex-col justify-center gap-0.5'

    const titleRow = document.createElement('div')
    titleRow.className = 'flex items-center gap-2'

    // Highlight Title
    const titleHtml = highlightText(options.title, options.searchQuery)
    // Refined Typography: font-semibold (was bold), text-gray-300 (was 200) for softer look
    titleRow.innerHTML = `<span class="text-sm font-semibold text-gray-300 truncate group-hover:text-white leading-tight tracking-tight">${titleHtml}</span>`

    if (options.badge) {
        titleRow.innerHTML += `<span class="text-[9px] uppercase font-bold px-1 py-px rounded-sm ${options.badge.color}">${options.badge.text}</span>`
    }
    content.appendChild(titleRow)

    if (options.subtitle) {
        const sub = document.createElement('div')
        // Refined Subtitle: text-[10px] (smaller), uppercase tracking-wider (sleeker)
        sub.className = 'text-[10px] text-gray-500 truncate font-medium uppercase tracking-wider opacity-70 leading-tight mt-0.5'
        // Highlight Subtitle
        sub.innerHTML = highlightText(options.subtitle, options.searchQuery)
        content.appendChild(sub)
    }
    el.appendChild(content)

    // 4. Slide-in Actions
    if (options.actions?.length) {
        const actionsContainer = document.createElement('div')
        actionsContainer.className = 'absolute right-0 top-0 h-full flex transform translate-x-full group-hover:translate-x-0 transition-transform duration-200 ease-out z-10 box-content'

        options.actions.forEach(action => {
            const btn = document.createElement('button')
            // Flush buttons, square
            btn.className = `h-full w-10 flex items-center justify-center border-l border-gray-700 transition-colors ${action.danger
                ? 'bg-red-900/80 hover:bg-red-600 text-red-200 hover:text-white'
                : 'bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white'
                } ${action.className || ''}`

            btn.title = action.title

            // Adjust icon size
            btn.innerHTML = `<span class="w-4 h-4">${action.icon}</span>`

            btn.addEventListener('click', e => {
                e.stopPropagation()
                action.onClick(e)
            })
            actionsContainer.appendChild(btn)
        })
        el.appendChild(actionsContainer)
    }

    // Events
    if (options.onClick) el.addEventListener('click', options.onClick)
    if (options.onDoubleClick) el.addEventListener('dblclick', options.onDoubleClick)
    if (options.onContextMenu) el.addEventListener('contextmenu', e => {
        e.preventDefault()
        options.onContextMenu!(e)
    })

    return el
}
