import { SongItem } from '../../types';
import { store } from '../../state/store';
import { flattenSongToSlides, getPartColor } from '../../utils/songSlides';

export function renderSongLive(item: SongItem, container: HTMLElement, stripContainer?: HTMLElement) {
    const flattenedSlides = flattenSongToSlides(item);
    const activeIndex = store.state.live.slide_index;

    // 1. Render slides list
    // Live View is primarily for monitoring what is ON AIR.
    // We should show a clear list, with the active one VERY prominent.

    // Auto-scroll logic needs to be robust here.

    const wrapper = document.createElement('div');
    wrapper.className = 'w-full h-full overflow-y-auto p-4 space-y-2';

    flattenedSlides.forEach((slide, index) => {
        const isActive = activeIndex === index;
        const colorClass = getPartColor(slide.partType);

        // Live styles: Red theme for active
        const div = document.createElement('div');
        div.className = `p-4 rounded border-l-4 transition-all ${isActive
            ? 'bg-red-900/40 border-red-500 ring-2 ring-red-500/50 shadow-lg shadow-red-900/20'
            : 'bg-zinc-900 border-transparent opacity-60'
            }`;

        // Use part color for border if not active? Or always part color?
        // Let's use part color for the border indicator
        if (!isActive) {
            div.classList.add(colorClass.replace('bg-', 'border-l-'));
        }

        const isFirstInPart = slide.slideIndexInPart === 0;
        div.innerHTML = `
            ${isFirstInPart ? `<div class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">${slide.partLabel}</div>` : ''}
            <div class="${isActive ? 'text-white font-medium text-lg' : 'text-zinc-400'} whitespace-pre-wrap leading-relaxed transition-colors">${slide.text}</div>
        `;

        // Click to quick-fire (Jump to slide)
        div.addEventListener('click', () => {
            store.setLiveSlide(index);
        });

        // Auto-scroll anchor
        if (isActive) {
            setTimeout(() => {
                div.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 50);
        }

        wrapper.appendChild(div);
    });

    container.innerHTML = '';
    container.appendChild(wrapper);

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
            const isActive = activeIndex === index;
            const color = getPartColor(slide.partType);
            const isFirstInPart = slide.slideIndexInPart === 0;

            const block = document.createElement('button');
            block.className = `px-2 py-0.5 rounded text-[10px] font-bold text-white ${color} ${isActive ? 'ring-2 ring-white scale-110 z-10 shadow-lg' : 'opacity-40 hover:opacity-100'} transition-all`;

            block.textContent = isFirstInPart ? slide.partLabel : `${slide.slideIndexInPart + 1}`;

            block.addEventListener('click', () => {
                store.setLiveSlide(index);
            });

            stripContainer.appendChild(block);
        });
    }
}
