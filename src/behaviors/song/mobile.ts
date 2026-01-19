import { SongItem } from '../../types'
import { MobileContext } from '../types'
import { flattenSongToSlides } from '../../utils/songSlides'


export function renderSongMobile(item: SongItem, ctx: MobileContext) {
    const flattenedSlides = flattenSongToSlides(item)
    const container = ctx.container

    flattenedSlides.forEach((slide, index) => {
        const div = document.createElement('div')
        div.className = 'mb-8 p-6 rounded-xl transition-all duration-300 border border-transparent opacity-50'
        div.id = `mob-part-${index}`

        // Default state is dimmed (opacity-50)
        div.innerHTML = `
            <div class="text-xs font-bold text-blue-400 uppercase mb-2 part-label tracking-widest bg-blue-900/20 inline-block px-2 py-1 rounded border border-blue-900/30">${slide.partLabel}</div>
            <div class="text-3xl leading-relaxed text-gray-400 whitespace-pre-wrap font-medium part-text transition-colors duration-300">${slide.text}</div>
        `
        container.appendChild(div)
    })

    // Add spacer
    const spacer = document.createElement('div')
    spacer.className = "h-40"
    container.appendChild(spacer)
}
