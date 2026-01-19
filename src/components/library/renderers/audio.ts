/**
 * Audio Library Renderer
 */

import { AudioItem } from '../../../types'
import { LibraryRenderer, LibraryItemContext } from '../types'
import { createListItem } from '../../shared'
import { ICONS } from '../../../constants/icons'

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const AudioLibraryRenderer: LibraryRenderer = {
    renderItem(item: AudioItem, ctx: LibraryItemContext): HTMLElement {
        return createListItem({
            id: item.id,
            typeIcon: ICONS.music,
            thumbnailColor: 'bg-pink-900/30',
            title: item.title,
            subtitle: [item.artist, item.duration ? formatDuration(item.duration) : null].filter(Boolean).join(' • '),
            searchQuery: ctx.searchQuery,
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

    getMetadata(item: AudioItem): string {
        const parts = [item.artist]
        if (item.duration) parts.push(formatDuration(item.duration))
        return parts.filter(Boolean).join(' • ')
    }
}
