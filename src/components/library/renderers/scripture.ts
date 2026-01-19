/**
 * Scripture Library Renderer
 */

import { ScriptureItem } from '../../../types'
import { LibraryRenderer, LibraryItemContext } from '../types'
import { createListItem } from '../../shared'
import { ICONS } from '../../../constants/icons'

export const ScriptureLibraryRenderer: LibraryRenderer = {
    renderItem(item: ScriptureItem, ctx: LibraryItemContext): HTMLElement {
        const slideCount = item.slides?.length || 0
        const subtitle = [item.translation_id, slideCount > 0 ? `${slideCount} slides` : null].filter(Boolean).join(' • ')

        return createListItem({
            id: item.id,
            typeIcon: ICONS.book,
            thumbnailColor: 'bg-yellow-900/30',
            title: item.title,
            subtitle,
            searchQuery: ctx.searchQuery,
            badge: item.translation_id ? { text: item.translation_id, color: 'bg-yellow-900 text-yellow-300' } : undefined,
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

    getMetadata(item: ScriptureItem): string {
        return item.translation_id || 'Scripture'
    }
}
