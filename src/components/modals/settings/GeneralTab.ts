import { GlobalSettings } from '../../../types'
import { SettingsHelpers } from './SettingsHelpers'

export function renderGeneral(container: HTMLElement, settings: GlobalSettings) {
    SettingsHelpers.addHeader(container, 'General Settings', 'Global application configuration')

    const section = SettingsHelpers.createSection()

    // Theme
    section.appendChild(SettingsHelpers.createSelect('App Theme', settings.theme,
        [
            { value: 'dark', label: 'Dark Mode (Default)' },
            { value: 'light', label: 'Light Mode' },
            { value: 'high-contrast', label: 'High Contrast' }
        ],
        (val) => settings.theme = val as any
    ))

    // Default Background Transition
    section.appendChild(SettingsHelpers.createGroupLabel('Default Transitions'))
    const transGroup = document.createElement('div')
    transGroup.className = 'grid grid-cols-2 gap-6'

    transGroup.appendChild(SettingsHelpers.createSelect('Background Type', settings.default_transitions.background.type,
        [
            { value: 'crossfade', label: 'Cross Dissolve' },
            { value: 'cut', label: 'Cut (Immediate)' },
            { value: 'fade_to_black', label: 'Fade to Black' }
        ],
        (val) => settings.default_transitions.background.type = val as any
    ))

    transGroup.appendChild(SettingsHelpers.createNumberInput('Duration (sec)', settings.default_transitions.background.duration, 0, 5, 0.1,
        (val) => settings.default_transitions.background.duration = val
    ))
    section.appendChild(transGroup)

    // Paths (Read Only for now)
    section.appendChild(SettingsHelpers.createGroupLabel('Library Paths'))
    section.appendChild(SettingsHelpers.createTextInput('Media Root', settings.paths.media_root, () => { }, true))
    section.appendChild(SettingsHelpers.createTextInput('Data Root', settings.paths.data_root, () => { }, true))

    container.appendChild(section)
}
