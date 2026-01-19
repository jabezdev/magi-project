import { PresentationItem } from '../../types'
import { MobileContext } from '../types'

export function renderPresentationMobile(item: PresentationItem, ctx: MobileContext) {
    const isCanva = item.presentation_type === 'canva'

    ctx.container.innerHTML = `
        <div class="flex flex-col items-center justify-center pt-20">
            <div class="text-6xl mb-6">📊</div>
            <div class="font-bold text-gray-900 text-xl mb-2">Showing ${isCanva ? 'CANVA ' : ''}PRESENTATION</div>
            <div class="text-gray-500 text-center px-8 mb-4">${item.title}</div>
            <div class="text-gray-400 text-center px-8 text-sm">Visuals are on the main screen.</div>
            
            <div class="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full mt-6 font-bold border border-purple-200">PRESENTATION LIVE</div>
        </div>
    `
}
