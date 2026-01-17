import { store } from '../state/store'
import { LibraryItem, GlobalSettings } from '../types'
import { api } from '../services/api'

export class LowerThirds {
  element: HTMLElement
  private currentItem: LibraryItem | null = null
  private currentSlideIndex: number = 0
  private safeAreaMargin = 48 // Default 48px safe area
  private safeAreaBottom = 48
  private _currentSettings: GlobalSettings | null = null

  constructor() {
    this.element = document.createElement('div')
    // Configurable safe area margins
    this.element.className = 'w-full h-full bg-transparent flex flex-col justify-end overflow-hidden'
    this.element.style.paddingBottom = `${this.safeAreaBottom}px`
    this.element.style.paddingLeft = `${this.safeAreaMargin}px`
    this.element.style.paddingRight = `${this.safeAreaMargin}px`

    // Subscribe to settings changes
    store.subscribeSettings((settings) => {
      this._currentSettings = settings
      this.applySettings(settings)
    })

    store.subscribe(state => {
      if (state.live.item_id !== this.currentItem?.id) {
        if (state.live.item_id) {
          this.currentSlideIndex = 0
          this.loadItem(state.live.item_id)
        } else {
          this.clear()
        }
      } else {
        if (state.live.slide_index !== undefined && state.live.slide_index !== this.currentSlideIndex) {
          this.currentSlideIndex = state.live.slide_index
          this.renderContent()
        }
      }
    })
  }

  /**
   * Apply settings to the screen's CSS variables
   */
  private applySettings(settings: GlobalSettings) {
    const lts = settings.lowerThirdsSettings
    const el = this.element

    // Apply background color (chroma key support)
    el.style.setProperty('--lt-bg-color', lts.backgroundColor)
    el.style.setProperty('--lt-bg-opacity', `${lts.backgroundOpacity}`)

    // Apply font settings
    el.style.setProperty('--lt-font-family', lts.fontFamily)
    el.style.setProperty('--lt-font-size', `${lts.fontSize}px`)
    el.style.setProperty('--lt-font-weight', lts.fontWeight)
    el.style.setProperty('--lt-text-color', lts.textColor)
    el.style.setProperty('--lt-text-align', lts.textAlign)
    el.style.setProperty('--lt-text-transform', lts.allCaps ? 'uppercase' : 'none')

    // Apply margins and padding
    this.safeAreaMargin = lts.marginLeft
    this.safeAreaBottom = lts.marginBottom
    el.style.paddingBottom = `${this.safeAreaBottom}px`
    el.style.paddingLeft = `${this.safeAreaMargin}px`
    el.style.paddingRight = `${lts.marginRight}px`
    el.style.paddingTop = `${lts.marginTop}px`

    // Animation duration
    el.style.setProperty('--lt-animation-duration', `${lts.animationDuration}s`)
  }


  async loadItem(id: string) {
    try {
      let item = store.library.find(i => i.id === id)
      if (!item) item = await api.library.get(id)
      this.currentItem = item
      this.currentSlideIndex = store.state.live.slide_index || 0
      this.renderContent()
    } catch (e) {
      console.error(e)
    }
  }

  renderContent() {
    this.element.innerHTML = ''
    if (!this.currentItem) return

    const item = this.currentItem

    // CONTENT EXCLUSION RULE:
    // Videos, Presentations (Canva/Local), and Images should NOT show lower thirds
    // They occupy full visual attention and overlay is redundant
    if (item.type === 'video' || item.type === 'image' || item.type === 'presentation') {
      // Force transparent/empty
      return
    }

    // Only render Text-based content (Songs, Scripture)
    if (item.type === 'song' || item.type === 'scripture') {
      this.renderTextItem(item)
    }
  }

  renderTextItem(item: any) {
    let text = ''
    let label = ''

    if (item.type === 'song') {
      const part = item.parts?.[this.currentSlideIndex]
      if (part) {
        text = part.lyrics
        label = part.label
      }
    } else if (item.type === 'scripture') {
      if (item.data?.slides) {
        const slide = item.data.slides[this.currentSlideIndex]
        if (slide) {
          text = slide.text
          label = slide.label || item.title
        }
      } else {
        text = item.text_content
        label = item.reference_title
      }
    }

    if (!text) return

    // Render Template
    // 2-line max usually for lower thirds, but we'll allow wrapping
    // High contrast text with heavy shadow/outline
    const div = document.createElement('div')
    div.className = 'animate-fade-in-up'
    div.innerHTML = `
            <div class="flex flex-col items-center text-center">
                 <div class="text-white font-bold text-5xl leading-tight drop-shadow-xl" 
                      style="text-shadow: 2px 2px 0px #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;">
                    ${text}
                 </div>
                 ${label ? `<div class="text-yellow-400 font-bold text-xl mt-2 uppercase tracking-widest drop-shadow-md" style="text-shadow: 1px 1px 0 #000;">${label}</div>` : ''}
            </div>
        `
    this.element.appendChild(div)
  }

  clear() {
    this.currentItem = null
    this.element.innerHTML = ''
  }
}
