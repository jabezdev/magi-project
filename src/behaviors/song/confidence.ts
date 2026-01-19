import { SongItem } from '../../types'
import { ConfidenceContext } from '../types'
import { flattenSongToSlides } from '../../utils/songSlides'
import { store } from '../../state/store'

export function renderSongConfidence(item: SongItem, ctx: ConfidenceContext) {
    const flattenedSlides = flattenSongToSlides(item)
    const currentSlideIndex = store.state.live.slide_index || 0
    const count = flattenedSlides.length

    if (ctx.infoContainer) ctx.infoContainer.textContent = `${currentSlideIndex + 1}/${count}`

    // Current Slide
    const currentSlide = flattenedSlides[currentSlideIndex]
    const currentEl = ctx.currentContainer
    if (currentSlide) {
        currentEl.innerHTML = `
            <div class="text-2xl text-yellow-500 font-bold uppercase mb-4 tracking-widest bg-yellow-900/20 px-4 py-1 rounded inline-block">${currentSlide.partLabel}</div>
            <div class="text-[5rem] font-bold leading-none text-white whitespace-pre-wrap max-w-6xl tracking-tight">${currentSlide.text}</div>
         `
        currentEl.className = "flex-1 flex flex-col p-8 items-center justify-center text-center bg-black w-full"
    } else {
        currentEl.innerHTML = `<div class="text-gray-500 text-4xl">End of Content</div>`
        currentEl.className = "flex-1 flex flex-col p-8 items-center justify-center text-center bg-black"
    }

    // Next Slide
    const nextSlide = flattenedSlides[currentSlideIndex + 1]
    const nextEl = ctx.nextContainer
    nextEl.innerHTML = ''
    if (nextSlide) {
        nextEl.innerHTML = `
            <div class="text-sm text-gray-500 font-bold uppercase mb-1">NEXT: ${nextSlide.partLabel}</div>
            <div class="text-4xl font-medium text-gray-400 whitespace-pre-wrap line-clamp-2 leading-snug">${nextSlide.text}</div>
          `
    } else {
        nextEl.innerHTML = `<div class="text-gray-700 italic text-2xl mt-4">End of Item</div>`
    }

    // Previous Slide
    if (ctx.prevContainer) {
        const prevSlide = flattenedSlides[currentSlideIndex - 1]
        ctx.prevContainer.innerHTML = ''
        if (prevSlide) {
            ctx.prevContainer.innerHTML = `
                <div class="text-3xl font-medium text-gray-500 truncate max-w-4xl line-clamp-2 leading-snug">${prevSlide.text}</div>
                <div class="text-xs text-gray-600 uppercase mt-1">PREV: ${prevSlide.partLabel}</div>
            `
        } else {
            ctx.prevContainer.innerHTML = `<div class="text-gray-800 text-lg">Start</div>`
        }
    }

    // Arrangement Strip
    if (ctx.stripContainer) {
        ctx.stripContainer.classList.remove('hidden')
        ctx.stripContainer.innerHTML = ''

        flattenedSlides.forEach((slide, index) => {
            const isActive = currentSlideIndex === index
            let colorClass = 'bg-gray-700'
            const p = slide.partType.toLowerCase()
            if (p.includes('verse')) colorClass = 'bg-blue-600'
            if (p.includes('chorus')) colorClass = 'bg-red-600'
            if (p.includes('bridge')) colorClass = 'bg-orange-500'
            if (p.includes('tag')) colorClass = 'bg-teal-600'
            if (p.includes('intro') || p.includes('ending')) colorClass = 'bg-purple-600'

            const isFirstInPart = slide.slideIndexInPart === 0

            const block = document.createElement('div')
            block.className = `h-10 px-3 flex items-center justify-center rounded text-sm font-bold text-white transition-all 
                ${colorClass} ${isActive ? 'ring-4 ring-yellow-400 z-10 scale-110 shadow-lg' : 'opacity-40 grayscale'}`
            block.textContent = isFirstInPart ? slide.partLabel.substring(0, 2).toUpperCase() : `.`
            if (!isFirstInPart) {
                block.className += " w-4 px-0"
            } else {
                block.textContent = slide.partLabel
            }

            ctx.stripContainer!.appendChild(block)
        })

        // Auto scroll
        setTimeout(() => {
            const activeBlock = ctx.stripContainer!.children[currentSlideIndex]
            if (activeBlock) activeBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        }, 50)
    }
}
