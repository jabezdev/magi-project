import { GlobalSettings } from '../../../types'
import { SettingsHelpers } from './SettingsHelpers'

export function renderMobile(container: HTMLElement, settings: GlobalSettings) {
    SettingsHelpers.addHeader(container, 'Mobile View', 'Configuration for mobile device consumers')
    const s = settings.outputs.mobile

    const section = SettingsHelpers.createSection()

    section.appendChild(SettingsHelpers.createToggle('Enabled', settings.layoutSettings.mobileMonitorEnabled,
        (v) => settings.layoutSettings.mobileMonitorEnabled = v))

    const grid = document.createElement('div')
    grid.className = 'grid grid-cols-2 gap-6'
    grid.appendChild(SettingsHelpers.createNumberInput('Font Size (rem)', s.fontSize, 0.5, 4, 0.1, (v) => s.fontSize = v))
    grid.appendChild(SettingsHelpers.createColorInput('Text Color', s.textColor, (v) => s.textColor = v))
    section.appendChild(grid)

    container.appendChild(section)
}
