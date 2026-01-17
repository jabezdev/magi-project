import { GlobalSettings } from '../../../types'
import { SettingsHelpers } from './SettingsHelpers'

export function renderColors(container: HTMLElement, settings: GlobalSettings) {
    SettingsHelpers.addHeader(container, 'Part Colors', 'Color coding for song sections')
    const s = settings.partColors

    const section = SettingsHelpers.createSection()
    const grid = document.createElement('div')
    grid.className = 'grid grid-cols-2 gap-6'

    const parts = [
        { key: 'V', label: 'Verse' },
        { key: 'CH', label: 'Chorus' },
        { key: 'pCH', label: 'Pre-Chorus' },
        { key: 'BR', label: 'Bridge' },
        { key: 'TAG', label: 'Tag' },
        { key: 'IN', label: 'Intro' },
        { key: 'OUT', label: 'Outro' }
    ]

    parts.forEach(p => {
        grid.appendChild(SettingsHelpers.createColorInput(p.label, s[p.key] || '#888888', (v) => s[p.key] = v))
    })

    section.appendChild(grid)
    container.appendChild(section)
}
