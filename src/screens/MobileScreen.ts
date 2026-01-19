import { store } from '../state/store'
import { LibraryItem, GlobalSettings } from '../types'
import { api } from '../services/api'
import { BehaviorRegistry } from '../behaviors/registry'
import { MobileContext } from '../behaviors/types'

export class MobileScreen {
  element: HTMLElement
  private currentItem: LibraryItem | null = null
  private _currentSettings: GlobalSettings | null = null
  private _userScrolled = false

  constructor() {
    this.element = document.createElement('div')
    // Responsive layout: portrait = stacked, landscape = split view
    this.element.className = 'w-full h-full bg-black text-white flex flex-col font-sans mobile-screen'

    // Inject landscape CSS
    if (!document.getElementById('mobile-landscape-css')) {
      const style = document.createElement('style')
      style.id = 'mobile-landscape-css'
      style.textContent = `
        @media (orientation: landscape) {
          .mobile-screen {
            flex-direction: row !important;
          }
          .mobile-screen .header-bar {
            width: 320px;
            display: flex;
            flex-direction: column;
            border-right: 1px solid #333;
            background: #111;
          }
           .mobile-screen .header-bar .now-live-label {
             display: block;
             opacity: 0.5;
           }
          
          /* Main Content Area */
          .mobile-screen #mob-content {
            flex: 1;
            overflow-y: auto;
            height: 100%;
            padding: 2rem !important;
          }

          /* In Landscape, we want the current lyrics to be HUGE on the right */
          .mobile-screen .part-text-active {
             font-size: 4rem !important;
             line-height: 1.1 !important;
          }
        }
      `
      document.head.appendChild(style)
    }

    this.renderShell()

    // Subscribe to settings changes
    store.subscribeSettings((settings) => {
      this._currentSettings = settings
      this.applySettings(settings)
    })

    store.subscribe(state => {
      // Update Next Item
      this.updateNextItem(state.live.item_id || undefined)

      if (state.live.item_id !== this.currentItem?.id) {
        if (state.live.item_id) {
          this.loadItem(state.live.item_id)
        } else {
          this.clear()
        }
      } else {
        // Check slide index update for highlighting
        if (state.live.slide_index !== undefined) {
          this.highlightPart(state.live.slide_index)
        }
      }
    })
  }

  /**
   * Apply settings to the screen's CSS variables
   */
  private applySettings(settings: GlobalSettings) {
    const outputSettings = settings.outputs.mobile
    const el = this.element

    // Apply font settings
    el.style.setProperty('--mobile-font-family', outputSettings.fontFamily)
    el.style.setProperty('--mobile-font-size', `${outputSettings.fontSize}rem`)
    el.style.setProperty('--mobile-line-height', `${outputSettings.lineHeight}`)
    el.style.setProperty('--mobile-text-color', outputSettings.textColor)

    // Apply margins
    el.style.setProperty('--mobile-margin-top', `${outputSettings.marginTop}px`)
    el.style.setProperty('--mobile-margin-bottom', `${outputSettings.marginBottom}px`)
    el.style.setProperty('--mobile-margin-left', `${outputSettings.marginLeft}px`)
    el.style.setProperty('--mobile-margin-right', `${outputSettings.marginRight}px`)
  }


  renderShell() {
    this.element.innerHTML = `
            <!-- Header / Sidebar in Landscape -->
            <div class="header-bar bg-[#111] text-white shadow-md z-10 shrink-0 border-b border-gray-800">
                <div class="p-4">
                    <div class="now-live-label text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">NOW LIVE</div>
                    <div id="mob-title" class="text-xl font-bold truncate text-white">Nothing Live</div>
                </div>
                <!-- Landscape-only arrangement list check -->
                <div id="mob-arrangement-list" class="hidden md:block flex-1 overflow-y-auto p-4 space-y-2">
                    <!-- Setup for Split View List -->
                </div>
            </div>

            <!-- Content -->
            <div id="mob-content" class="flex-1 overflow-y-auto p-4 pb-24 scroll-smooth">
                <div class="text-center text-gray-400 mt-10 text-sm">Waiting for content...</div>
                <div class="h-12"><!-- Spacer --></div>
            </div>

            <!-- Resume Auto-Scroll Button (Float) -->
            <button id="btn-resume-scroll" class="fixed bottom-16 right-4 bg-blue-600 text-white px-5 py-3 rounded-full shadow-xl hidden z-20 text-sm font-bold flex items-center gap-2 transform transition-transform hover:scale-105">
                <span>⬇</span> Resume Auto-Scroll
            </button>

            <!-- Footer -->
            <div id="mob-footer" class="fixed bottom-0 left-0 right-0 h-14 bg-[#0a0a0a] border-t border-gray-800 flex justify-between items-center px-6 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.5)]">
                <div class="flex flex-col">
                     <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">NEXT</span>
                     <span id="mob-next-item" class="text-base font-bold text-gray-200 truncate max-w-[200px]">--</span>
                </div>
                <div class="text-blue-500 font-bold text-xs tracking-widest" onclick="window.scrollTo(0, 0)">MAGI</div>
            </div>
        `

    // Resume scroll button logic
    const content = this.element.querySelector('#mob-content')
    const resumeBtn = this.element.querySelector('#btn-resume-scroll') as HTMLButtonElement

    content?.addEventListener('touchstart', () => {
      // User is touching, potential scroll
      this._userScrolled = true
      this.updateResumeButton()
    }, { passive: true })

    // Also detect wheel for desktop testing
    content?.addEventListener('wheel', () => {
      this._userScrolled = true
      this.updateResumeButton()
    }, { passive: true })

    resumeBtn?.addEventListener('click', () => {
      this._userScrolled = false
      this.updateResumeButton()
      // Auto-scroll to active
      const active = this.element.querySelector('.mob-part-active')
      if (active) active.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  updateResumeButton() {
    const resumeBtn = this.element.querySelector('#btn-resume-scroll')
    if (this._userScrolled) {
      resumeBtn?.classList.remove('hidden')
    } else {
      resumeBtn?.classList.add('hidden')
    }
  }

  updateNextItem(currentId: string | undefined) {
    const nextEl = this.element.querySelector('#mob-next-item')
    if (!nextEl) return

    const schedule = store.schedule
    let nextTitle = "--"

    const getItemTitle = (sItem: import('../types').ScheduleItem) => {
      if (sItem.label) return sItem.label
      const libItem = store.library.find(li => li.id === sItem.library_item_id)
      return libItem?.title || 'Unknown'
    }

    if (schedule.length > 0) {
      const idx = schedule.findIndex(i => i.id === currentId || i.library_item_id === currentId)

      if (idx !== -1 && idx < schedule.length - 1) {
        nextTitle = getItemTitle(schedule[idx + 1])
      } else if (idx === -1 && currentId) {
        nextTitle = getItemTitle(schedule[0])
      } else if (schedule.length > 0 && !currentId) {
        nextTitle = getItemTitle(schedule[0])
      } else {
        nextTitle = "End of Service"
      }
    }

    nextEl.textContent = nextTitle
  }

  async loadItem(id: string) {
    try {
      let item = store.library.find(i => i.id === id)
      if (!item) item = await api.library.get(id)
      this.currentItem = item
      this.renderContent()
    } catch (e) {
      console.error(e)
    }
  }

  renderContent() {
    const container = this.element.querySelector('#mob-content') as HTMLElement
    const titleEl = this.element.querySelector('#mob-title')
    if (!container || !this.currentItem) return

    if (titleEl) titleEl.textContent = this.currentItem.title
    container.innerHTML = ''
    const item = this.currentItem

    // Reset scroll state
    this._userScrolled = false
    this.updateResumeButton()

    const ctx: MobileContext = {
      container,
      settings: this._currentSettings || undefined
    }

    const behavior = BehaviorRegistry.get(item.type)
    if (behavior && behavior.renderMobile) {
      behavior.renderMobile(item, ctx)
    } else {
      container.innerHTML = `<div class="text-center text-gray-500 mt-10">Unsupported Mobile Content: ${item.type}</div>`
    }

    // Highlight initial if set
    if (store.state.live.slide_index !== undefined) {
      this.highlightPart(store.state.live.slide_index)
    }
  }

  highlightPart(index: number) {
    const container = this.element.querySelector('#mob-content')
    if (!container) return

    // Remove previous highlights
    container.querySelectorAll('.mob-part-active').forEach(el => {
      el.classList.remove('mob-part-active', 'bg-blue-900/30', 'border-blue-500/50', 'shadow-lg', 'scale-[1.02]')
      el.classList.add('border-transparent', 'opacity-50')

      const textEl = el.querySelector('.part-text')
      if (textEl) {
        textEl.classList.remove('text-white', 'part-text-active')
        textEl.classList.add('text-gray-400')
      }
    })

    const target = container.querySelector(`#mob-part-${index}`)
    if (target) {
      target.classList.add('mob-part-active', 'bg-blue-900/30', 'border-blue-500/50', 'shadow-lg', 'scale-[1.02]')
      target.classList.remove('border-transparent', 'opacity-50')

      const textEl = target.querySelector('.part-text')
      if (textEl) textEl.classList.add('text-white', 'part-text-active')

      // Deactivate others
      container.querySelectorAll('.part-text').forEach(el => {
        if (el !== textEl) el.classList.remove('text-white', 'part-text-active')
      })

      // Auto scroll nicely if not overridden by user
      if (!this._userScrolled) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  clear() {
    this.currentItem = null
    const container = this.element.querySelector('#mob-content')
    const titleEl = this.element.querySelector('#mob-title')
    if (titleEl) titleEl.textContent = 'Nothing Live'
    if (container) container.innerHTML = '<div class="text-center text-gray-400 mt-10 text-sm">Waiting for content...</div>'
  }
}
