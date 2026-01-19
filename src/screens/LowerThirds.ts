import { store } from '../state/store'
import { api } from '../services/api'
import { LibraryItem, GlobalSettings, SongItem } from '../types'
import { flattenSongToSlides, FlattenedSlide } from '../utils/songSlides'

export class LowerThirds {
  element: HTMLElement
  private currentItem: LibraryItem | null = null
  private currentSlideIndex: number = 0
  private safeAreaMargin = 48 // Default 48px safe area
  private safeAreaBottom = 48

  private flattenedSlides: FlattenedSlide[] = []

  constructor() {
    this.element = document.createElement('div')
    // Configurable safe area margins - Use flex-end to push content to bottom
    this.element.className = 'w-full h-full bg-transparent flex flex-col justify-end overflow-hidden pb-12'

    // Subscribe to settings changes
    store.subscribeSettings((settings) => {

      this.applySettings(settings)
    })

    store.subscribe(state => {
      // Check global overrules first? Lower thirds usually independent but "Clear" might affect it
      // For now, respect clear
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
          // Transition Logic
          this.renderContent()
        }
      }

      // Handle Clear Signal
      if (state.blackout_active || !state.live.item_id) { // clear_active logic is handled by "Clear Text" usually
        // If "Clear" is active, we might want to hide just the text
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
    // Note: The main container is transparent. The *content box* might need background.
    // Or the whole screen uses a color (e.g. green screen).

    // Setting global background variable
    if (lts.backgroundColor && lts.backgroundColor !== 'transparent') {
      el.style.backgroundColor = lts.backgroundColor
    } else {
      el.style.backgroundColor = 'transparent'
    }

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

    // Ignoring Top Margin usually for lower thirds as it is bottom aligned
    // el.style.paddingTop = `${lts.marginTop}px`

    // Animation duration
    el.style.setProperty('--lt-animation-duration', `${lts.animationDuration}s`)
  }


  async loadItem(id: string) {
    try {
      let item = store.library.find(i => i.id === id)
      if (!item) item = await api.library.get(id)
      this.currentItem = item

      // Flatten slides for songs
      if (item.type === 'song') {
        this.flattenedSlides = flattenSongToSlides(item as SongItem)
      } else {
        this.flattenedSlides = []
      }

      this.currentSlideIndex = store.state.live.slide_index || 0
      this.renderContent()
    } catch (e) {
      console.error(e)
    }
  }

  renderContent() {
    // CONTENT EXCLUSION RULE:
    // Videos, Presentations (Canva/Local), and Images should NOT show lower thirds
    if (!this.currentItem) {
      this.element.innerHTML = ''
      return
    }

    const item = this.currentItem

    if (item.type === 'video' || item.type === 'image' || item.type === 'presentation') {
      this.element.innerHTML = ''
      return
    }

    // Prepare Container
    // We want a smooth swap. 
    // Existing content?
    const existing = this.element.firstElementChild;
    if (existing) {
      // Fade out existing
      existing.classList.add('opacity-0', 'translate-y-4')
      setTimeout(() => existing.remove(), 300)
    }

    // Render new content
    let contentDiv: HTMLElement | null = null;

    if (item.type === 'song') {
      contentDiv = this.createSongElement()
    } else if (item.type === 'scripture') {
      contentDiv = this.createScriptureElement(item as any)
    }

    if (contentDiv) {
      // Enforce Bottom 20% constraint visually
      // The container flex-end does most of the work, but we ensure max-height
      contentDiv.style.maxHeight = "30vh";
      this.element.appendChild(contentDiv)

      // Trigger reflow for transition
      void contentDiv.offsetWidth
      contentDiv.classList.remove('opacity-0', 'translate-y-4')
    }
  }

  createSongElement() {
    const slide = this.flattenedSlides[this.currentSlideIndex]
    if (!slide || !slide.text) return null

    const div = document.createElement('div')
    // Base styles: elegantly centered, gentle animation
    div.className = 'w-full flex flex-col items-center text-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] transform opacity-0 translate-y-8'

    // Text styling using variables - More Premium Look
    // Using a subtle gradient backdrop instead of solid block
    div.innerHTML = `
            <div class="px-12 py-6 rounded-2xl mx-8 max-w-7xl backdrop-blur-md relative overflow-hidden group shadow-2xl" 
                 style="background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 100%);">
                 
                 <!-- Geometric Accent (Top Bar) -->
                 <div class="absolute top-0 left-[20%] right-[20%] h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

                 <div class="text-white font-bold text-[3.5rem] leading-[1.15] tracking-tight drop-shadow-2xl font-sans relative z-10" 
                      style="text-shadow: 0 4px 12px rgba(0,0,0,0.8);">
                    ${slide.text.replace(/\n/g, '<br/>')}
                 </div>
                 
                 <!-- Subtle bottom shine -->
                 <div class="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            </div>
        `
    return div
  }

  createScriptureElement(item: any) {
    let text = ''
    let label = ''

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

    if (!text) return null

    const div = document.createElement('div')
    div.className = 'w-full flex flex-col items-center text-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] transform opacity-0 translate-y-8'

    div.innerHTML = `
            <div class="flex flex-row items-end gap-8 px-10 py-6 mx-8 max-w-7xl bg-gradient-to-r from-black/90 via-black/70 to-black/90 rounded-xl backdrop-blur-md shadow-2xl border-b border-white/10">
                 <div class="text-white font-serif font-medium text-[3rem] leading-snug drop-shadow-xl text-left flex-1" 
                      style="text-shadow: 0 4px 8px rgba(0,0,0,0.9);">
                    “${text}”
                 </div>
                 <div class="text-yellow-500 font-bold text-xl uppercase tracking-[0.2em] transform -translate-y-2 font-sans border-l-2 border-yellow-500/30 pl-6 self-center shrink-0">
                    ${label}
                 </div>
            </div>
        `
    return div
  }

  clear() {
    this.currentItem = null
    this.element.innerHTML = ''
  }
}

