import { UtilityRenderer, UtilityRendererContext } from '../types'
import { LibraryItem } from '../../../types'

export class GenericUtilityRenderer implements UtilityRenderer {
    render(container: HTMLElement, item: LibraryItem, _ctx: UtilityRendererContext) {
        container.innerHTML = `
            <div class="panel-header flex items-center px-4 bg-gray-800 border-b border-gray-700 h-9 shrink-0 gap-2">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Info</span>
            </div>
             <div class="p-4 text-gray-400 text-xs">
                Selected: ${item.title}
            </div>
        `
    }
}

export const genericUtilityRenderer = new GenericUtilityRenderer()
