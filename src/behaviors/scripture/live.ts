import { ScriptureItem } from '../../types';
import { store } from '../../state/store';

export function renderScriptureLive(item: ScriptureItem, container: HTMLElement, stripContainer?: HTMLElement) {
    if (stripContainer) stripContainer.classList.add('hidden');

    if (item.slides && item.slides.length > 0) {
        const wrapper = document.createElement('div');
        wrapper.className = 'w-full h-full overflow-y-auto p-4 space-y-2';

        item.slides.forEach((slide, index) => {
            const isActive = store.state.live.slide_index === index;

            const div = document.createElement('div');
            div.className = `p-3 rounded cursor-pointer text-sm border  ${isActive ? 'bg-red-900/30 border-red-600' : 'bg-gray-900/50 border-gray-800 hover:border-gray-600'}`;

            div.innerHTML = `
                 <div class="text-xs font-bold ${isActive ? 'text-red-400' : 'text-yellow-600'} mb-1">${slide.label || item.reference_title}</div>
                 <div class="${isActive ? 'text-white text-2xl' : 'text-gray-300 text-lg'} whitespace-pre-wrap leading-relaxed font-serif">"${slide.text}"</div>
             `;
            div.addEventListener('click', () => {
                store.setLiveSlide(index);
            });
            wrapper.appendChild(div);
        });
        container.innerHTML = '';
        container.appendChild(wrapper);
    } else {
        const div = document.createElement('div');
        div.className = 'p-8 text-center max-w-lg';
        div.innerHTML = `
             <div class="text-3xl font-serif mb-4 text-white leading-normal shadow-black drop-shadow-lg">"${item.text_content || ''}"</div>
             <div class="text-red-500 font-bold tracking-widest text-sm uppercase">${item.reference_title || item.title}</div>
          `;
        container.innerHTML = '';
        container.appendChild(div);
    }
}
