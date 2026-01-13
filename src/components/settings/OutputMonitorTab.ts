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

// Reusable Tailwind class constants
const sectionClass = "mb-5"
const sectionTitleClass = "text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.5px] mb-3"
const hintClass = "text-[0.75rem] text-text-secondary mb-3 italic"
const selectClass = "w-full max-w-[300px] px-3 py-2 bg-bg-tertiary border border-border-color rounded-sm text-text-primary text-[0.8rem] cursor-pointer focus:outline-none focus:border-accent-primary"
const listClass = "text-[0.8rem] text-text-secondary list-disc pl-5 space-y-2"

export function renderOutputMonitorTab(): string {
  const settings = state.layoutSettings
  const currentRes = settings.confidenceMonitorResolution || { width: 1024, height: 768 }

  return `
    <div class="hidden settings-tab" id="tab-outputs" style="display: none;">
      <div class="${sectionClass}">
        <h3 class="${sectionTitleClass}">Confidence Monitor Resolution</h3>
        <p class="${hintClass}">Lower resolution reduces GPU usage in the control panel preview. The actual output is unaffected.</p>
        <select id="confidence-resolution" class="${selectClass}">
          ${RESOLUTION_OPTIONS.map(opt => `
            <option value="${opt.width}x${opt.height}" ${currentRes.width === opt.width ? 'selected' : ''}>
              ${opt.label}
            </option>
          `).join('')}
        </select>
      </div>

      <div class="${sectionClass}">
        <h3 class="${sectionTitleClass}">Performance Tips</h3>
        <ul class="${listClass}">
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
