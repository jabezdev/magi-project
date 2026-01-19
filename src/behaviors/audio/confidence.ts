import { LibraryItem } from '../../types'
import { ConfidenceContext } from '../types'

export function renderAudioConfidence(item: LibraryItem, ctx: ConfidenceContext) {
    // Basic status for audio
    ctx.currentContainer.className = "flex-1 flex flex-col p-8 items-center justify-center text-center bg-black"
    ctx.currentContainer.innerHTML = `
         <div class="text-5xl text-gray-300 font-bold mb-4">AUDIO PLAYING</div>
         <div class="text-3xl text-gray-500">${item.title}</div>
    `
    ctx.nextContainer.innerHTML = ''
    if (ctx.prevContainer) ctx.prevContainer.innerHTML = ''
    if (ctx.stripContainer) ctx.stripContainer.classList.add('hidden')
}
