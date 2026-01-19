import { LibraryItem } from '../../types'
import { ConfidenceContext } from '../types'

export function renderImageConfidence(item: LibraryItem, ctx: ConfidenceContext) {
    const image = item as any
    const currentEl = ctx.currentContainer
    const nextEl = ctx.nextContainer

    currentEl.className = "flex-1 flex flex-col p-0 items-center justify-center text-center bg-black border-x-8 border-blue-600"
    currentEl.innerHTML = `<img src="${image.source_url}" class="w-full h-full object-contain" />`
    nextEl.innerHTML = ''

    if (ctx.prevContainer) ctx.prevContainer.innerHTML = ''
    if (ctx.stripContainer) ctx.stripContainer.classList.add('hidden')
}
