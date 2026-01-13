
// Reusable Tailwind class constants
const sectionClass = "mb-5"
const sectionTitleClass = "text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.5px] mb-3"
const descClass = "text-[0.8rem] text-text-secondary mb-4"
const tableClass = "w-full border-collapse text-sm"
const thClass = "text-left p-2 border-b border-border-color text-text-muted font-semibold text-xs uppercase"
const tdClass = "p-2 border-b border-border-color/50 text-text-primary"
const kbdClass = "px-2 py-1 bg-bg-tertiary border border-border-color rounded text-[0.75rem] font-mono text-text-secondary"

export function renderShortcutsTab(): string {
  return `
    <div class="hidden settings-tab" id="tab-shortcuts" style="display: none;">
      <div class="${sectionClass}">
        <h3 class="${sectionTitleClass}">Keyboard Shortcuts</h3>
        <p class="${descClass}">
          Use these keyboard shortcuts to quickly control the presentation.
        </p>
        
        <table class="${tableClass}">
          <thead>
            <tr>
              <th class="${thClass}">Action</th>
              <th class="${thClass}">Shortcut</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="${tdClass}">Next Slide</td>
              <td class="${tdClass}"><kbd class="${kbdClass}">→</kbd> or <kbd class="${kbdClass}">Space</kbd></td>
            </tr>
            <tr>
              <td class="${tdClass}">Previous Slide</td>
              <td class="${tdClass}"><kbd class="${kbdClass}">←</kbd></td>
            </tr>
            <tr>
              <td class="${tdClass}">Go Live / Update</td>
              <td class="${tdClass}"><kbd class="${kbdClass}">Enter</kbd></td>
            </tr>
            <tr>
              <td class="${tdClass}">Black Screen</td>
              <td class="${tdClass}"><kbd class="${kbdClass}">B</kbd></td>
            </tr>
            <tr>
              <td class="${tdClass}">Clear Screen</td>
              <td class="${tdClass}"><kbd class="${kbdClass}">C</kbd></td>
            </tr>
            <tr>
              <td class="${tdClass}">Logo Screen</td>
              <td class="${tdClass}"><kbd class="${kbdClass}">L</kbd></td>
            </tr>
            <tr>
              <td class="${tdClass}">Lyrics Mode</td>
              <td class="${tdClass}"><kbd class="${kbdClass}">Esc</kbd></td>
            </tr>
            <tr>
              <td class="${tdClass}">Show Shortcuts</td>
              <td class="${tdClass}"><kbd class="${kbdClass}">?</kbd></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
}
