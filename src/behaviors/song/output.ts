import { SongItem } from '../../types'
import { flattenSongToSlides } from '../../utils/songSlides'

export function renderSongOutput(item: SongItem, container: HTMLElement, slideIndex: number = 0) {
    const flattenedSlides = flattenSongToSlides(item)
    const slide = flattenedSlides[slideIndex]

    const div = document.createElement('div')
    div.className = 'w-full h-full flex items-center justify-center p-16 text-center'
    // Fonts and styles are inherited from MainProjection shell via CSS variables
    div.style.fontFamily = 'var(--main-font-family)'

    if (slide) {
        div.innerHTML = `
            <div style="
                font-size: var(--main-font-size);
                line-height: var(--main-line-height);
                color: var(--main-text-color);
                text-shadow: var(--main-text-shadow);
                -webkit-text-stroke: var(--main-text-stroke);
                text-transform: var(--main-all-caps);
                white-space: pre-wrap;
                font-weight: bold;
            ">
                ${slide.text}
            </div>
        `
    }

    container.appendChild(div)
}
