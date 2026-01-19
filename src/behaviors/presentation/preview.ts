import { PresentationItem } from '../../types';
import { store } from '../../state/store';

export function renderPresentationPreview(item: PresentationItem, container: HTMLElement, stripContainer?: HTMLElement) {
    if (stripContainer) stripContainer.classList.add('hidden');

    if (item.presentation_type === 'canva' || item.metadata?.is_canva) {
        const div = document.createElement('div');
        div.className = 'w-full h-full bg-black';
        const url = item.original_canva_url || (item.metadata?.source_url as string) || '';
        div.innerHTML = `
             <iframe src="${url}" class="w-full h-full border-0" allow="fullscreen" allowfullscreen></iframe>
          `;
        container.innerHTML = '';
        container.appendChild(div);
    } else if (item.slides) {
        // Local Deck - Render as list of slide thumbnails/rows
        const wrapper = document.createElement('div');
        wrapper.className = 'w-full h-full overflow-y-auto p-4 grid grid-cols-2 gap-4 content-start';

        item.slides.forEach((slide: any, index: number) => {
            const div = document.createElement('div');
            div.className = 'aspect-video bg-black rounded border border-gray-700 cursor-pointer hover:border-blue-500 relative group overflow-hidden';
            div.innerHTML = `
                ${slide.type === 'image' || slide.type === 'video' ? `<img src="${slide.content}" class="w-full h-full object-cover">` : `<div class="p-2 text-xs text-white">${slide.content}</div>`}
                <div class="absolute bottom-0 left-0 bg-black/50 text-white text-[10px] px-1">${index + 1}</div>
             `;
            div.addEventListener('click', () => {
                store.setPreviewSlide(index);
            });
            wrapper.appendChild(div);
        });
        container.innerHTML = '';
        container.appendChild(wrapper);
    } else {
        container.innerHTML = `<div class="text-gray-500 p-4">Empty Presentation</div>`;
    }
}
