import { ScriptureItem } from '../../types';
import { store } from '../../state/store';

export function renderScripturePreview(item: ScriptureItem, container: HTMLElement, stripContainer?: HTMLElement) {
    if (stripContainer) stripContainer.classList.add('hidden');

    if (item.slides && item.slides.length > 0) {
        const wrapper = document.createElement('div');
        wrapper.className = 'w-full h-full overflow-y-auto p-4 space-y-2';

        item.slides.forEach((slide, index) => {
            const div = document.createElement('div');
            div.className = 'bg-gray-800 p-2 rounded hover:bg-gray-700 cursor-pointer text-sm border border-transparent hover:border-blue-500 ';
            div.innerHTML = `
                <div class="text-xs font-bold text-yellow-500 mb-1">${slide.label || item.reference_title}</div>
                <div class="text-gray-300 whitespace-pre-wrap leading-relaxed font-serif text-lg">"${slide.text}"</div>
            `;
            div.addEventListener('click', () => {
                store.setPreviewSlide(index);
            });
            wrapper.appendChild(div);
        });
        container.innerHTML = '';
        container.appendChild(wrapper);
    } else {
        const div = document.createElement('div');
        div.className = 'p-8 text-center max-w-lg';
        div.innerHTML = `
             <div class="text-2xl font-serif mb-4 text-white">"${item.text_content || ''}"</div>
             <div class="text-yellow-500 font-bold tracking-widest text-sm uppercase">${item.reference_title || item.title}</div>
          `;
        container.innerHTML = '';
        container.appendChild(div);
    }
}
