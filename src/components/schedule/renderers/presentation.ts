/**
 * Presentation Schedule Renderer
 */

import { ScheduleItem, PresentationItem } from '../../../types'
import { ScheduleRenderer, ScheduleItemContext } from '../types'
import { ICONS } from '../../../constants/icons'
import { createListItem } from '../../shared/ListItem'

export const PresentationScheduleRenderer: ScheduleRenderer = {
    renderItem(scheduleItem: ScheduleItem, libraryItem: PresentationItem | undefined, ctx: ScheduleItemContext): HTMLElement {
        const title = scheduleItem.label || libraryItem?.title || 'Unknown Presentation'
        const slideCount = libraryItem?.slides?.length || 0

        return createListItem({
            id: scheduleItem.id,
            typeIcon: ICONS.slides,
            thumbnail: libraryItem?.slides?.[0]?.content,
            thumbnailColor: 'bg-orange-900/30',
            title,
            subtitle: `${slideCount} slides`,
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
        return ICONS.slides
    }
}
