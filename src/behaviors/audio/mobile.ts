import { LibraryItem } from '../../types'
import { MobileContext } from '../types'

export function renderAudioMobile(item: LibraryItem, ctx: MobileContext) {
    ctx.container.innerHTML = `
        <div class="flex flex-col items-center justify-center pt-20">
            <div class="text-6xl mb-6">🔊</div>
            <div class="font-bold text-gray-900 text-xl mb-2">AUDIO PLAYING</div>
             <div class="text-gray-500 text-center px-8 mb-4">${item.title}</div>
            
            <div class="text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded-full mt-6 font-bold border border-gray-200">Checking levels...</div>
        </div>
    `
}
