import { LibraryItem } from '../../types'

export function renderImageOutput(item: LibraryItem, container: HTMLElement) {
    const image = item as any
    const img = document.createElement('img')
    img.src = image.source_url

    const scalingMode = image.scaling_mode || 'fit'
    let objectFit = 'object-contain'
    if (scalingMode === 'fill') objectFit = 'object-cover'
    if (scalingMode === 'stretch') objectFit = 'fill'

    img.className = `w-full h-full ${objectFit}`
    container.appendChild(img)
}
