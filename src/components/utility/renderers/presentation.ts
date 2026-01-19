import { UtilityRenderer, UtilityRendererContext } from '../types'
import { LibraryItem } from '../../../types'

class PresentationUtilityRenderer implements UtilityRenderer {
    render(container: HTMLElement, item: LibraryItem, _ctx: UtilityRendererContext) {
        container.innerHTML = `
            <div class="panel-header flex items-center justify-between px-4 bg-gray-800 border-b border-gray-700 h-9 shrink-0 gap-2">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Slide Navigator</span>
                 <span class="text-[10px] text-gray-500 truncate max-w-[100px]">${item.title}</span>
            </div>
             <div class="flex-1 flex overflow-hidden">
                <!-- Slide Grid -->
                <div class="flex-1 overflow-y-auto p-2 grid grid-cols-3 gap-2 content-start border-r border-gray-800">
                     <!-- Dummy Slides -->
                     ${[1, 2, 3, 4, 5, 6].map(n => `
                        <div class="aspect-video bg-gray-800 border border-gray-700 hover:border-blue-500 flex items-center justify-center text-xs text-gray-500 cursor-pointer">
                            Slide ${n}
                        </div>
                     `).join('')}
                </div>
                
                <!-- Notes -->
                <div class="w-1/3 bg-[#0a0a0a] p-2 flex flex-col">
                    <span class="text-[10px] font-bold text-gray-500 mb-1 uppercase">Speaker Notes</span>
                    <div class="flex-1 text-gray-400 text-xs overflow-y-auto">
                        No notes for current slide.
                    </div>
                </div>
            </div>
        `
    }
}

export const presentationUtilityRenderer = new PresentationUtilityRenderer()
