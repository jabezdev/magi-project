import { VideoItem } from '../../types';

export function renderVideoLive(item: VideoItem, container: HTMLElement, stripContainer?: HTMLElement) {
    if (stripContainer) stripContainer.classList.add('hidden');

    const div = document.createElement('div');
    div.className = 'w-full h-full flex flex-col bg-black relative';

    // Check for YouTube
    if (item.source_url.includes('youtube.com') || item.video_subtype === 'youtube') {
        let videoId = item.source_url.split('v=')[1];
        if (!videoId && item.file_hash) videoId = item.file_hash.replace('youtube-ref-', '');

        // YouTube Embed (limited control)
        div.innerHTML = `
            <div class="flex-1 relative">
                <iframe 
                    id="yt-player"
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&enablejsapi=1" 
                    title="YouTube video player" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                ></iframe>
                <div class="absolute bottom-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold ">ON AIR</div>
            </div>
            <div class="bg-gray-900 p-2 flex items-center gap-2 border-t border-gray-800">
                <span class="text-gray-500 text-xs">YouTube Player - Limited Controls</span>
            </div>
        `;
    } else {
        // Local Video with Full Controls
        div.innerHTML = `
            <div class="flex-1 relative overflow-hidden">
                <video id="live-video" class="w-full h-full object-contain" autoplay>
                    <source src="${item.source_url}" type="video/mp4">
                </video>
                <div class="absolute bottom-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold  pointer-events-none">ON AIR</div>
            </div>
            <div class="bg-gray-900 p-3 flex items-center gap-3 border-t border-gray-800">
                <button id="btn-play" class="w-10 h-10 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center text-white font-bold text-xl">▶</button>
                <button id="btn-stop" class="w-8 h-8 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white font-bold">■</button>
                <button id="btn-fade" class="px-3 py-1 rounded bg-yellow-700 hover:bg-yellow-600 text-white text-xs font-bold">FADE</button>
                <div class="flex-1 flex flex-col gap-1">
                    <input type="range" id="video-progress" class="w-full h-1 bg-gray-700 rounded-lg cursor-pointer" value="0" min="0" max="100">
                    <div class="flex justify-between text-[10px] text-gray-500 font-mono">
                        <span id="video-elapsed">00:00</span>
                        <span id="video-remaining" class="text-yellow-400 font-bold">-00:00</span>
                    </div>
                </div>
            </div>
        `;

        // Wire up controls
        setTimeout(() => {
            const video = div.querySelector('#live-video') as HTMLVideoElement;
            const playBtn = div.querySelector('#btn-play') as HTMLButtonElement;
            const stopBtn = div.querySelector('#btn-stop') as HTMLButtonElement;
            const fadeBtn = div.querySelector('#btn-fade') as HTMLButtonElement;
            const progress = div.querySelector('#video-progress') as HTMLInputElement;
            const elapsed = div.querySelector('#video-elapsed');
            const remaining = div.querySelector('#video-remaining');

            if (video && elapsed && remaining && progress) {
                // Formatting helper
                const formatTime = (seconds: number): string => {
                    const mins = Math.floor(seconds / 60);
                    const secs = Math.floor(seconds % 60);
                    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                };

                // Time Update
                video.addEventListener('timeupdate', () => {
                    const current = video.currentTime;
                    const duration = video.duration || 0;
                    const remain = duration - current;

                    elapsed.textContent = formatTime(current);
                    remaining.textContent = '-' + formatTime(remain);

                    if (duration > 0) {
                        progress.value = String((current / duration) * 100);
                    }
                });

                // Play/Pause Toggle
                playBtn?.addEventListener('click', () => {
                    if (video.paused) {
                        video.play();
                        playBtn.textContent = '❚❚';
                    } else {
                        video.pause();
                        playBtn.textContent = '▶';
                    }
                });

                // Stop
                stopBtn?.addEventListener('click', () => {
                    video.pause();
                    video.currentTime = 0;
                    playBtn.textContent = '▶';
                });

                // Fade Out
                fadeBtn?.addEventListener('click', () => {
                    let opacity = 1;
                    const fadeInterval = setInterval(() => {
                        opacity -= 0.05;
                        video.style.opacity = String(opacity);
                        if (opacity <= 0) {
                            clearInterval(fadeInterval);
                            video.pause();
                            video.style.opacity = '1';
                            video.currentTime = 0;
                        }
                    }, 100);
                });

                // Seek
                progress?.addEventListener('input', () => {
                    const seekTo = (parseFloat(progress.value) / 100) * video.duration;
                    video.currentTime = seekTo;
                });
            }
        }, 0);
    }

    container.innerHTML = '';
    container.appendChild(div);
}
