
import { state } from '../../state'
import { DEFAULT_PART_COLORS } from '../../constants/defaults'

export function renderPartColorsTab(): string {
    const currentColors = state.partColors || DEFAULT_PART_COLORS

    // Generate inputs for each known part type
    // Use keys from DEFAULT_PART_COLORS to ensure all types are covered
    const colorItems = Object.keys(DEFAULT_PART_COLORS).map(key => {
        const defaultColor = DEFAULT_PART_COLORS[key]
        const currentColor = currentColors[key] || defaultColor
        const label = getLabelForPart(key)

        return `
      <div class="setting-item">
        <label>${label} (${key})</label>
        <div class="setting-control color-control">
          <input type="color" id="part-color-${key}" class="part-color-input" data-key="${key}" value="${currentColor}">
          <span class="color-hex">${currentColor}</span>
        </div>
      </div>
    `
    }).join('')

    return `
    <div class="settings-tab" id="tab-colors">
      <div class="settings-group">
        <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
           <h3>Song Part Colors</h3>
           <button id="reset-part-colors" class="btn-ghost sm">Reset to Defaults</button>
        </div>
        <div class="settings-grid">
          ${colorItems}
        </div>
      </div>
    </div>
  `
}

export function initPartColorsTabListeners(): void {
    // Listen for color changes to update hex text
    document.querySelectorAll('.part-color-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const val = (e.target as HTMLInputElement).value
            const span = (e.target as HTMLElement).nextElementSibling
            if (span) span.textContent = val
        })
    })

    // Reset Button
    document.getElementById('reset-part-colors')?.addEventListener('click', () => {
        if (confirm('Reset all part colors to defaults?')) {
            Object.keys(DEFAULT_PART_COLORS).forEach(key => {
                const input = document.getElementById(`part-color-${key}`) as HTMLInputElement
                const val = DEFAULT_PART_COLORS[key]
                if (input) {
                    input.value = val
                    const span = input.nextElementSibling
                    if (span) span.textContent = val
                    // dispatch input event to trigger preview update if bound
                    input.dispatchEvent(new Event('input', { bubbles: true }))
                }
            })
        }
    })
}

function getLabelForPart(key: string): string {
    const labels: Record<string, string> = {
        'V': 'Verse',
        'CH': 'Chorus',
        'pCH': 'Pre-Chorus',
        'BR': 'Bridge',
        'TAG': 'Tag',
        'IN': 'Intro',
        'OUT': 'Outro'
    }
    return labels[key] || key
}
