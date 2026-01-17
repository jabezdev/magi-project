import { store } from '../state/store'
import { LibraryItem, GlobalSettings } from '../types'
import { api } from '../services/api'

export class MobileScreen {
  element: HTMLElement
  private currentItem: LibraryItem | null = null
  private _currentSettings: GlobalSettings | null = null

  constructor() {
    this.element = document.createElement('div')
    // Responsive layout: portrait = stacked, landscape = split view
    this.element.className = 'w-full h-full bg-white text-black flex flex-col font-sans mobile-screen'

    // Inject landscape CSS
    if (!document.getElementById('mobile-landscape-css')) {
      const style = document.createElement('style')
      style.id = 'mobile-landscape-css'
      style.textContent = `
        @media (orientation: landscape) and (max-width: 1024px) {
          .mobile-screen {
            flex-direction: row !important;
          }
          .mobile-screen #mob-content {
            flex: 1;
            overflow-y: auto;
          }
          .mobile-screen .mobile-sidebar {
            width: 40%;
            border-left: 1px solid #e5e7eb;
            overflow-y: auto;
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
            <!-- Header -->
            <div class="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10">
                <div class="text-xs font-bold opacity-75 uppercase tracking-wider">NOW LIVE</div>
                <div id="mob-title" class="text-lg font-bold truncate">Nothing Live</div>
            </div>

            <!-- Content -->
            <div id="mob-content" class="flex-1 overflow-y-auto p-4 pb-20">
                <div class="text-center text-gray-400 mt-10 text-sm">Waiting for content...</div>
            </div>

            <!-- Resume Auto-Scroll Button (hidden by default) -->
            <button id="btn-resume-scroll" class="fixed bottom-16 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hidden z-20 text-sm font-bold">
                ↓ Resume
            </button>

            <!-- Footer -->
            <div id="mob-footer" class="fixed bottom-0 left-0 right-0 p-2 bg-gray-100 border-t border-gray-200 text-xs flex justify-between items-center">
                <span class="text-gray-500">MAGI Mobile</span>
                <span id="mob-next-item" class="text-gray-600 font-medium"></span>
            </div>
        `

    // Resume scroll button logic
    const content = this.element.querySelector('#mob-content')
    const resumeBtn = this.element.querySelector('#btn-resume-scroll') as HTMLButtonElement
    let _userScrolled = false

    content?.addEventListener('scroll', () => {
      _userScrolled = true
      resumeBtn?.classList.remove('hidden')
    })

    resumeBtn?.addEventListener('click', () => {
      _userScrolled = false
      resumeBtn.classList.add('hidden')
      // Auto-scroll to active
      const active = this.element.querySelector('.mob-part-active')
      if (active) active.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
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
    const container = this.element.querySelector('#mob-content')
    const titleEl = this.element.querySelector('#mob-title')
    if (!container || !this.currentItem) return

    if (titleEl) titleEl.textContent = this.currentItem.title
    container.innerHTML = ''
    const item = this.currentItem

    switch (item.type) {
      case 'song':
        this.renderSongList(item as any, container as HTMLElement)
        break
      case 'scripture':
        this.renderText(item as any, container as HTMLElement)
        break
      default:
        this.renderGeneric(item, container as HTMLElement)
    }
  }

  renderSongList(song: any, container: HTMLElement) {
    // Mobile View Spec: "Large text area showing current lyrics" + "List of upcoming parts"
    // We render all parts in a readable vertical stream

    song.parts.forEach((part: any, index: number) => {
      const div = document.createElement('div')
      div.className = 'mb-8 p-3 rounded transition-colors duration-300'
      div.id = `mob-part-${index}`

      div.innerHTML = `
                <div class="text-xs font-bold text-blue-600 uppercase mb-1 part-label">${part.label}</div>
                <div class="text-xl leading-relaxed text-gray-900 whitespace-pre-wrap font-medium part-text">${part.lyrics}</div>
            `
      container.appendChild(div)
    })

    // Highlight initial if set
    if (store.state.live.slide_index !== undefined) {
      this.highlightPart(store.state.live.slide_index)
    }
  }

  highlightPart(index: number) {
    const container = this.element.querySelector('#mob-content')
    if (!container) return

    // Remove previous highlights
    container.querySelectorAll('.bg-blue-50').forEach(el => {
      el.className = el.className.replace(' bg-blue-50 border-l-4 border-blue-500', '')
    })

    const target = container.querySelector(`#mob-part-${index}`)
    if (target) {
      target.className += ' bg-blue-50 border-l-4 border-blue-500'

      // Auto scroll nicely
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  renderText(scripture: any, container: HTMLElement) {
    container.innerHTML = `
            <div class="text-lg leading-relaxed font-serif text-gray-800">
                "${scripture.text_content}"
            </div>
            <div class="text-sm text-blue-800 font-bold mt-4 text-right">
                — ${scripture.reference_title}
            </div>
        `
  }

  renderGeneric(item: LibraryItem, container: HTMLElement) {
    container.innerHTML = `
            <div class="flex flex-col items-center justify-center pt-20">
                <div class="text-6xl mb-4">📺</div>
                <div class="font-bold text-gray-600">Showing ${item.type}</div>
                ${item.type === 'video' || item.type === 'image' ?
        `<div class="text-xs bg-gray-200 px-2 py-1 rounded mt-2">See Main Screen</div>` : ''}
            </div>
        `
  }

  clear() {
    this.currentItem = null
    const container = this.element.querySelector('#mob-content')
    const titleEl = this.element.querySelector('#mob-title')
    if (titleEl) titleEl.textContent = 'Nothing Live'
    if (container) container.innerHTML = '<div class="text-center text-gray-400 mt-10 text-sm">Waiting for content...</div>'
  }
}
