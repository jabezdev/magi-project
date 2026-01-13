import { setModalOpen } from '../../utils'

let isOpen = false

export function isShortcutsModalOpen(): boolean {
  return isOpen
}

export function openShortcutsModal(): void {
  if (isOpen) return

  const existing = document.getElementById('shortcuts-modal')
  if (existing) existing.remove()

  const modal = document.createElement('div')
  modal.id = 'shortcuts-modal'
  modal.className = 'modal-overlay' // Keep this if it's a global modal overlay class

  // Inline Tailwind Classes
  const modalContentClass = "w-full max-w-[500px] bg-bg-secondary border border-border-color rounded-lg overflow-hidden animate-[modalSlideIn_0.2s_ease-out] shadow-[0_10px_25px_rgba(0,0,0,0.5)]"
  const headerClass = "flex justify-between items-center px-6 py-4 bg-bg-tertiary border-b border-border-color"
  const headerTitleClass = "m-0 text-xl text-text-primary"
  const contentClass = "grid gap-6 p-6"
  const groupTitleClass = "text-sm uppercase tracking-[1px] text-text-muted mb-3 pb-1 border-b border-border-color"
  const itemClass = "flex items-center justify-between mb-2"
  const keyClass = "bg-bg-tertiary border border-border-color rounded px-2 py-[0.1rem] font-mono text-[0.8rem] text-text-primary min-w-[24px] text-center"
  const descriptionClass = "text-text-secondary text-[0.9rem]"

  modal.innerHTML = `
    <div class="${modalContentClass}">
      <div class="${headerClass}">
        <h2 class="${headerTitleClass}">Keyboard Shortcuts</h2>
        <button class="modal-close" id="close-shortcuts">×</button>
      </div>
      <div class="${contentClass}">
        <div class="shortcut-group">
          <h3 class="${groupTitleClass}">Navigation</h3>
          <div class="${itemClass}">
            <span><span class="${keyClass}">←</span> / <span class="${keyClass}">→</span></span>
            <span class="${descriptionClass}">Previous / Next Slide</span>
          </div>
          <div class="${itemClass}">
            <span><span class="${keyClass}">↑</span> / <span class="${keyClass}">↓</span></span>
            <span class="${descriptionClass}">Previous / Next Slide</span>
          </div>
        </div>
        
        <div class="shortcut-group">
          <h3 class="${groupTitleClass}">Display Modes</h3>
          <div class="${itemClass}">
            <span class="${keyClass}">B</span>
            <span class="${descriptionClass}">Black Screen</span>
          </div>
          <div class="${itemClass}">
            <span class="${keyClass}">C</span>
            <span class="${descriptionClass}">Clear (Background Video)</span>
          </div>
          <div class="${itemClass}">
            <span class="${keyClass}">L</span>
            <span class="${descriptionClass}">Logo</span>
          </div>
          <div class="${itemClass}">
            <span class="${keyClass}">Esc</span>
            <span class="${descriptionClass}">Lyrics Mode</span>
          </div>
        </div>
        
        <div class="shortcut-group">
          <h3 class="${groupTitleClass}">General</h3>
          <div class="${itemClass}">
            <span class="${keyClass}">?</span>
            <span class="${descriptionClass}">Show this help</span>
          </div>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  isOpen = true
  setModalOpen(true)

  // Attach listeners
  document.getElementById('close-shortcuts')?.addEventListener('click', closeShortcutsModal)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeShortcutsModal()
  })
}

export function closeShortcutsModal(): void {
  const modal = document.getElementById('shortcuts-modal')
  if (modal) modal.remove()
  isOpen = false
  setModalOpen(false)
}

export function toggleShortcutsModal(): void {
  if (isOpen) {
    closeShortcutsModal()
  } else {
    openShortcutsModal()
  }
}
