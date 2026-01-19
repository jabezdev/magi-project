import { ImageItem } from '../../types';

export function renderImagePreview(item: ImageItem, container: HTMLElement, stripContainer?: HTMLElement) {
    if (stripContainer) stripContainer.classList.add('hidden');

    const img = document.createElement('img');
    img.src = item.source_url || 'placeholder.png';
    img.className = 'max-w-full max-h-full object-contain';

    container.innerHTML = '';
    container.appendChild(img);
}
