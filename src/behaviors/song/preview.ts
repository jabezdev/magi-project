import { SongItem } from '../../types';
import { store } from '../../state/store';
import { flattenSongToSlides, getPartColor } from '../../utils/songSlides';



export function renderSongPreview(item: SongItem, container: HTMLElement, stripContainer?: HTMLElement) {
    const flattenedSlides = flattenSongToSlides(item);

    // 0. Render Shell (Clean, just slides)
    container.innerHTML = `
        <div class="flex flex-col h-full">
            <!-- Slides -->
            <div id="slides-wrapper" class="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar"></div>
        </div>
    `;

    // Background Logic REMOVED (Handled by Utility Panel)


    // 1. Render slides list
    const wrapper = container.querySelector('#slides-wrapper') as HTMLElement;

    flattenedSlides.forEach((slide, index) => {
        const isActive = store.state.preview.slide_index === index;
        const colorClass = getPartColor(slide.partType);

        const div = document.createElement('div');
        div.className = `bg-gray-800 p-3 rounded cursor-pointer text-sm border-l-4 ${isActive ? 'ring-2 ring-blue-400 bg-gray-700' : 'hover:bg-gray-700'} transition-all`;
        div.style.borderLeftColor = 'transparent';
        div.classList.add(colorClass.replace('bg-', 'border-l-'));

        const isFirstInPart = slide.slideIndexInPart === 0;
        div.innerHTML = `
            ${isFirstInPart ? `<div class="text-xs font-bold text-blue-400 mb-1">${slide.partLabel}</div>` : ''}
            <div class="text-gray-300 whitespace-pre-wrap leading-relaxed">${slide.text}</div>
            <div class="text-[10px] text-gray-600 mt-1">Slide ${index + 1}</div>
        `;
        div.addEventListener('click', () => {
            store.setPreviewSlide(index);
            // Re-render handled by store subscription in main panel calling this again
        });
        wrapper.appendChild(div);
    });

    // Scroll active into view
    const activeEl = wrapper.children[store.state.preview.slide_index] as HTMLElement;
    if (activeEl) {
        // Simple scroll into view if needed
        setTimeout(() => {
            activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
    }

    // 2. Render Strip
    if (stripContainer) {
        if (flattenedSlides.length === 0) {
            stripContainer.classList.add('hidden');
            return;
        }

        stripContainer.classList.remove('hidden');
        stripContainer.classList.add('flex');
        stripContainer.innerHTML = '';

        flattenedSlides.forEach((slide, index) => {
            const isActive = store.state.preview.slide_index === index;
            const color = getPartColor(slide.partType);
            const isFirstInPart = slide.slideIndexInPart === 0;

            const block = document.createElement('button');
            block.className = `px-2 py-0.5 rounded text-[10px] font-bold text-white ${color} ${isActive ? 'ring-2 ring-blue-400 scale-105' : 'opacity-60 hover:opacity-100'} transition-all`;

            block.textContent = isFirstInPart ? slide.partLabel : `${slide.slideIndexInPart + 1}`;
            block.title = `${slide.partLabel} - Slide ${slide.slideIndexInPart + 1}`;

            block.addEventListener('click', () => {
                store.setPreviewSlide(index);
            });
            stripContainer.appendChild(block);
        });
    }
}
