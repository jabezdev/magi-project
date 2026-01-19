import { ScriptureItem } from '../../types'
import { ConfidenceContext } from '../types'
import { store } from '../../state/store'

export function renderScriptureConfidence(item: ScriptureItem, ctx: ConfidenceContext) {
    const slides = item.slides || []
    const currentSlideIndex = store.state.live.slide_index || 0
    const count = slides.length

    if (ctx.infoContainer) ctx.infoContainer.textContent = `${currentSlideIndex + 1}/${count}`

    // Current Slide
    const currentSlide = slides[currentSlideIndex]
    if (currentSlide) {
        ctx.currentContainer.className = "flex-1 flex flex-col p-8 items-center justify-center text-center bg-black border-x-8 border-yellow-500"
        ctx.currentContainer.innerHTML = `
            <div class="text-2xl text-yellow-500 font-bold uppercase mb-4 tracking-widest">${currentSlide.label || ''}</div>
            <div class="text-6xl font-bold leading-snug text-white whitespace-pre-wrap max-w-6xl">${currentSlide.text || ''}</div>
         `
    } else {
        ctx.currentContainer.className = "flex-1 flex flex-col p-8 items-center justify-center text-center bg-black"
        ctx.currentContainer.innerHTML = `<div class="text-gray-500 text-4xl">End of Content</div>`
    }

    // Next Slide
    const nextSlide = slides[currentSlideIndex + 1]
    ctx.nextContainer.innerHTML = ''
    if (nextSlide) {
        ctx.nextContainer.innerHTML = `
            <div class="text-sm text-gray-400 font-bold uppercase mb-1">NEXT: ${nextSlide.label || 'SLIDE'}</div>
            <div class="text-3xl font-medium text-gray-300 whitespace-pre-wrap line-clamp-2">${nextSlide.text || ''}</div>
          `
    } else {
        ctx.nextContainer.innerHTML = `<div class="text-gray-600 italic mt-4">End of Item</div>`
    }

    // Previous - not typically shown for scripture in simplified view, but we can clear it or try to showprev
    if (ctx.prevContainer) {
        ctx.prevContainer.innerHTML = ''
    }

    // Hide strip
    if (ctx.stripContainer) ctx.stripContainer.classList.add('hidden')
}
