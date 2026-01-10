import { setModalOpen } from '../utils/keyboard'

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
    modal.className = 'modal-overlay'
    modal.innerHTML = `
    <div class="shortcuts-modal">
      <div class="shortcuts-header">
        <h2>Keyboard Shortcuts</h2>
        <button class="modal-close" id="close-shortcuts">×</button>
      </div>
      <div class="shortcuts-content">
        <div class="shortcut-group">
          <h3>Navigation</h3>
          <div class="shortcut-item">
            <span class="key">←</span> / <span class="key">→</span>
            <span class="description">Previous / Next Slide</span>
          </div>
          <div class="shortcut-item">
            <span class="key">↑</span> / <span class="key">↓</span>
            <span class="description">Previous / Next Slide</span>
          </div>
        </div>
        
        <div class="shortcut-group">
          <h3>Display Modes</h3>
          <div class="shortcut-item">
            <span class="key">B</span>
            <span class="description">Black Screen</span>
          </div>
          <div class="shortcut-item">
            <span class="key">C</span>
            <span class="description">Clear (Background Video)</span>
          </div>
          <div class="shortcut-item">
            <span class="key">L</span>
            <span class="description">Logo</span>
          </div>
          <div class="shortcut-item">
            <span class="key">Esc</span>
            <span class="description">Lyrics Mode</span>
          </div>
        </div>
        
        <div class="shortcut-group">
          <h3>General</h3>
          <div class="shortcut-item">
            <span class="key">?</span>
            <span class="description">Show this help</span>
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
