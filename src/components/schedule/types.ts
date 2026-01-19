/**
 * Schedule Types - Shared interfaces for schedule renderers
 */

import { ScheduleItem, LibraryItem } from '../../types'

export interface ScheduleItemContext {
    onPreview: (item: ScheduleItem) => void
    onRemove: (item: ScheduleItem) => void
    onOpenOverride: (target: HTMLElement, item: ScheduleItem) => void
}

export interface ScheduleRenderer {
    /** Render schedule item row */
    renderItem(scheduleItem: ScheduleItem, libraryItem: LibraryItem | undefined, ctx: ScheduleItemContext): HTMLElement

    /** Get icon for this type */
    getIcon?(): string

    /** Get subtitle from schedule overrides or library item */
    getSubtitle?(scheduleItem: ScheduleItem, libraryItem: LibraryItem | undefined): string
}
