import { state } from '../../state'

// Reusable Tailwind class constants for Settings UI
const groupClass = "mb-8 last:mb-0 settings-group"
const groupTitleClass = "text-xs font-semibold uppercase tracking-[0.5px] text-text-muted mb-4 pb-2 border-b border-border-color"
const gridClass = "grid grid-cols-2 gap-4"
const itemClass = "flex flex-col gap-2 setting-item"
const itemLabelClass = "text-[0.8rem] font-medium text-text-primary"
const selectClass = "w-full px-3 py-2 bg-bg-tertiary border border-border-color rounded-sm text-text-primary text-[0.8rem] cursor-pointer focus:outline-none focus:border-accent-primary"

export function renderGeneralTab(): string {
  return `
    <div class="hidden settings-tab" id="tab-general" style="display: none;">
      <div class="${groupClass}">
        <h3 class="${groupTitleClass}">Appearance</h3>
        <div class="${gridClass}">
          <div class="${itemClass}">
            <label class="${itemLabelClass}">Control Panel Theme</label>
            <select id="theme-select" class="${selectClass}">
              <option value="dark" ${state.theme === 'dark' ? 'selected' : ''}>Dark</option>
              <option value="light" ${state.theme === 'light' ? 'selected' : ''}>Light</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `
}
