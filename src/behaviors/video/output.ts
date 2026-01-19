import { LibraryItem } from '../../types'

export function renderVideoOutput(item: LibraryItem, container: HTMLElement) {
    const video = item as any
    const div = document.createElement('div')
    div.className = 'w-full h-full flex flex-col items-center justify-center bg-black'

    if (video.type === 'video') {
        if (video.is_youtube && (video.source_url.includes('youtube.com') || video.source_url.includes('youtu.be'))) {
            let videoId = ''
            if (video.source_url.includes('v=')) {
                videoId = video.source_url.split('v=')[1].split('&')[0]
            } else if (video.source_url.includes('youtu.be/')) {
                videoId = video.source_url.split('youtu.be/')[1].split('?')[0]
            }
            if (!videoId && video.file_hash) videoId = video.file_hash.replace('youtube-ref-', '')

            const startParam = video.trim_start ? `&start=${video.trim_start}` : ''
            const endParam = video.trim_end ? `&end=${video.trim_end}` : ''

            div.innerHTML = `
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0${startParam}${endParam}" 
                    title="YouTube video player" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    style="pointer-events: none;" 
                ></iframe>
            `
            // Note: Autoplay might be blocked by browser policy unless muted or user interacted. 
            // MainProjection is usually opened by user click, so it should be fine.
        } else {
            div.innerHTML = `
                 <video class="w-full h-full object-contain" autoplay>
                    <source src="${video.source_url}" type="video/mp4">
                 </video>
            `
            const v = div.querySelector('video')
            if (v && video.is_loop) v.loop = true
            if (v && video.volume_multiplier) v.volume = video.volume_multiplier
            if (v && video.trim_start) v.currentTime = video.trim_start
        }
    }
    container.appendChild(div)
}
