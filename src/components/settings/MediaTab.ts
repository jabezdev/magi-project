import { state } from '../../state'

// Reusable Tailwind class constants for Settings UI
const groupClass = "mb-8 last:mb-0 settings-group"
const groupTitleClass = "text-xs font-semibold uppercase tracking-[0.5px] text-text-muted mb-4 pb-2 border-b border-border-color"
const descClass = "text-[0.8rem] text-text-secondary mb-4"
const mediaGridClass = "grid gap-3"
const mediaGridStyle = "grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));"
const mediaCardClass = "flex flex-col bg-bg-tertiary border-2 border-transparent rounded-sm overflow-hidden cursor-pointer transition-all duration-150 hover:border-border-color hover:-translate-y-[2px] media-card"
const mediaCardSelectedClass = "border-accent-primary shadow-[0_0_0_2px_rgba(99,102,241,0.2)]"
const mediaThumbClass = "aspect-video bg-black overflow-hidden"
const mediaNameClass = "p-2 text-[0.7rem] text-text-secondary text-center whitespace-nowrap overflow-hidden text-ellipsis"
const emptyMsgClass = "col-span-full text-center text-text-muted text-[0.7rem] p-4"

export function renderMediaTab(): string {
  return `
    <div class="hidden settings-tab" id="tab-media" style="display: none;">
      <div class="${groupClass}">
        <h3 class="${groupTitleClass}">Logo Media</h3>
        <p class="${descClass}">Select a video or image to display when Logo mode is active.</p>
        <div class="${mediaGridClass}" id="logo-video-grid" style="${mediaGridStyle}">
          ${state.availableVideos.map(video => `
            <button class="${mediaCardClass} ${state.logoMedia === video.path ? mediaCardSelectedClass : ''}" data-video-path="${video.path}" title="${video.name}">
              <div class="${mediaThumbClass}">
                <video src="${video.path}" muted preload="metadata" class="w-full h-full object-cover"></video>
              </div>
              <span class="${mediaNameClass}">${video.name.replace(/\.[^.]+$/, '')}</span>
            </button>
          `).join('')}
          ${state.availableVideos.length === 0 ? `<div class="${emptyMsgClass}">No videos in folder</div>` : ''}
        </div>
        <input type="hidden" id="logo-url" value="${state.logoMedia}">
      </div>
    </div>
  `
}

export function initMediaTabListeners(): void {
  // Logo video selection
  document.getElementById('logo-video-grid')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.media-card') as HTMLButtonElement
    if (btn) {
      const videoPath = btn.dataset.videoPath
      if (videoPath) {
        (document.getElementById('logo-url') as HTMLInputElement).value = videoPath
        // Update selection UI
        const selectedClasses = ['border-accent-primary', 'shadow-[0_0_0_2px_rgba(99,102,241,0.2)]']
        document.querySelectorAll('#logo-video-grid .media-card').forEach(el => {
          el.classList.remove('selected', ...selectedClasses)
          el.classList.add('border-transparent')
        })
        btn.classList.add('selected', ...selectedClasses)
        btn.classList.remove('border-transparent')
      }
    }
  })
}
