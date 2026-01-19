import { VideoItem } from '../../types';

export function renderVideoPreview(item: VideoItem, container: HTMLElement, stripContainer?: HTMLElement) {
    if (stripContainer) stripContainer.classList.add('hidden');

    const div = document.createElement('div');
    div.className = 'w-full h-full flex flex-col items-center justify-center bg-black';

    // Check for YouTube
    if (item.source_url.includes('youtube.com') || item.video_subtype === 'youtube') {
        // Extract ID
        let videoId = item.source_url.split('v=')[1];
        if (!videoId && item.file_hash) videoId = item.file_hash.replace('youtube-ref-', '');

        // Basic Embed
        div.innerHTML = `
            <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/${videoId}?autoplay=0" 
                title="YouTube video player" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
            ></iframe>
        `;
    } else {
        // Local Video
        div.innerHTML = `
             <video class="w-full h-full object-contain" controls onerror="this.outerHTML='<div class=\\"flex items-center justify-center w-full h-full bg-red-900/30 text-red-400 text-sm font-bold\\">⚠ VIDEO NOT FOUND</div>'">
                <source src="${item.source_url}" type="video/mp4">
                Your browser does not support the video tag.
             </video>
        `;
    }
    container.innerHTML = '';
    container.appendChild(div);
}
