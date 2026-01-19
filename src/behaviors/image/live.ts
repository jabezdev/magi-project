import { ImageItem } from '../../types';

export function renderImageLive(item: ImageItem, container: HTMLElement, stripContainer?: HTMLElement) {
    if (stripContainer) stripContainer.classList.add('hidden');

    const div = document.createElement('div');
    div.className = 'w-full h-full flex items-center justify-center bg-black relative';

    div.innerHTML = `
        <div class="flex-1 flex items-center justify-center">
            <img src="${item.source_url || 'placeholder.png'}" class="max-w-full max-h-full object-contain">
        </div>
        <div class="absolute bottom-4 right-4 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold ">ON AIR</div>
    `;

    container.innerHTML = '';
    container.appendChild(div);
}
