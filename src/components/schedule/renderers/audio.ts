/**
 * Audio Schedule Renderer
 */

import { ScheduleItem, AudioItem } from '../../../types'
import { ScheduleRenderer, ScheduleItemContext } from '../types'
import { ICONS } from '../../../constants/icons'

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

import { createListItem } from '../../shared/ListItem'

export const AudioScheduleRenderer: ScheduleRenderer = {
    renderItem(scheduleItem: ScheduleItem, libraryItem: AudioItem | undefined, ctx: ScheduleItemContext): HTMLElement {
        const title = scheduleItem.label || libraryItem?.title || 'Unknown Audio'
        const duration = libraryItem?.duration ? formatDuration(libraryItem.duration) : ''

        return createListItem({
            id: scheduleItem.id,
            typeIcon: ICONS.music,
            thumbnailColor: 'bg-pink-900/30',
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
        return ICONS.music
    }
}
