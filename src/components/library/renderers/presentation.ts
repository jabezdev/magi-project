/**
 * Presentation Library Renderer
 */

import { PresentationItem } from '../../../types'
import { LibraryRenderer, LibraryItemContext } from '../types'
import { createListItem } from '../../shared'
import { ICONS } from '../../../constants/icons'

export const PresentationLibraryRenderer: LibraryRenderer = {
    renderItem(item: PresentationItem, ctx: LibraryItemContext): HTMLElement {
        const slideCount = item.slides?.length || 0
        const isCanva = item.presentation_type === 'canva'
        const badge = isCanva
            ? { text: 'Canva', color: 'bg-cyan-900 text-cyan-300' }
            : slideCount > 0
                ? { text: `${slideCount} slides`, color: 'bg-gray-700 text-gray-300' }
                : undefined

        return createListItem({
            id: item.id,
            typeIcon: ICONS.slides,
            thumbnail: item.slides?.[0]?.content, // Use first slide as thumb
            thumbnailColor: 'bg-orange-900/30',
            title: item.title,
            subtitle: isCanva ? 'Canva Presentation' : `${slideCount} slides`,
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

    getMetadata(item: PresentationItem): string {
        if (item.presentation_type === 'canva') return 'Canva'
        return `${item.slides?.length || 0} slides`
    }
}
