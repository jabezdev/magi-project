import { LibraryItem } from '../../types'
import { MobileContext } from '../types'

export function renderVideoMobile(item: LibraryItem, ctx: MobileContext) {
    ctx.container.innerHTML = `
        <div class="flex flex-col items-center justify-center pt-20 h-full">
            <div class="text-7xl mb-8 animate-pulse">🎥</div>
            <div class="font-bold text-white text-2xl mb-3 tracking-wide">Showing VIDEO</div>
            <div class="text-gray-400 text-center px-8 mb-8 text-lg">${item.title}</div>
            <div class="text-gray-600 text-center px-8 text-sm max-w-sm">Use the main screen or confidence monitor to view the video content.</div>
            
            <div class="mt-12 flex items-center gap-3 bg-red-900/20 border border-red-900/50 px-6 py-2 rounded-full">
                <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <div class="text-xs text-red-400 font-bold tracking-widest">LIVE PLAYBACK</div>
            </div>
        </div>
    `
}
