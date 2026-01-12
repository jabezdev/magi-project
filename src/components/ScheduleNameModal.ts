import { ICONS } from '../constants/icons'

export function openScheduleNameModal(triggerElement: HTMLElement, onSave: (name: string) => void, onCancel?: () => void): void {
  // Remove existing popovers if any
  document.querySelectorAll('.schedule-popover').forEach(el => el.remove())

  // Create Popover HTML
  const popover = document.createElement('div')
  popover.className = 'schedule-popover'
  // Inline styles for popover basic layout (can also be moved to CSS)
  Object.assign(popover.style, {
    position: 'absolute',
    width: '320px',
    backgroundColor: 'var(--bg-color-dark)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
    zIndex: '1000',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  })

  popover.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 1.1rem; color: var(--text-color);">${ICONS.calendar || '📅'}</span>
        <h3 style="margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-color);">New Schedule</h3>
      </div>
      <button class="close-btn icon-btn-sm" style="background: none; border: none; color: var(--text-color-secondary); cursor: pointer; padding: 4px;">${ICONS.close}</button>
    </div>
    
    <div class="form-group">
      <label for="schedule-name-input" style="display: block; margin-bottom: 6px; font-size: 0.85rem; color: var(--text-color-secondary);">Schedule Name</label>
      <input type="text" id="schedule-name-input" placeholder="YYYY-MM-DD" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color); font-size: 0.95rem; outline: none;" />
      <p style="margin: 4px 0 0; font-size: 0.75rem; color: var(--text-color-secondary); opacity: 0.8;">Default is the upcoming Sunday.</p>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;">
        <button class="btn-ghost cancel-btn" style="font-size: 0.9rem; padding: 6px 12px;">Cancel</button>
        <button class="btn-primary create-btn" style="font-size: 0.9rem; padding: 6px 12px; display: flex; align-items: center; gap: 6px;">
          ${ICONS.plus} Create
        </button>
    </div>
  `

  document.body.appendChild(popover)

  // Positioning Logic
  const rect = triggerElement.getBoundingClientRect()
  const scrollY = window.scrollY
  const scrollX = window.scrollX

  // Default: Position below, aligned left
  let top = rect.bottom + 8 + scrollY
  let left = rect.left + scrollX

  // If too close to right edge, align right
  if (left + 320 > window.innerWidth) {
    left = (rect.right + scrollX) - 320
  }

  // If too close to bottom, position above
  if (top + 200 > window.innerHeight + scrollY) {
    top = (rect.top + scrollY) - 200 // approximate height
  }

  // Ensure not off-screen left
  if (left < 10) left = 10

  popover.style.top = `${top}px`
  popover.style.left = `${left}px`

  // Calculate upcoming Sunday
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 is Sunday
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek

  const nextSunday = new Date(today)
  nextSunday.setDate(today.getDate() + daysUntilSunday)

  // Format YYYY-MM-DD
  const defaultName = nextSunday.toISOString().split('T')[0]

  const input = popover.querySelector('#schedule-name-input') as HTMLInputElement
  if (input) {
    input.value = defaultName
    input.focus()
    input.select()
  }

  // Event Handlers
  const close = () => {
    popover.remove()
    document.removeEventListener('mousedown', handleClickOutside)
    if (onCancel) onCancel()
  }

  const handleSave = () => {
    const name = input.value.trim()
    if (name) {
      onSave(name)
      close()
    } else {
      input.style.borderColor = 'var(--error-color)'
      input.focus()
    }
  }

  popover.querySelector('.close-btn')?.addEventListener('click', close)
  popover.querySelector('.cancel-btn')?.addEventListener('click', close)
  popover.querySelector('.create-btn')?.addEventListener('click', handleSave)

  // Enter key to save, Escape to cancel
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      close()
    }
  })

  // Click outside to close - use mousedown to catch it before click propagates
  const handleClickOutside = (e: Event) => {
    if (!popover.contains(e.target as Node) && !triggerElement.contains(e.target as Node)) {
      close()
    }
  }

  // Use setTimeout to avoid immediate closing if the click that opened it bubbles up
  setTimeout(() => {
    document.addEventListener('mousedown', handleClickOutside)
  }, 0)
}
