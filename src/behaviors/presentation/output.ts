import { LibraryItem, PresentationItem } from '../../types'

export function renderPresentationOutput(item: LibraryItem, container: HTMLElement, slideIndex: number = 0) {
    const presentation = item as PresentationItem

    if (presentation.presentation_type === 'canva' && presentation.original_canva_url) {
        const div = document.createElement('div')
        div.className = 'w-full h-full bg-black'
        div.innerHTML = `
            <iframe src="${presentation.original_canva_url}" class="w-full h-full border-0" allow="fullscreen" allowfullscreen></iframe>
         `
        container.appendChild(div)
    } else if (presentation.slides && presentation.slides.length > 0) {
        const slide = presentation.slides[slideIndex]

        if (slide) {
            if (slide.type === 'image') {
                const img = document.createElement('img')
                img.src = slide.content
                img.className = 'w-full h-full object-contain'
                container.appendChild(img)
            } else {
                // Fallback for text/other
                const div = document.createElement('div')
                div.className = 'w-full h-full flex items-center justify-center p-12 text-center'
                div.innerHTML = slide.content
                container.appendChild(div)
            }
        }
    }
}
