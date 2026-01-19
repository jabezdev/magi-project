import { LibraryItem } from '../../types'

export function renderScriptureOutput(item: LibraryItem, container: HTMLElement) {
    const scripture = item as any
    const div = document.createElement('div')
    div.className = 'w-full h-full flex flex-col items-center justify-center p-24 text-center'

    const mainTextFont = 'var(--main-font-family)'

    div.innerHTML = `
        <div class="flex-1 flex items-center justify-center">
            <div style="
                font-family: ${mainTextFont};
                font-size: var(--main-font-size); 
                line-height: var(--main-line-height);
                color: var(--main-text-color);
                text-shadow: var(--main-text-shadow);
                font-weight: bold;
            ">
                "${scripture.text_content}"
            </div>
        </div>
        <div class="mt-8 text-4xl text-yellow-400 font-bold uppercase tracking-widest drop-shadow-lg" 
             style="text-shadow: 0 2px 4px rgba(0,0,0,1); font-family: sans-serif;">
            ${scripture.reference_title}
        </div>
    `
    container.appendChild(div)
}
