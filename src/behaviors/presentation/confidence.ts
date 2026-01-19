import { LibraryItem, PresentationItem } from '../../types'
import { ConfidenceContext } from '../types'
import { store } from '../../state/store'

export function renderPresentationConfidence(item: LibraryItem, ctx: ConfidenceContext) {
    const presentation = item as PresentationItem
    const slides = presentation.slides || []


    if (presentation.presentation_type === 'canva') {
        ctx.currentContainer.className = "flex-1 flex flex-col p-8 items-center justify-center text-center bg-black"
        ctx.currentContainer.innerHTML = `
              <div class="text-5xl text-gray-300 font-bold mb-4">CANVA PRESENTATION</div>
              <div class="text-3xl text-gray-500">Interactive Mode</div>
          `
        ctx.nextContainer.innerHTML = ''
        if (ctx.prevContainer) ctx.prevContainer.innerHTML = ''
        if (ctx.stripContainer) ctx.stripContainer.classList.add('hidden')
        return
    }

    const currentSlideIndex = store.state.live.slide_index || 0
    const count = slides.length
    if (ctx.infoContainer) ctx.infoContainer.textContent = `${currentSlideIndex + 1}/${count}`

    // Current
    const currentSlide = slides[currentSlideIndex]
    if (currentSlide) {
        ctx.currentContainer.className = "flex-1 flex flex-col p-8 items-center justify-center text-center bg-black"
        ctx.currentContainer.innerHTML = `
              <div class="h-full flex flex-col items-center justify-center">
                 <img src="${currentSlide.content}" class="max-h-full max-w-full object-contain border-4 border-blue-500" />
                 <div class="text-xl text-gray-500 mt-4 font-bold">SLIDE ${currentSlideIndex + 1}</div>
              </div>
         `
    } else {
        ctx.currentContainer.innerHTML = `<div class="text-gray-500 text-4xl">End of Content</div>`
    }

    // Next
    const nextSlide = slides[currentSlideIndex + 1]
    if (nextSlide) {
        ctx.nextContainer.innerHTML = `
              <div class="h-full flex flex-col items-center justify-center opacity-50">
                 <img src="${nextSlide.content}" class="max-h-full max-w-full object-contain" />
                 <div class="text-xs text-gray-500 mt-1">NEXT SLIDE</div>
              </div>
            `
    } else {
        ctx.nextContainer.innerHTML = `<div class="text-gray-600 italic mt-4">End of Item</div>`
    }

    if (ctx.prevContainer) ctx.prevContainer.innerHTML = ''
    if (ctx.stripContainer) ctx.stripContainer.classList.add('hidden')
}
