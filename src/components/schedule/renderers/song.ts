/**
 * Song Schedule Renderer
 */

import { ScheduleItem, SongItem } from '../../../types'
import { ScheduleRenderer, ScheduleItemContext } from '../types'
import { ICONS } from '../../../constants/icons'

import { createListItem } from '../../shared/ListItem'

export const SongScheduleRenderer: ScheduleRenderer = {
    renderItem(scheduleItem: ScheduleItem, libraryItem: SongItem | undefined, ctx: ScheduleItemContext): HTMLElement {
        const title = scheduleItem.label || libraryItem?.title || 'Unknown Song'
        const hasOverride = scheduleItem.arrangement_id || scheduleItem.background_override_id

        return createListItem({
            id: scheduleItem.id,
            typeIcon: ICONS.music,
            thumbnailColor: 'bg-purple-900/30',
            title,
            subtitle: libraryItem?.artist || '',
            draggable: true,
            onDragStart: (e) => {
                e.dataTransfer?.setData('application/json', JSON.stringify(scheduleItem))
            },
            onClick: () => ctx.onPreview(scheduleItem),
            actions: [
                {
                    icon: ICONS.settings,
                    title: 'Override Settings',
                    onClick: (e) => ctx.onOpenOverride(e.target as HTMLElement, scheduleItem),
                    className: hasOverride ? 'text-purple-400' : ''
                },
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
