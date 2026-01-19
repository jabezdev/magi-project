/**
 * Video Schedule Renderer
 */

import { ScheduleItem, VideoItem } from '../../../types'
import { ScheduleRenderer, ScheduleItemContext } from '../types'
import { ICONS } from '../../../constants/icons'
import { createListItem } from '../../shared/ListItem'

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const VideoScheduleRenderer: ScheduleRenderer = {
    renderItem(scheduleItem: ScheduleItem, libraryItem: VideoItem | undefined, ctx: ScheduleItemContext): HTMLElement {
        const title = scheduleItem.label || libraryItem?.title || 'Unknown Video'
        const duration = libraryItem?.duration_total ? formatDuration(libraryItem.duration_total) : ''

        return createListItem({
            id: scheduleItem.id,
            typeIcon: ICONS.video,
            thumbnail: libraryItem?.thumbnail_path,
            thumbnailColor: 'bg-blue-900/30',
            title,
            subtitle: duration,
            draggable: true,
            onDragStart: (e) => {
                e.dataTransfer?.setData('application/json', JSON.stringify(scheduleItem))
            },
            onClick: () => ctx.onPreview(scheduleItem),
            actions: [
                {
                    icon: ICONS.close,
                    title: 'Remove',
                    onClick: () => ctx.onRemove(scheduleItem),
                    danger: true
                }
            ]
        })
    },

    getIcon() {
        return ICONS.video
    }
}
