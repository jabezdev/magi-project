import { AudioItem } from '../../types';

export function renderAudioLive(item: AudioItem, container: HTMLElement, stripContainer?: HTMLElement) {
    if (stripContainer) stripContainer.classList.add('hidden');

    container.innerHTML = `
        <div class="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div class="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center border-4 border-red-500 animate-pulse">
                <svg class="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
            </div>
            <div>
                <h3 class="font-bold text-2xl text-white">${item.title}</h3>
                <p class="text-gray-400">${item.artist || 'Unknown Artist'}</p>
            </div>
             <div class="bg-red-900/50 text-red-200 px-3 py-1 rounded text-sm font-bold border border-red-900">
                PLAYING ON AUDIO
            </div>
        </div>
    `;
}
