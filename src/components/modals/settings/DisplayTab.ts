import { GlobalSettings } from '../../../types'
import { SettingsHelpers } from './SettingsHelpers'

export function renderMainDisplay(container: HTMLElement, settings: GlobalSettings) {
    SettingsHelpers.addHeader(container, 'Main Projection', 'Customize the appearance of the main screen')
    const s = settings.displaySettings

    // Typography Section
    const typoSection = SettingsHelpers.createSection('Typography')
    typoSection.appendChild(SettingsHelpers.createTextInput('Font Family', s.fontFamily, (v) => s.fontFamily = v))

    const typoGrid = document.createElement('div')
    typoGrid.className = 'grid grid-cols-2 gap-6'
    typoGrid.appendChild(SettingsHelpers.createNumberInput('Font Size (rem)', s.fontSize, 1, 10, 0.1, (v) => s.fontSize = v))
    typoGrid.appendChild(SettingsHelpers.createNumberInput('Line Height', s.lineHeight, 0.8, 3.0, 0.1, (v) => s.lineHeight = v))
    typoSection.appendChild(typoGrid)

    typoSection.appendChild(SettingsHelpers.createColorInput('Text Color', s.textColor, (v) => s.textColor = v))
    typoSection.appendChild(SettingsHelpers.createToggle('All Caps', s.allCaps, (v) => s.allCaps = v))
    container.appendChild(typoSection)

    // Effects Section
    const effectsSection = SettingsHelpers.createSection('Effects')

    // Shadow
    effectsSection.appendChild(SettingsHelpers.createToggle('Enable Shadow', s.textShadow, (v) => s.textShadow = v))
    if (s.textShadow) {
        const shadowGrid = document.createElement('div')
        shadowGrid.className = 'grid grid-cols-3 gap-6 pl-6 border-l-4 border-black mb-4'
        shadowGrid.appendChild(SettingsHelpers.createNumberInput('Blur', s.shadowBlur, 0, 50, 1, (v) => s.shadowBlur = v))
        shadowGrid.appendChild(SettingsHelpers.createNumberInput('Offset X', s.shadowOffsetX, -50, 50, 1, (v) => s.shadowOffsetX = v))
        shadowGrid.appendChild(SettingsHelpers.createNumberInput('Offset Y', s.shadowOffsetY, -50, 50, 1, (v) => s.shadowOffsetY = v))
        effectsSection.appendChild(shadowGrid)
    }

    // Outline
    effectsSection.appendChild(SettingsHelpers.createToggle('Enable Outline', s.textOutline, (v) => s.textOutline = v))
    if (s.textOutline) {
        const outlineGrid = document.createElement('div')
        outlineGrid.className = 'grid grid-cols-2 gap-6 pl-6 border-l-4 border-black'
        outlineGrid.appendChild(SettingsHelpers.createNumberInput('Width (px)', s.outlineWidth, 0, 20, 1, (v) => s.outlineWidth = v))
        outlineGrid.appendChild(SettingsHelpers.createColorInput('Color', s.outlineColor, (v) => s.outlineColor = v))
        effectsSection.appendChild(outlineGrid)
    }
    container.appendChild(effectsSection)

    // Margins Section
    const marginSection = SettingsHelpers.createSection('Margins (%)')
    const marginGrid = document.createElement('div')
    marginGrid.className = 'grid grid-cols-2 gap-6'
    marginGrid.appendChild(SettingsHelpers.createNumberInput('Top', s.marginTop, 0, 50, 1, (v) => s.marginTop = v))
    marginGrid.appendChild(SettingsHelpers.createNumberInput('Bottom', s.marginBottom, 0, 50, 1, (v) => s.marginBottom = v))
    marginGrid.appendChild(SettingsHelpers.createNumberInput('Left', s.marginLeft, 0, 50, 1, (v) => s.marginLeft = v))
    marginGrid.appendChild(SettingsHelpers.createNumberInput('Right', s.marginRight, 0, 50, 1, (v) => s.marginRight = v))
    marginSection.appendChild(marginGrid)
    container.appendChild(marginSection)
}
