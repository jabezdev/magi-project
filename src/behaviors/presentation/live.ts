import { PresentationItem } from '../../types';
import { store } from '../../state/store';

export function renderPresentationLive(item: PresentationItem, container: HTMLElement, stripContainer?: HTMLElement) {
    if (stripContainer) stripContainer.classList.add('hidden');

    if (item.presentation_type === 'canva' || item.metadata?.is_canva) {
        const div = document.createElement('div');
        div.className = 'w-full h-full bg-black relative';
        const url = item.original_canva_url || (item.metadata?.source_url as string) || '';
        div.innerHTML = `
             <iframe src="${url}" class="w-full h-full border-0" allow="fullscreen" allowfullscreen></iframe>
             <div class="absolute bottom-4 right-4 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold  pointer-events-none">ON AIR</div>
          `;
        container.innerHTML = '';
        container.appendChild(div);
    } else if (item.slides) {
        // Local Deck
        const wrapper = document.createElement('div');
        wrapper.className = 'w-full h-full overflow-y-auto p-4 grid grid-cols-2 gap-4 content-start';

        item.slides.forEach((slide: any, index: number) => {
            const isActive = store.state.live.slide_index === index;

            const div = document.createElement('div');
            div.className = `aspect-video bg-black rounded border cursor-pointer relative group overflow-hidden  ${isActive ? 'border-red-600 ring-2 ring-red-500' : 'border-gray-800 hover:border-gray-500'}`;
            div.innerHTML = `
                 ${slide.type === 'image' || slide.type === 'video' ? `<img src="${slide.content}" class="w-full h-full object-cover">` : `<div class="p-2 text-xs text-white">${slide.content}</div>`}
                <div class="absolute bottom-0 left-0 bg-black/50 text-white text-[10px] px-1">${index + 1}</div>
             `;
            div.addEventListener('click', () => {
                store.setLiveSlide(index);
            });
            wrapper.appendChild(div);

            if (isActive) {
                setTimeout(() => div.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
            }
        });
        container.innerHTML = '';
        container.appendChild(wrapper);
    } else {
        container.innerHTML = `<div class="text-gray-500 p-4">Empty Presentation</div>`;
    }
}
