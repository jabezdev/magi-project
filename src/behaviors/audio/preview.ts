import { AudioItem } from '../../types';

export function renderAudioPreview(item: AudioItem, container: HTMLElement, stripContainer?: HTMLElement) {
    if (stripContainer) stripContainer.classList.add('hidden');

    container.innerHTML = `
        <div class="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div class="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center">
                <svg class="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
            </div>
            <div>
                <h3 class="font-bold text-lg text-white">${item.title}</h3>
                <p class="text-sm text-gray-400">${item.artist || 'Unknown Artist'}</p>
            </div>
            <div class="text-xs text-gray-500">
                Duration: ${Math.floor(item.duration / 60)}:${Math.floor(item.duration % 60).toString().padStart(2, '0')}
            </div>
            <div class="w-full max-w-xs bg-gray-800 h-10 rounded overflow-hidden flex items-end justify-center gap-0.5 opacity-50">
                 <!-- Fake Waveform -->
                 ${Array.from({ length: 40 }).map(() => `<div class="w-1 bg-blue-500" style="height: ${Math.random() * 100}%"></div>`).join('')}
            </div>
        </div>
    `;
}
