
import { state } from '../../state'
import { DEFAULT_PART_COLORS } from '../../constants/defaults'

// Reusable Tailwind class constants
const groupClass = "mb-8 last:mb-0 settings-group"
const gridClass = "grid grid-cols-2 gap-4"
const itemClass = "flex flex-col gap-2 setting-item"
const itemLabelClass = "text-[0.8rem] font-medium text-text-primary"
const controlClass = "flex items-center gap-2"
const colorInputClass = "w-[36px] h-[28px] p-[2px] border border-border-color rounded-sm bg-bg-tertiary cursor-pointer"
const colorHexClass = "text-[0.75rem] text-text-muted font-mono"
const headerClass = "flex justify-between items-center mb-4"
const titleClass = "text-xs font-semibold uppercase tracking-[0.5px] text-text-muted pb-2 border-b border-border-color m-0"
const resetBtnClass = "px-3 py-1.5 bg-transparent border border-border-color text-text-secondary text-xs rounded cursor-pointer hover:bg-bg-hover hover:text-text-primary transition-colors"

export function renderPartColorsTab(): string {
  const currentColors = state.partColors || DEFAULT_PART_COLORS

  // Generate inputs for each known part type
  const colorItems = Object.keys(DEFAULT_PART_COLORS).map(key => {
    const defaultColor = DEFAULT_PART_COLORS[key]
    const currentColor = currentColors[key] || defaultColor
    const label = getLabelForPart(key)

    return `
      <div class="${itemClass}">
        <label class="${itemLabelClass}">${label} (${key})</label>
        <div class="${controlClass}">
          <input type="color" id="part-color-${key}" class="${colorInputClass} part-color-input" data-key="${key}" value="${currentColor}">
          <span class="${colorHexClass}">${currentColor}</span>
        </div>
      </div>
    `
  }).join('')

  return `
    <div class="hidden settings-tab" id="tab-colors" style="display: none;">
      <div class="${groupClass}">
        <div class="${headerClass}">
           <h3 class="${titleClass}">Song Part Colors</h3>
           <button id="reset-part-colors" class="${resetBtnClass}">Reset to Defaults</button>
        </div>
        <div class="${gridClass}">
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
