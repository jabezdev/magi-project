import { state } from '../../state'
import { ICONS } from '../../constants'
import { addItemToSchedule } from '../../actions'

// Local state for media type
let activeMediaType: 'video' | 'image' = 'video'

export function renderMediaLibraryList(): string {
    const videos = state.availableVideos || []
    // TODO: Add support for images in state
    const images: any[] = []

    const sectionClass = "flex flex-col flex-1 overflow-hidden min-w-0 bg-bg-primary media-library-section h-full"
    const bodyClass = "flex-1 overflow-y-auto p-2"
    const gridClass = "grid grid-cols-2 gap-2"

    // Header Style customized for "[Videos] [+] [Images] [+]"
    const headerClass = "flex items-center bg-bg-secondary border-b border-border-color shrink-0 h-[2.2rem] px-0"

    const tabClass = "flex-1 h-full flex items-center justify-center text-xs font-medium text-text-muted cursor-pointer hover:bg-bg-hover transition-colors border-r border-border-color relative z-10"
    const activeTabClass = "bg-bg-tertiary text-text-primary shadow-[inset_0_-2px_0_0_var(--accent-primary)]"

    const addBtnClass = "h-full w-[2.2rem] flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover border-r border-border-color transition-colors z-20"

    return `
    <div class="${sectionClass}">
        <div class="${headerClass}">
            <!-- Videos Tab -->
            <div class="${tabClass} ${activeMediaType === 'video' ? activeTabClass : ''} media-sub-tab" data-type="video">
                VIDEOS
            </div>
            <button class="${addBtnClass} add-media-file-btn" data-type="video" title="Refresh/Add Video">${ICONS.plus}</button>
            
            <!-- Images Tab -->
            <div class="${tabClass} ${activeMediaType === 'image' ? activeTabClass : ''} media-sub-tab" data-type="image">
                IMAGES
            </div>
            <button class="${addBtnClass} add-media-file-btn" data-type="image" title="Add Image">${ICONS.plus}</button>
        </div>
        
        <div class="${bodyClass}">
            <div class="${gridClass}" id="media-library-grid">
                ${activeMediaType === 'video' ? renderMediaItems(videos, 'video') : renderMediaItems(images, 'image')}
            </div>
        </div>
    </div>
    `
}

function renderMediaItems(items: any[], type: 'video' | 'image'): string {
    if (items.length === 0) {
        return `<div class="col-span-2 text-xs text-text-muted text-center py-4 italic">No ${type}s found</div>`
    }

    return items.map(item => {
        const thumbSrc = item.thumbnail || item.path
        const isImage = type === 'image'

        const itemClass = "relative aspect-video bg-black rounded-sm overflow-hidden cursor-pointer group border border-transparent hover:border-accent-primary"
        const labelClass = "absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[0.65rem] px-1 py-0.5 truncate"
        const badgeClass = "absolute top-1 right-1 bg-black/60 text-white text-[0.55rem] px-1 rounded"

        return `
         <div class="${itemClass} media-library-item" data-path="${item.path}" data-name="${item.name}" data-type="${type}" draggable="true">
            ${isImage
                ? `<img src="${thumbSrc}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100" loading="lazy" />`
                : `<video src="${thumbSrc}#t=1" class="w-full h-full object-cover opacity-80 group-hover:opacity-100" preload="metadata"></video>`
            }
            <div class="${labelClass}">${item.name}</div>
            <div class="${badgeClass}">${type === 'video' ? 'VID' : 'IMG'}</div>
            
            <button class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-accent-primary/90 text-white rounded-md opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity shadow-lg add-to-schedule-btn" title="Add to Schedule">
                ${ICONS.plus}
            </button>
         </div>
         `
    }).join('')
}

export function initMediaLibraryListeners(): void {
    const section = document.querySelector('.media-library-section')
    if (!section) return

    // Sub-Tabs
    section.querySelectorAll('.media-sub-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const type = tab.getAttribute('data-type') as 'video' | 'image'
            if (type) {
                activeMediaType = type
                // Re-render
                const newHTML = renderMediaLibraryList()
                section.outerHTML = newHTML
                // Re-init listeners on new DOM
                initMediaLibraryListeners()
            }
        })
    })

    // Add Media Buttons (Header)
    section.querySelectorAll('.add-media-file-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const type = btn.getAttribute('data-type')
            if (type === 'video') {
                // Refresh
                await fetch('/api/videos/refresh', { method: 'POST' })
            } else {
                alert('Image support coming soon')
            }
        })
    })

    // Add to Schedule Buttons (Item)
    section.querySelectorAll('.add-to-schedule-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation()
            const itemEl = (e.target as HTMLElement).closest('.media-library-item')
            if (!itemEl) return

            const path = itemEl.getAttribute('data-path') || ''
            const name = itemEl.getAttribute('data-name') || 'Media'
            const type = itemEl.getAttribute('data-type') || 'video'

            addItemToSchedule({
                id: crypto.randomUUID(),
                type: type as 'video' | 'image',
                name: name,
                url: path,
                isYouTube: false,
                loop: false
            })
        })
    })

    // Drag and Drop
    section.querySelectorAll('.media-library-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            const event = e as DragEvent
            const path = item.getAttribute('data-path')
            const name = item.getAttribute('data-name')
            const type = item.getAttribute('data-type') || 'video'

            const data = {
                type,
                name,
                path
            }
            event.dataTransfer?.setData('application/json', JSON.stringify(data))
            event.dataTransfer!.effectAllowed = 'copy'
        })
    })
}
