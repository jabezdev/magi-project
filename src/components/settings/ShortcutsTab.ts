
export function renderShortcutsTab(): string {
    return `
    <div class="settings-tab" id="tab-shortcuts">
      <div class="settings-section">
        <h3>Keyboard Shortcuts</h3>
        <p class="settings-description">
          Use these keyboard shortcuts to quickly control the presentation.
        </p>
        
        <table class="shortcuts-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Shortcut</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Next Slide</td>
              <td><kbd>→</kbd> or <kbd>Space</kbd></td>
            </tr>
            <tr>
              <td>Previous Slide</td>
              <td><kbd>←</kbd></td>
            </tr>
            <tr>
              <td>Go Live / Update</td>
              <td><kbd>Enter</kbd></td>
            </tr>
            <tr>
              <td>Black Screen</td>
              <td><kbd>B</kbd></td>
            </tr>
            <tr>
              <td>Clear Screen</td>
              <td><kbd>C</kbd></td>
            </tr>
            <tr>
              <td>Logo Screen</td>
              <td><kbd>L</kbd></td>
            </tr>
            <tr>
              <td>Lyrics Mode</td>
              <td><kbd>Esc</kbd></td>
            </tr>
            <tr>
              <td>Show Shortcuts</td>
              <td><kbd>?</kbd></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
}
