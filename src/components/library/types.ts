/**
 * Library Types - Shared interfaces for library renderers
 */

import { LibraryItem } from '../../types'

export interface LibraryItemContext {
    onPreview: (item: LibraryItem) => void
    onAddToSchedule: (item: LibraryItem) => void
    onEdit: (item: LibraryItem) => void
    onDelete: (item: LibraryItem) => void
    onContextMenu: (e: MouseEvent, item: LibraryItem) => void
    searchQuery?: string
}

export interface LibraryRenderer {
    /** Render item row for the library list */
    renderItem(item: LibraryItem, ctx: LibraryItemContext): HTMLElement

    /** Get thumbnail URL or null */
    getThumbnail?(item: LibraryItem): string | null

    /** Get formatted metadata string */
    getMetadata?(item: LibraryItem): string
}
