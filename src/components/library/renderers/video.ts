/**
 * Video Library Renderer
 */

import { VideoItem } from '../../../types'
import { LibraryRenderer, LibraryItemContext } from '../types'
import { createListItem } from '../../shared'
import { ICONS } from '../../../constants/icons'

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const VideoLibraryRenderer: LibraryRenderer = {
    renderItem(item: VideoItem, ctx: LibraryItemContext): HTMLElement {
        const isYouTube = item.video_subtype === 'youtube'
        const isBackground = item.video_subtype === 'background'
        const badge = isYouTube
            ? { text: 'YouTube', color: 'bg-red-900 text-red-300' }
            : isBackground
                ? { text: 'BG', color: 'bg-gray-700 text-gray-300' }
                : undefined

        const duration = item.duration_total ? formatDuration(item.duration_total) : ''

        return createListItem({
            id: item.id,
            typeIcon: ICONS.video,
            thumbnail: item.thumbnail_path,
            thumbnailColor: 'bg-blue-900/30',
            title: item.title,
            subtitle: duration,
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

    getThumbnail(item: VideoItem): string | null {
        return item.thumbnail_path || null
    },

    getMetadata(item: VideoItem): string {
        const parts = []
        if (item.duration_total) parts.push(formatDuration(item.duration_total))
        if (item.video_subtype === 'youtube') parts.push('YouTube')
        return parts.join(' • ')
    }
}
