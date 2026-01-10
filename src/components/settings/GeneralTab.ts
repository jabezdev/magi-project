import { state } from '../../state'

export function renderGeneralTab(): string {
    return `
    <div class="settings-tab" id="tab-general">
      <div class="settings-group">
        <h3>Appearance</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label>Control Panel Theme</label>
            <select id="theme-select" class="setting-select">
              <option value="dark" ${state.theme === 'dark' ? 'selected' : ''}>Dark</option>
              <option value="light" ${state.theme === 'light' ? 'selected' : ''}>Light</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `
}
