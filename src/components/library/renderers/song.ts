/**
 * Song Library Renderer
 */

import { SongItem } from '../../../types'
import { LibraryRenderer, LibraryItemContext } from '../types'
import { createListItem } from '../../shared'
import { ICONS } from '../../../constants/icons'

export const SongLibraryRenderer: LibraryRenderer = {
    renderItem(item: SongItem, ctx: LibraryItemContext): HTMLElement {
        const partCount = item.parts?.length || 0
        let subtitle = [item.artist, partCount > 0 ? `${partCount} parts` : null].filter(Boolean).join(' • ')

        // Smart search highlighting: If query matches lyrics, show that line
        if (ctx.searchQuery && ctx.searchQuery.length > 2) {
            const query = ctx.searchQuery.toLowerCase()
            const tokens = query.split(/\s+/).filter(t => t.length > 0)

            let bestLine: string | null = null
            let bestScore = 0

            // Check parts for match
            for (const part of item.parts || []) {
                const lines = part.lyrics.split('\n')
                for (const line of lines) {
                    const lineLower = line.toLowerCase()

                    // Score this line
                    let score = 0

                    // Exact substring?
                    if (lineLower.includes(query)) score += 100

                    // Token match?
                    let tokensFound = 0
                    for (const token of tokens) {
                        if (lineLower.includes(token)) {
                            score += 10
                            tokensFound++
                        }
                    }

                    // Bonus for matching all tokens
                    if (tokens.length > 0 && tokensFound === tokens.length) score += 50

                    if (score > bestScore && score > 0) {
                        bestScore = score
                        bestLine = line
                    }
                }
            }

            if (bestLine) {
                subtitle = `... "${bestLine.trim()}" ...`
            }
        }

        return createListItem({
            id: item.id,
            typeIcon: ICONS.music,
            thumbnailColor: 'bg-purple-900/30',
            title: item.title,
            subtitle,
            searchQuery: ctx.searchQuery, // Highlighting applied by ListItem
            badge: item.ccli_number ? { text: 'CCLI', color: 'bg-purple-900 text-purple-300' } : undefined,
            onClick: () => ctx.onPreview(item),
            onDoubleClick: () => ctx.onAddToSchedule(item),
            onContextMenu: (e) => ctx.onContextMenu(e, item),
            draggable: true,
            onDragStart: (e) => {
                e.dataTransfer?.setData('application/json', JSON.stringify({ type: 'library-item', id: item.id }))
            },
            actions: [
                { icon: ICONS.edit, title: 'Edit', onClick: () => ctx.onEdit(item) },
                { icon: ICONS.add, title: 'Add to Schedule', onClick: () => ctx.onAddToSchedule(item) }
            ]
        })
    },

    getThumbnail(): string | null {
        return null // Songs use icon
    },

    getMetadata(item: SongItem): string {
        const parts = [
            item.artist,
            item.key ? `Key: ${item.key}` : null,
            item.tempo ? `${item.tempo} BPM` : null
        ].filter(Boolean)
        return parts.join(' • ')
    }
}
