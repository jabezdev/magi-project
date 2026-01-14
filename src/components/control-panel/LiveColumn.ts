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
  const item = state.liveItem

  // Inline Styles
  const columnClass = "flex flex-col bg-bg-primary overflow-hidden min-w-0 min-w-[200px]"
  const headerClass = "flex flex-row items-center justify-between gap-0 p-0 h-12 min-h-[3rem] bg-bg-secondary border-b border-border-color shrink-0"
  const headerLeft = "flex items-center h-full px-2 gap-2 pl-2 text-danger"
  const headerCenter = "flex-1 flex justify-center h-full min-w-0 p-0 flex-col items-center overflow-hidden px-2"
  const headerRight = "flex items-center h-full px-0 gap-0"

  const liveBadge = "flex items-center gap-2 bg-transparent border-none p-0"
  const liveIcon = "w-[10px] h-[10px] flex items-center text-live-red"
  const liveText = "text-[0.85rem] font-extrabold text-live-red tracking-[1px]"

  const titleClass = "text-base font-bold text-text-primary leading-[1.1] m-0 p-0 text-center translate-y-[1px] whitespace-nowrap overflow-hidden text-ellipsis w-full"
  const subTitleClass = "text-xs font-medium text-text-muted whitespace-nowrap overflow-hidden text-ellipsis tracking-wide text-center pt-[1px] w-full"

  const displayControlsClass = "flex w-auto gap-0 h-full justify-end"
  const displayBtnClass = "flex flex-col items-center justify-center text-[0.55rem] font-medium p-0 w-12 h-full bg-bg-tertiary border-none border-l border-border-color rounded-none text-text-secondary transition-all duration-200 relative z-10 hover:bg-bg-hover hover:text-text-primary hover:z-20 display-btn square"
  const activeDisplayBtnClass = "bg-accent-primary text-white border-l-accent-primary z-30 hover:bg-accent-primary hover:text-white"

  const columnBodyClass = "flex-1 overflow-y-auto p-2"

  // Header Content
  let headerTitle = ''
  let headerSubtitle = ''
  if (item) {
    headerTitle = item.title
    if (item.type === 'song' && state.liveSong) {
      headerSubtitle = state.liveSong.variations[state.liveVariation]?.name || 'Default'
    } else {
      headerSubtitle = item.subtitle || item.type.toUpperCase()
    }
  }

  return `
    <div class="${columnClass} cp-live">
      <div class="${headerClass} live-header-redesign horizontal-layout">
        <div class="${headerLeft}">
            <div class="${liveBadge}">
                <span class="${liveIcon}">${ICONS.live}</span>
                <span class="${liveText}">LIVE</span>
            </div>
        </div>
        
        <div class="${headerCenter}">
            ${item ? `
                <span class="${titleClass}">${headerTitle}</span>
                <span class="${subTitleClass}">${headerSubtitle}</span>
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
                <button class="${displayBtnClass} ${state.displayMode === 'lyrics' ? 'active ' + activeDisplayBtnClass : ''}" data-mode="lyrics" title="Show Content">
                    <span class="mb-[2px] w-5 h-5 flex items-center justify-center">${ICONS.play}</span>
                    <span>SHOW</span>
                </button>
             </div>
        </div>
      </div>
      <div class="${columnBodyClass}">
        ${renderLiveContent()}
      </div>
    </div>
  `
}

function renderLiveContent(): string {
  const item = state.liveItem
  if (!item) {
    return `
          <div class="flex flex-col items-center justify-center h-full text-text-muted opacity-50 gap-4">
            <span class="w-12 h-12 text-text-muted opacity-30">${ICONS.live}</span>
            <p class="text-sm">Nothing live</p>
          </div>
        `
  }

  if (item.type === 'song') return renderSongLive()
  if (item.type === 'video') return renderVideoLive()
  if (item.type === 'image') return renderImageLive()
  if (item.type === 'audio') return renderAudioLive()
  // Presentation/Slides handled same as Generic/Slides for now if structure allows
  // Scripture might have slides
  return `
            <div class="flex flex-col items-center justify-center h-full text-text-muted gap-4">
                <span class="w-16 h-16 opacity-20">${ICONS.file}</span>
                <p>Preview not available for ${item.type}</p>
            </div>
        `
}

function renderSongLive(): string {
  const song = state.liveSong
  if (!song) return '' // Should handle error state?

  const arrangementParts = getArrangementParts(song, state.liveVariation)

  return `
    <div class="flex flex-col gap-2 pb-8">
    ${arrangementParts.map(({ part, partIndex, partId }) => `
        <div class="lyrics-part" data-part-index="${partIndex}">
        <div class="text-[0.65rem] font-bold text-text-muted uppercase mb-1 flex items-center gap-2 part-${partId}">${part.label}</div>
        <div class="flex flex-col gap-[1px]">
            ${part.slides.map((slideText, slideIndex) => {
    const isActive = 'partIndex' in state.livePosition &&
      state.livePosition.partIndex === partIndex &&
      state.livePosition.slideIndex === slideIndex

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
                    <span class="slide-num ${numClass} ${isActive ? 'text-live-red' : ''}">${slideIndex + 1}</span>
                    <span class="${textClass} ${isActive ? activeTextClass : ''} slide-text">${slideText.replace(/\n/g, '<br>')}</span>
                </button>
                `
  }).join('')}
        </div>
        </div>
    `).join('')}
    </div>
  `
}

function renderVideoLive(): string {
  const item = state.liveItem
  if (!item || item.type !== 'video') return ''

  // Show thumbnail and playback status?
  // Since this is generic video, we might not have 'slides' unless it's a Canva slide.
  // If it has 'isCanvaSlide' setting:
  if (item.settings?.isCanvaSlide) {
    // Render simple placeholder or custom controls?
    // For now:
    return `<div class="p-4 text-center">Video Slide Active</div>`
  }

  // Standard Video
  return `
        <div class="flex flex-col items-center justify-center h-full gap-4">
            <div class="relative w-full aspect-video bg-black rounded overflow-hidden">
                 ${item.thumbnail ? `<img src="${item.thumbnail}" class="w-full h-full object-contain"/>` : `<div class="w-full h-full flex items-center justify-center text-white/20">${ICONS.video}</div>`}
                 <div class="absolute inset-0 flex items-center justify-center">
                    <div class="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur text-white">
                        ${state.liveMediaState.isPlaying ? ICONS.play : 'II'}
                    </div>
                 </div>
            </div>
            <div class="text-sm text-text-muted">
                ${state.liveMediaState.isPlaying ? 'Playing' : 'Paused'}
            </div>
        </div>
    `
}

function renderImageLive(): string {
  const item = state.liveItem
  if (!item) return ''
  return `
        <div class="flex flex-col items-center justify-center h-full p-4">
             <div class="relative w-full h-full max-h-[300px] flex items-center justify-center">
                 ${item.thumbnail ? `<img src="${item.thumbnail}" class="max-w-full max-h-full object-contain rounded shadow-lg"/>` : `<span class="text-4xl opacity-20">${ICONS.image}</span>`}
             </div>
        </div>
    `
}

function renderAudioLive(): string {
  const item = state.liveItem
  if (!item || item.type !== 'audio') return ''

  return `
        <div class="flex flex-col items-center justify-center h-full gap-4 p-4">
             <div class="w-24 h-24 rounded-full bg-bg-tertiary flex items-center justify-center border border-border-color shadow-lg relative overflow-hidden">
                  <div class="absolute inset-0 bg-accent-primary/10 animate-pulse"></div>
                  <div class="relative w-12 h-12 text-accent-primary">
                       ${ICONS.sound}
                  </div>
             </div>
             <div class="flex flex-col items-center gap-1">
                 <div class="text-xl font-bold text-text-primary text-center">${item.title}</div>
                 <div class="text-sm font-medium text-live-red animate-pulse flex items-center gap-1">
                     ${ICONS.live} NOW PLAYING
                 </div>
             </div>
             
             <!-- Playback Controls (Synced via liveMediaState) -->
             <div class="flex items-center gap-4 mt-2">
                 <div class="flex items-center justify-center w-10 h-10 rounded-full bg-bg-tertiary text-text-primary font-bold">
                    ${state.liveMediaState.isPlaying ? ICONS.play : '||'}
                 </div>
                 <div class="text-xs text-text-muted">
                    ${state.liveMediaState.isPlaying ? 'Broadcasting Audio' : 'Paused'}
                 </div>
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
      // Toggle back to lyrics (MEDIA) if clicking the active mode
      if (state.displayMode === mode && ['logo', 'black', 'clear'].includes(mode)) {
        setDisplayMode('lyrics')
      } else {
        setDisplayMode(mode)
      }
    })
  })

  // Slide selection (Song only for now)
  document.querySelectorAll('.cp-live .slide-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const partIndex = parseInt(btn.getAttribute('data-part') || '0')
      const slideIndex = parseInt(btn.getAttribute('data-slide') || '0')
      goLiveWithPosition({ partIndex, slideIndex })
    })
  })
}

export function updateLiveSlideSelection(scrollToActive = false): void {
  // Only relevant for songs primarily
  if (state.liveItem?.type !== 'song') return

  const liveButtons = document.querySelectorAll('.cp-live .slide-btn')
  const { livePosition } = state
  let activeBtn: Element | null = null

  liveButtons.forEach(btn => {
    const partIndex = parseInt(btn.getAttribute('data-part') || '0')
    const slideIndex = parseInt(btn.getAttribute('data-slide') || '0')

    // Careful with direct type comparison if `partIndex` is missing in SimplePosition
    const isActive = 'partIndex' in livePosition && livePosition.partIndex === partIndex &&
      livePosition.slideIndex === slideIndex

    const activeClasses = ['active', 'live', 'bg-red-600/10', 'border-l-live-red']
    const textSpan = btn.querySelector('.slide-text')
    const numSpan = btn.querySelector('.slide-num')
    const activeTextClasses = ['text-white']

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
  // Only for songs currently
  if (state.liveItem?.type !== 'song' || !state.liveSong) return

  // For other types like Presentation, we might want nav buttons? 
  // Should check if it supports next/prev.

  const { liveSong, liveVariation, livePosition } = state
  if (!liveSong) return

  const prevBtn = document.getElementById('prev-live') as HTMLButtonElement
  const nextBtn = document.getElementById('next-live') as HTMLButtonElement

  if (prevBtn && nextBtn) {
    // Need safe casting for SlidePosition
    if ('partIndex' in livePosition) {
      updateDisabled(prevBtn, !getPrevPosition(liveSong, liveVariation, livePosition))
      updateDisabled(nextBtn, !getNextPosition(liveSong, liveVariation, livePosition))
    }
  }
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
