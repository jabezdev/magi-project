/**
 * Image Library Renderer
 */

import { ImageItem } from '../../../types'
import { LibraryRenderer, LibraryItemContext } from '../types'
import { createListItem } from '../../shared'
import { ICONS } from '../../../constants/icons'

export const ImageLibraryRenderer: LibraryRenderer = {
    renderItem(item: ImageItem, ctx: LibraryItemContext): HTMLElement {
        const isBackground = item.image_subtype === 'background'
        const badge = isBackground ? { text: 'BG', color: 'bg-gray-700 text-gray-300' } : undefined

        return createListItem({
            id: item.id,
            typeIcon: ICONS.image,
            thumbnail: item.source_url,
            thumbnailColor: 'bg-green-900/30',
            title: item.title,
            searchQuery: ctx.searchQuery,
            badge,
            onClick: () => ctx.onPreview(item),
            onDoubleClick: () => ctx.onAddToSchedule(item),
            onContextMenu: (e) => ctx.onContextMenu(e, item),
            draggable: true,
            onDragStart: (e) => {
                e.dataTransfer?.setData('application/json', JSON.stringify({ type: 'library-item', id: item.id }))
            },
            actions: [
                { icon: ICONS.add, title: 'Add to Schedule', onClick: () => ctx.onAddToSchedule(item) }
            ]
        })
    },

    getThumbnail(item: ImageItem): string | null {
        return item.source_url || null
    },

    getMetadata(): string {
        return 'Image'
    }
}
