import { ICONS } from '../../constants'

export function openScheduleNameModal(triggerElement: HTMLElement, onSave: (name: string) => Promise<boolean | void> | void, onCancel?: () => void): void {
  // Remove existing popovers if any
  document.querySelectorAll('.schedule-popover').forEach(el => el.remove())

  // Create Popover HTML
  const popover = document.createElement('div')
  popover.className = 'schedule-popover absolute w-[320px] bg-bg-tertiary border border-border-color rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-[10000] p-4 flex flex-col gap-3'
  // Note: backgroundColor was 'var(--bg-color-dark)', assuming bg-tertiary is close or same. 
  // Checking variables.css, --bg-secondary or --bg-tertiary are dark backgrounds. 
  // The original code used var(--bg-color-dark) which isn't in variables.css showed, might be legacy or aliased. 
  // I will use bg-bg-secondary as a safe standard dark theme modal background.

  popover.innerHTML = `
    <div class="flex justify-between items-center mb-1">
      <div class="flex items-center gap-2">
        <span class="text-[1.1rem] text-text-primary">${ICONS.calendar || '📅'}</span>
        <h3 class="m-0 text-base font-semibold text-text-primary">New Schedule</h3>
      </div>
      <button class="close-btn bg-transparent border-none text-text-secondary cursor-pointer p-1 hover:text-text-primary transition-colors">${ICONS.close}</button>
    </div>
    
    <div class="flex flex-col gap-1.5">
      <label for="schedule-name-input" class="block mb-1.5 text-sm text-text-secondary">Schedule Name</label>
      <input type="text" id="schedule-name-input" placeholder="YYYY-MM-DD" class="w-full p-2 rounded-md border border-border-color bg-bg-primary text-text-primary text-[0.95rem] outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all" />
      <div id="schedule-error-msg" class="text-xs text-danger font-medium hidden"></div>
      <p class="m-1 0 0 text-xs text-text-secondary opacity-80">Default is the upcoming Sunday.</p>
    </div>

    <div class="flex justify-end gap-2 mt-1">
        <button class="cancel-btn text-sm py-1.5 px-3 bg-transparent border border-border-color text-text-secondary rounded-md cursor-pointer hover:bg-bg-hover hover:text-text-primary transition-colors">Cancel</button>
        <button class="create-btn text-sm py-1.5 px-3 flex items-center gap-1.5 bg-accent-primary text-white border-none rounded-md cursor-pointer hover:bg-accent-secondary transition-colors font-medium">
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

  const handleSave = async () => {
    const name = input.value.trim()
    const errorMsg = popover.querySelector('#schedule-error-msg')

    if (name) {
      // Disable button
      const btn = popover.querySelector('.create-btn') as HTMLButtonElement
      if (btn) {
        btn.disabled = true
        btn.innerHTML = 'Creating...'
      }

      try {
        const result = await onSave(name)
        if (result === false) {
          // Error handled by callback returning false (meaning failed)
          if (errorMsg) {
            errorMsg.textContent = 'Schedule with this name already exists.'
            errorMsg.classList.remove('hidden')
          }
          input.classList.add('border-danger', 'animate-[shake_0.3s_ease]')
          setTimeout(() => input.classList.remove('animate-[shake_0.3s_ease]'), 300)
        } else {
          close()
        }
      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = 'An error occurred.'
          errorMsg.classList.remove('hidden')
        }
      } finally {
        if (btn) {
          btn.disabled = false
          btn.innerHTML = `${ICONS.plus} Create`
        }
      }
    } else {
      input.classList.add('border-danger', 'animate-[shake_0.3s_ease]')
      input.focus()
      setTimeout(() => input.classList.remove('animate-[shake_0.3s_ease]'), 300)
    }
  }

  popover.querySelector('.close-btn')?.addEventListener('click', close)
  popover.querySelector('.cancel-btn')?.addEventListener('click', close)
  popover.querySelector('.create-btn')?.addEventListener('click', handleSave)

  // Remove error on input
  input.addEventListener('input', () => {
    input.classList.remove('border-danger')
    const errorMsg = popover.querySelector('#schedule-error-msg')
    if (errorMsg) errorMsg.classList.add('hidden')
  })

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
