/**
 * Image Schedule Renderer
 */

import { ScheduleItem, ImageItem } from '../../../types'
import { ScheduleRenderer, ScheduleItemContext } from '../types'
import { ICONS } from '../../../constants/icons'
import { createListItem } from '../../shared/ListItem'

export const ImageScheduleRenderer: ScheduleRenderer = {
    renderItem(scheduleItem: ScheduleItem, libraryItem: ImageItem | undefined, ctx: ScheduleItemContext): HTMLElement {
        const title = scheduleItem.label || libraryItem?.title || 'Unknown Image'

        return createListItem({
            id: scheduleItem.id,
            typeIcon: ICONS.image,
            thumbnail: libraryItem?.source_url,
            thumbnailColor: 'bg-green-900/30',
            title,
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
        return ICONS.image
    }
}
