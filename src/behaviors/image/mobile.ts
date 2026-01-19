import { LibraryItem } from '../../types'
import { MobileContext } from '../types'

export function renderImageMobile(item: LibraryItem, ctx: MobileContext) {
    ctx.container.innerHTML = `
        <div class="flex flex-col items-center justify-center pt-20">
            <div class="text-6xl mb-6">🖼️</div>
            <div class="font-bold text-gray-900 text-xl mb-2">Showing IMAGE</div>
            <div class="text-gray-500 text-center px-8 mb-4">${item.title}</div>
            
            <div class="p-4 border rounded shadow-sm bg-white max-w-xs mx-auto mb-4">
                 <img src="${(item as any).source_url}" class="w-full h-auto rounded" />
            </div>

            <div class="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold border border-blue-200">IMAGE ACTIVE</div>
        </div>
    `
}
