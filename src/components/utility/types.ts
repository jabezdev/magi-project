import { LibraryItem } from '../../types'

export interface UtilityRendererContext {
    context: 'preview' | 'live'
}

export interface UtilityRenderer {
    render(container: HTMLElement, item: LibraryItem, ctx: UtilityRendererContext): void
}
