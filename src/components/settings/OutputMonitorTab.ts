/**
 * Output Monitor Settings Tab
 * 
 * Controls for adjusting output monitor preview resolution and performance options.
 */

import { state } from '../../state'

const RESOLUTION_OPTIONS = [
    { label: '640×480 (Low)', width: 640, height: 480 },
    { label: '800×600', width: 800, height: 600 },
    { label: '1024×768 (Default)', width: 1024, height: 768 },
    { label: '1280×960', width: 1280, height: 960 },
    { label: '1920×1440 (High)', width: 1920, height: 1440 }
]

export function renderOutputMonitorTab(): string {
    const settings = state.layoutSettings
    const currentRes = settings.confidenceMonitorResolution || { width: 1024, height: 768 }

    return `
    <div class="settings-tab-content" data-tab="outputs">
      <div class="settings-section">
        <h3>Confidence Monitor Resolution</h3>
        <p class="settings-hint">Lower resolution reduces GPU usage in the control panel preview. The actual output is unaffected.</p>
        <select id="confidence-resolution" class="settings-select">
          ${RESOLUTION_OPTIONS.map(opt => `
            <option value="${opt.width}x${opt.height}" ${currentRes.width === opt.width ? 'selected' : ''}>
              ${opt.label}
            </option>
          `).join('')}
        </select>
      </div>

      <div class="settings-section">
        <h3>Performance Tips</h3>
        <ul class="settings-tips">
          <li><strong>Toggle off unused monitors</strong> - Click the power button next to each monitor label to disable rendering</li>
          <li><strong>Enable Static Mode</strong> - Click the image icon on Main Projection to use a thumbnail instead of video</li>
          <li><strong>Lower resolution</strong> - Use 640×480 or 800×600 for Confidence Monitor on older hardware</li>
        </ul>
      </div>
    </div>
  `
}

export function getConfidenceResolutionFromForm(): { width: number; height: number } {
    const select = document.getElementById('confidence-resolution') as HTMLSelectElement
    if (!select) return { width: 1024, height: 768 }

    const [width, height] = select.value.split('x').map(Number)
    return { width, height }
}
