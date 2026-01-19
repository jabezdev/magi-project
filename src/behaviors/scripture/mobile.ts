import { ScriptureItem } from '../../types'
import { MobileContext } from '../types'

export function renderScriptureMobile(item: ScriptureItem, ctx: MobileContext) {
    const slides = item.slides || []
    const container = ctx.container

    if (slides.length > 0) {
        slides.forEach((slide: { label: string, text: string }, index: number) => {
            const div = document.createElement('div')
            div.className = 'mb-8 p-4 rounded-xl transition-all duration-300 border border-transparent'
            div.id = `mob-part-${index}`

            div.innerHTML = `
                <div class="text-xs font-bold text-amber-600 uppercase mb-2 part-label tracking-widest bg-amber-50 inline-block px-2 py-1 rounded">${slide.label || 'VERSE'}</div>
                <div class="text-2xl leading-relaxed text-gray-900 whitespace-pre-wrap font-serif part-text">"${slide.text}"</div>
            `
            container.appendChild(div)
        })
    } else {
        // Fallback for single block
        const div = document.createElement('div')
        div.id = 'mob-part-0'
        div.className = 'flex flex-col h-full justify-center p-4'
        div.innerHTML = `
            <div class="text-2xl leading-loose font-serif text-gray-800 p-6 bg-amber-50 rounded-lg border border-amber-100 shadow-sm">
                "${item.text_content}"
            </div>
            <div class="text-base text-amber-800 font-bold mt-6 text-right px-6">
                — ${item.reference_title}
            </div>
        `
        container.appendChild(div)
    }

    const spacer = document.createElement('div')
    spacer.className = "h-40"
    container.appendChild(spacer)
}
