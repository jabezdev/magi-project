import { state } from '../../state'

export function renderMediaTab(): string {
    return `
    <div class="settings-tab" id="tab-media">
      <div class="settings-group">
        <h3>Logo Media</h3>
        <p class="settings-desc">Select a video or image to display when Logo mode is active.</p>
        <div class="media-grid" id="logo-video-grid">
          ${state.availableVideos.map(video => `
            <button class="media-card ${state.logoMedia === video.path ? 'selected' : ''}" data-video-path="${video.path}" title="${video.name}">
              <div class="media-thumb">
                <video src="${video.path}" muted preload="metadata"></video>
              </div>
              <span class="media-name">${video.name.replace(/\.[^.]+$/, '')}</span>
            </button>
          `).join('')}
          ${state.availableVideos.length === 0 ? '<div class="empty-msg">No videos in public/videos folder</div>' : ''}
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
                document.querySelectorAll('#logo-video-grid .media-card').forEach(el => el.classList.remove('selected'))
                btn.classList.add('selected')
            }
        }
    })
}
