import { LibraryItem } from '../../types'
import { ConfidenceContext } from '../types'

export function renderVideoConfidence(item: LibraryItem, ctx: ConfidenceContext) {
    const video = item as any
    const currentEl = ctx.currentContainer
    const nextEl = ctx.nextContainer

    // Check "Mirror Video" Setting
    const mirroring = ctx.settings?.confidenceMonitorSettings?.mirrorVideo || false

    currentEl.className = "flex-1 flex flex-col p-0 items-center justify-center text-center bg-black relative overflow-hidden w-full h-full"

    if (mirroring) {
        if (video.is_youtube) {
            let videoId = ''
            if (video.source_url.includes('v=')) {
                videoId = video.source_url.split('v=')[1].split('&')[0]
            } else if (video.source_url.includes('youtu.be/')) {
                videoId = video.source_url.split('youtu.be/')[1].split('?')[0]
            }
            if (!videoId && video.file_hash) videoId = video.file_hash.replace('youtube-ref-', '')

            currentEl.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&mute=1" style="pointer-events:none; border:none;" frameborder="0"></iframe>`
        } else {
            currentEl.innerHTML = `<video src="${video.source_url}" class="w-full h-full object-contain" autoplay muted></video>`
        }
    } else {
        currentEl.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full animate-pulse">
                 <div class="text-8xl mb-6">🎥</div>
                 <div class="text-6xl font-bold text-green-500 mb-4">VIDEO PLAYING</div>
                 <div class="text-3xl text-gray-300 max-w-3xl border-t border-gray-700 pt-4">${item.title}</div>
            </div>
         `
    }

    nextEl.innerHTML = `<div class="text-gray-600 mt-4">---</div>`
    if (ctx.prevContainer) ctx.prevContainer.innerHTML = ''
    if (ctx.stripContainer) ctx.stripContainer.classList.add('hidden')
}
