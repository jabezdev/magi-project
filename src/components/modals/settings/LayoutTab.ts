import { GlobalSettings } from '../../../types'
import { SettingsHelpers } from './SettingsHelpers'

export function renderLayout(container: HTMLElement, settings: GlobalSettings) {
    SettingsHelpers.addHeader(container, 'Layout', 'Application layout and column widths')
    const s = settings.layoutSettings

    const section = SettingsHelpers.createSection()

    section.appendChild(SettingsHelpers.createNumberInput('Songs Column Width (px)', s.songsColumnWidth, 200, 800, 10, (v) => s.songsColumnWidth = v))
    section.appendChild(SettingsHelpers.createNumberInput('Schedule Height (px)', s.scheduleSectionHeight, 100, 800, 10, (v) => s.scheduleSectionHeight = v))
    section.appendChild(SettingsHelpers.createNumberInput('Outputs Column Width (px)', s.monitorColumnWidth, 200, 600, 10, (v) => s.monitorColumnWidth = v))

    container.appendChild(section)
}
