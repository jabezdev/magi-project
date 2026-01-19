/**
 * Scripture Schedule Renderer
 */

import { ScheduleItem, ScriptureItem } from '../../../types'
import { ScheduleRenderer, ScheduleItemContext } from '../types'
import { ICONS } from '../../../constants/icons'

import { createListItem } from '../../shared/ListItem'

export const ScriptureScheduleRenderer: ScheduleRenderer = {
    renderItem(scheduleItem: ScheduleItem, libraryItem: ScriptureItem | undefined, ctx: ScheduleItemContext): HTMLElement {
        const title = scheduleItem.label || libraryItem?.title || 'Unknown Scripture'
        const translation = scheduleItem.translation_override || libraryItem?.translation_id || ''

        return createListItem({
            id: scheduleItem.id,
            typeIcon: ICONS.book,
            thumbnailColor: 'bg-yellow-900/30',
            title,
            subtitle: translation,
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
                    className: scheduleItem.translation_override ? 'text-yellow-400' : ''
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
        return ICONS.book
    }
}
