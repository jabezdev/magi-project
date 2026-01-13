import { state } from '../../state'
import { ICONS } from '../../constants/icons'
import type { Song, SongPart, PartType, DisplayMode } from '../../types'
import { getNextPosition, getPrevPosition } from '../../utils/slides'
import {
  goLiveWithPosition,
  prevSlide,
  nextSlide,
  setDisplayMode
} from '../../actions/controlPanel'
import { toggleClass, updateDisabled } from '../../utils/dom'

function getArrangementParts(song: Song, variationIndex: number): Array<{ part: SongPart; partIndex: number; partId: PartType }> {
  const variation = song.variations[variationIndex]
  if (!variation) return []

  return variation.arrangement.map((partId, partIndex) => {
    const part = song.parts.find(p => p.id === partId)
    return { part: part!, partIndex, partId }
  }).filter(item => item.part)
}

export function renderLiveColumn(): string {
  const song = state.liveSong
  const arrangementParts = song ? getArrangementParts(song, state.liveVariation) : []

  // Inline Styles
  const columnClass = "flex flex-col bg-bg-primary overflow-hidden min-w-0 min-w-[200px]" // cp-column cp-live
  // From headers.css: live-header-redesign horizontal-layout
  const headerClass = "flex flex-row items-center justify-between gap-0 p-0 h-12 min-h-[3rem] bg-bg-secondary border-b border-border-color shrink-0"
  const headerLeft = "flex items-center h-full px-2 gap-2 pl-2 text-danger" // header-section-left
  const headerCenter = "flex-1 flex justify-center h-full min-w-0 p-0 flex-col items-center" // header-section-center
  const headerRight = "flex items-center h-full px-0 gap-0" // header-section-right

  const liveBadge = "flex items-center gap-2 bg-transparent border-none p-0"
  const liveIcon = "w-[10px] h-[10px] flex items-center text-live-red"
  const liveText = "text-[0.85rem] font-extrabold text-live-red tracking-[1px]"

  const songTitleClass = "text-base font-bold text-text-primary leading-[1.1] m-0 p-0 text-center translate-y-[1px]"
  const arrNameClass = "text-xs font-medium text-text-muted whitespace-nowrap overflow-hidden text-ellipsis tracking-wide text-center pt-[1px]"

  const displayControlsClass = "flex w-auto gap-0 h-full justify-end" // display-controls big-buttons
  const displayBtnClass = "flex flex-col items-center justify-center text-[0.55rem] font-medium p-0 w-12 h-full bg-bg-tertiary border-none border-l border-border-color rounded-none text-text-secondary transition-all duration-200 relative z-10 hover:bg-bg-hover hover:text-text-primary hover:z-20 display-btn square"
  const activeDisplayBtnClass = "bg-accent-primary text-white border-l-accent-primary z-30 hover:bg-accent-primary hover:text-white"

  const columnBodyClass = "flex-1 overflow-y-auto p-2" // cp-column-body lyrics-scroll

  return `
    <div class="${columnClass} cp-live">
      <div class="${headerClass} live-header-redesign horizontal-layout">
        <div class="${headerLeft}">
            <div class="${liveBadge}">
                <span class="${liveIcon}">${ICONS.live || '🔴'}</span>
                <span class="${liveText}">LIVE</span>
            </div>
        </div>
        
        <div class="${headerCenter}">
            ${song ? `
                <span class="${songTitleClass}">${song.title}</span>
                <span class="${arrNameClass}">${song.variations[state.liveVariation]?.name || 'Default'}</span>
            ` : ''}
        </div>

        <div class="${headerRight}">
             <div class="${displayControlsClass}">
                <button class="${displayBtnClass} ${state.displayMode === 'logo' ? 'active ' + activeDisplayBtnClass : ''}" data-mode="logo" title="Logo">
                    <span class="mb-[2px] w-5 h-5 flex items-center justify-center">${ICONS.logo}</span>
                    <span>LOGO</span>
                </button>
                <button class="${displayBtnClass} ${state.displayMode === 'black' ? 'active ' + activeDisplayBtnClass : ''}" data-mode="black" title="Black">
                    <span class="mb-[2px] w-5 h-5 flex items-center justify-center">${ICONS.black}</span>
                    <span>BLACK</span>
                </button>
                <button class="${displayBtnClass} ${state.displayMode === 'clear' ? 'active ' + activeDisplayBtnClass : ''}" data-mode="clear" title="Clear">
                    <span class="mb-[2px] w-5 h-5 flex items-center justify-center">${ICONS.clear}</span>
                    <span>CLEAR</span>
                </button>
                <button class="${displayBtnClass} ${state.displayMode === 'lyrics' ? 'active ' + activeDisplayBtnClass : ''}" data-mode="lyrics" title="Show Lyrics">
                    <span class="mb-[2px] w-5 h-5 flex items-center justify-center">${ICONS.play}</span>
                    <span>LYRICS</span>
                </button>
             </div>
        </div>
      </div>
      <div class="${columnBodyClass}">
        ${song ? `
          <div class="flex flex-col gap-2 pb-8">
            ${arrangementParts.map(({ part, partIndex, partId }) => `
              <div class="lyrics-part" data-part-index="${partIndex}">
                <div class="text-[0.65rem] font-bold text-text-muted uppercase mb-1 flex items-center gap-2 part-${partId}">${part.label}</div>
                <div class="flex flex-col gap-[1px]">
                  ${part.slides.map((slideText, slideIndex) => {
    const isActive = state.livePosition.partIndex === partIndex &&
      state.livePosition.slideIndex === slideIndex

    // Slide Button Styles
    const slideBtnClass = "group relative flex items-start gap-4 w-full p-2 pl-3 bg-bg-tertiary border-l-[3px] border-transparent cursor-pointer transition-all duration-100 min-h-[48px] text-left hover:bg-bg-hover focus:outline-none"
    const slideBtnActiveClass = "bg-red-600/10 border-l-live-red active live"
    const numClass = "text-[0.7rem] font-bold text-text-muted mt-[0.15rem] w-3 flex justify-center group-hover:text-text-secondary"
    const textClass = "flex-1 text-sm leading-[1.4] text-text-secondary font-medium whitespace-pre-wrap group-hover:text-text-primary"
    const activeTextClass = "text-white"

    return `
                      <button class="${slideBtnClass} ${isActive ? slideBtnActiveClass : ''} slide-btn" 
                              data-part="${partIndex}" 
                              data-slide="${slideIndex}"
                              data-context="live">
                        <span class="${numClass} ${isActive ? 'text-live-red' : ''}">${slideIndex + 1}</span>
                        <span class="${textClass} ${isActive ? activeTextClass : ''} slide-text">${slideText.replace(/\n/g, '<br>')}</span>
                      </button>
                    `
  }).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="flex flex-col items-center justify-center h-full text-text-muted opacity-50 gap-4">
            <span class="w-12 h-12 text-text-muted opacity-30">${ICONS.live}</span>
            <p class="text-sm">Nothing live yet</p>
          </div>
        `}
      </div>
    </div>
  `
}

export function initLiveListeners(): void {
  // Live navigation
  document.getElementById('prev-live')?.addEventListener('click', prevSlide)
  document.getElementById('next-live')?.addEventListener('click', nextSlide)

  // Display mode buttons
  document.querySelectorAll('.display-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode') as DisplayMode
      // Toggle back to lyrics if clicking the active mode (for Logo/Black/Clear)
      if (state.displayMode === mode && ['logo', 'black', 'clear'].includes(mode)) {
        setDisplayMode('lyrics')
      } else {
        setDisplayMode(mode)
      }
    })
  })

  // Slide selection
  document.querySelectorAll('.cp-live .slide-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const partIndex = parseInt(btn.getAttribute('data-part') || '0')
      const slideIndex = parseInt(btn.getAttribute('data-slide') || '0')
      goLiveWithPosition({ partIndex, slideIndex })
    })
  })
}

export function updateLiveSlideSelection(scrollToActive = false): void {
  const liveButtons = document.querySelectorAll('.cp-live .slide-btn')
  const { livePosition } = state
  let activeBtn: Element | null = null

  liveButtons.forEach(btn => {
    const partIndex = parseInt(btn.getAttribute('data-part') || '0')
    const slideIndex = parseInt(btn.getAttribute('data-slide') || '0')

    const isActive = livePosition.partIndex === partIndex &&
      livePosition.slideIndex === slideIndex

    // Manually toggle classes for performance/purity
    // Removing 'active', 'live', 'bg-red-600/10', 'border-l-live-red', 'pl-[0.65rem]'
    // Adding active classes if true

    // We can rely on a helper or just toggle classList
    // Note: The original implementation used toggleClass from utils/dom
    // We should update the class lists here to match the inline styles we defined above

    const activeClasses = ['active', 'live', 'bg-red-600/10', 'border-l-live-red']

    // Text styling needs to be toggled too? 
    // Yes, the `slide-text` span has active styles.
    const textSpan = btn.querySelector('.slide-text')
    const numSpan = btn.querySelector('.slide-num')

    const activeTextClasses = ['text-white']
    const inactiveTextClasses = ['text-white', 'font-medium']
    // Note: inactiveTextClasses are present by default in HTML generation, so we just remove them when active? 
    // Actually in the HTML generation above: `textClass` has `text-text-secondary font-medium`.
    // IF active, we add `activeTextClass`.
    // BUT we must also remove the `text-text-secondary` to avoid conflict or ensure specificity.
    // Tailwind classes are just strings, specificity depends on order in generated CSS, but better to be explicit.

    if (isActive) {
      btn.classList.add(...activeClasses)
      textSpan?.classList.add(...activeTextClasses)
      textSpan?.classList.remove('text-text-secondary', 'font-medium')
      numSpan?.classList.add('text-live-red')
      activeBtn = btn
    } else {
      btn.classList.remove(...activeClasses)
      textSpan?.classList.remove(...activeTextClasses)
      textSpan?.classList.add('text-text-secondary', 'font-medium')
      numSpan?.classList.remove('text-live-red')
    }
  })

  // Scroll active slide into view only on Go Live (song change)
  if (scrollToActive && activeBtn) {
    requestAnimationFrame(() => {
      (activeBtn as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    })
  }
}

export function updateLiveNavButtons(): void {
  const { liveSong, liveVariation, livePosition } = state
  if (!liveSong) return

  const prevBtn = document.getElementById('prev-live') as HTMLButtonElement
  const nextBtn = document.getElementById('next-live') as HTMLButtonElement

  updateDisabled(prevBtn, !getPrevPosition(liveSong, liveVariation, livePosition))
  updateDisabled(nextBtn, !getNextPosition(liveSong, liveVariation, livePosition))
}

export function updateDisplayModeButtons(): void {
  const { displayMode } = state
  const buttons = document.querySelectorAll('.display-btn')
  const activeClass = 'bg-accent-primary text-white border-l-accent-primary z-30 hover:bg-accent-primary hover:text-white'.split(' ')

  buttons.forEach(btn => {
    const mode = btn.getAttribute('data-mode')
    if (mode === displayMode) {
      btn.classList.add('active', ...activeClass)
    } else {
      btn.classList.remove('active', ...activeClass)
    }
  })
}
