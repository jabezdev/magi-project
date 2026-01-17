import { GlobalSettings } from '../../../types'
import { SettingsHelpers } from './SettingsHelpers'

export function renderLowerThirds(container: HTMLElement, settings: GlobalSettings) {
    SettingsHelpers.addHeader(container, 'Lower Thirds', 'Broadcast overlay settings')
    const s = settings.lowerThirdsSettings

    const section = SettingsHelpers.createSection()

    section.appendChild(SettingsHelpers.createToggle('Enabled', settings.layoutSettings.lowerThirdsMonitorEnabled,
        (v) => settings.layoutSettings.lowerThirdsMonitorEnabled = v))

    // Background
    section.appendChild(SettingsHelpers.createGroupLabel('Background'))
    const bgGrid = document.createElement('div')
    bgGrid.className = 'grid grid-cols-2 gap-6'
    bgGrid.appendChild(SettingsHelpers.createColorInput('Background Color', s.backgroundColor, (v) => s.backgroundColor = v))
    bgGrid.appendChild(SettingsHelpers.createNumberInput('Opacity (0-1)', s.backgroundOpacity, 0, 1, 0.1, (v) => s.backgroundOpacity = v))
    section.appendChild(bgGrid)

    // Typography
    section.appendChild(SettingsHelpers.createGroupLabel('Typography'))
    const typeGrid = document.createElement('div')
    typeGrid.className = 'grid grid-cols-2 gap-6'
    typeGrid.appendChild(SettingsHelpers.createTextInput('Font Family', s.fontFamily, (v) => s.fontFamily = v))
    typeGrid.appendChild(SettingsHelpers.createNumberInput('Font Size (px)', s.fontSize, 10, 100, 1, (v) => s.fontSize = v))
    section.appendChild(typeGrid)

    container.appendChild(section)
}
