import { GlobalSettings } from '../../../types'
import { SettingsHelpers } from './SettingsHelpers'

export function renderConfidence(container: HTMLElement, settings: GlobalSettings) {
    SettingsHelpers.addHeader(container, 'Confidence Monitor', 'Stage display configuration')
    const s = settings.confidenceMonitorSettings

    const section = SettingsHelpers.createSection()

    section.appendChild(SettingsHelpers.createToggle('Enabled', settings.layoutSettings.confidenceMonitorEnabled,
        (v) => settings.layoutSettings.confidenceMonitorEnabled = v))

    section.appendChild(SettingsHelpers.createGroupLabel('Appearance'))
    const fontGrid = document.createElement('div')
    fontGrid.className = 'grid grid-cols-2 gap-6'
    fontGrid.appendChild(SettingsHelpers.createTextInput('Font Family', s.fontFamily, (v) => s.fontFamily = v))
    fontGrid.appendChild(SettingsHelpers.createNumberInput('Font Size (rem)', s.fontSize, 1, 8, 0.1, (v) => s.fontSize = v))
    section.appendChild(fontGrid)

    section.appendChild(SettingsHelpers.createGroupLabel('Layout'))
    const layoutGrid = document.createElement('div')
    layoutGrid.className = 'grid grid-cols-2 gap-6'
    layoutGrid.appendChild(SettingsHelpers.createNumberInput('Clock Size (rem)', s.clockSize, 0.5, 5, 0.1, (v) => s.clockSize = v))
    layoutGrid.appendChild(SettingsHelpers.createNumberInput('Prev/Next Opacity', s.prevNextOpacity, 0, 1, 0.1, (v) => s.prevNextOpacity = v))
    section.appendChild(layoutGrid)

    container.appendChild(section)
}
