import { state } from '../../state'
import { ICONS } from '../../constants/icons'
import type { Song, SongPart, PartType } from '../../types'
import { getNextPosition, getPrevPosition } from '../../utils/slides'
import {
  selectPreviewVariation,
  selectPreviewPosition,
  prevPreviewSlide,
  nextPreviewSlide,
  goLive
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

export function renderPreviewColumn(): string {
  const item = state.previewItem
  const song = state.previewSong

  // Inline Tailwind Classes
  const columnClass = "flex flex-col bg-bg-primary overflow-hidden min-w-0 min-w-[200px] cp-preview"
  const headerClass = "flex flex-row items-center justify-between gap-0 p-0 h-12 min-h-[3rem] bg-bg-secondary border-b border-border-color shrink-0"
  const headerLeft = "flex items-center h-full px-2 gap-2 text-[#3b82f6]"
  const headerIconClass = "w-[14px] h-[14px] opacity-70 text-[#3b82f6]"
  const headerTitleClass = "text-xs font-semibold uppercase tracking-[0.5px] text-[#3b82f6]"
  const headerCenter = "flex-1 flex justify-center items-center h-full min-w-0 p-0 overflow-hidden px-2"
  const headerRight = "flex items-center h-full px-0 gap-0"

  const infoStackClass = "flex flex-col justify-center items-center gap-0 w-full h-full -mt-[2px]"
  const titleClass = "text-base font-bold text-text-primary leading-[1.1] m-0 p-0 block translate-y-[1px] text-center whitespace-nowrap overflow-hidden text-ellipsis w-full"
  const subTitleClass = "text-xs font-medium text-text-secondary opacity-90 text-center w-full whitespace-nowrap overflow-hidden text-ellipsis pt-[1px]"
  const variationSelectClass = "text-xs font-medium text-text-secondary opacity-90 text-center w-auto max-w-full bg-transparent border-none p-0 pt-[1px] m-0 h-auto cursor-pointer normal-case hover:text-text-primary hover:opacity-100"

  const goLiveBtnClass = "h-full w-auto rounded-none m-0 border-none border-l border-border-color bg-blue-500 text-white px-4 flex items-center gap-2 text-xs font-semibold hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-bg-tertiary disabled:text-text-muted transition-colors"

  const columnBodyClass = "flex-1 overflow-y-auto p-2"

  let headerContent = ''
  if (item) {
    if (item.type === 'song' && song) {
      headerContent = `
            <div class="${infoStackClass}">
                 <span class="${titleClass}">${song.title}</span>
                 <select class="${variationSelectClass}" id="preview-variation" style="text-align-last: center;">
                    ${song.variations.map((v, i) => `
                    <option value="${i}" ${i === state.previewVariation ? 'selected' : ''}>${v.name}</option>
                    `).join('')}
                 </select>
            </div>
         `
    } else {
      headerContent = `
            <div class="${infoStackClass}">
                 <span class="${titleClass}">${item.title}</span>
                 <span class="${subTitleClass}">${item.subtitle || item.type.toUpperCase()}</span>
            </div>
         `
    }
  } else {
    headerContent = '<span class="text-text-muted text-xs italic">Select item to preview</span>'
  }

  return `
    <div class="${columnClass}">
      <div class="${headerClass} preview-header-redesign horizontal-layout">
        <div class="${headerLeft}">
            <span class="${headerIconClass}">${ICONS.monitor}</span>
            <span class="${headerTitleClass}">PREVIEW</span>
        </div>
        <div class="${headerCenter}">
             ${headerContent}
        </div>
        <div class="${headerRight}">
             <button class="${goLiveBtnClass} go-live-btn sm flush-btn" id="go-live" ${!item ? 'disabled' : ''} style="border-left-width: 1px !important;">${ICONS.play} GO LIVE</button>
        </div>
      </div>
      <div class="${columnBodyClass}">
        ${renderPreviewContent()}
      </div>
    </div>
  `
}

function renderPreviewContent(): string {
  const item = state.previewItem
  const emptyStateClass = "flex flex-col items-center justify-center h-full text-text-muted opacity-50 gap-4"

  if (!item) {
    return `
          <div class="${emptyStateClass}">
            <span class="w-12 h-12 text-text-muted opacity-30">${ICONS.media}</span>
            <p class="text-sm">Select an item</p>
          </div>
        `
  }

  if (item.type === 'song') return renderSongPreview()
  if (item.type === 'video') return renderVideoPreview()
  if (item.type === 'image') return renderImagePreview()
  if (item.type === 'audio') return renderAudioPreview()

  return `
            <div class="${emptyStateClass}">
                <span class="w-16 h-16 opacity-20">${ICONS.file}</span>
                <p>Preview for ${item.type} not implemented</p>
            </div>
        `
}

function renderSongPreview(): string {
  const song = state.previewSong
  if (!song) return ''
  const arrangementParts = getArrangementParts(song, state.previewVariation)

  return `
        <div class="flex flex-col gap-2 pb-8">
        ${arrangementParts.map(({ part, partIndex, partId }) => `
            <div class="lyrics-part" data-part-index="${partIndex}">
            <div class="text-[0.65rem] font-bold text-text-muted uppercase mb-1 flex items-center gap-2 part-${partId}">${part.label}</div>
            <div class="flex flex-col gap-[1px]">
                ${part.slides.map((slideText, slideIndex) => {
    const isActive = 'partIndex' in state.previewPosition &&
      state.previewPosition.partIndex === partIndex &&
      state.previewPosition.slideIndex === slideIndex
    const isLive = state.liveSong?.id === song.id &&
      state.liveVariation === state.previewVariation &&
      'partIndex' in state.livePosition &&
      state.livePosition.partIndex === partIndex &&
      state.livePosition.slideIndex === slideIndex

    const slideBtnClass = "group relative flex items-start gap-4 w-full p-2 pl-3 bg-bg-tertiary border-l-[3px] border-transparent cursor-pointer transition-all duration-100 min-h-[48px] text-left hover:bg-bg-hover"
    const slideBtnActiveClass = "bg-indigo-500/10 border-l-accent-primary"
    const slideBtnLiveClass = "bg-red-600/10 border-l-live-red"
    const numClass = "text-[0.7rem] font-bold text-text-muted mt-[0.15rem] w-3 flex justify-center group-hover:text-text-secondary slide-num"
    const textClass = "flex-1 text-sm leading-[1.4] text-text-secondary font-medium whitespace-pre-wrap group-hover:text-text-primary slide-text"

    // Construct final classes dynamically
    let finalBtnClass = slideBtnClass
    if (isActive) finalBtnClass += ' active ' + slideBtnActiveClass
    if (isLive) finalBtnClass += ' live ' + slideBtnLiveClass
    finalBtnClass += ' slide-btn'

    return `
                    <button class="${finalBtnClass}" 
                            data-part="${partIndex}" 
                            data-slide="${slideIndex}"
                            data-context="preview">
                    <span class="${numClass} ${isActive ? 'text-accent-primary' : ''} ${isLive ? 'text-live-red' : ''}">${slideIndex + 1}</span>
                    <span class="${textClass} ${isActive || isLive ? 'text-text-primary' : ''}">${slideText.replace(/\n/g, '<br>')}</span>
                    </button>
                `
  }).join('')}
            </div>
            </div>
        `).join('')}
        </div>
    `
}

function renderVideoPreview(): string {
  const item = state.previewItem
  if (!item) return ''

  return `
         <div class="flex flex-col justify-start h-full gap-4 pt-4">
            <div class="relative w-full aspect-video bg-black rounded overflow-hidden shadow-sm border border-border-color/50">
                 ${item.thumbnail ? `<img src="${item.thumbnail}" class="w-full h-full object-contain"/>` : `<div class="w-full h-full flex items-center justify-center text-white/20">${ICONS.video}</div>`}
                 <div class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1 rounded">VIDEO</div>
            </div>
            <div class="px-2">
                <div class="text-sm font-medium text-text-primary">Preview</div>
                <div class="text-xs text-text-muted mt-1">
                    Ready to play directly to Main Output.
                </div>
            </div>
         </div>
    `
}

function renderImagePreview(): string {
  const item = state.previewItem
  if (!item) return ''
  return `
         <div class="flex flex-col justify-start h-full gap-4 pt-4">
            <div class="relative w-full aspect-video bg-black/5 rounded overflow-hidden shadow-sm border border-border-color/50 flex items-center justify-center">
                 ${item.thumbnail ? `<img src="${item.thumbnail}" class="max-w-full max-h-full object-contain"/>` : `<span class="text-4xl opacity-20">${ICONS.image}</span>`}
            </div>
            <div class="px-2">
                <div class="text-sm font-medium text-text-primary">Image Ready</div>
            </div>
         </div>
    `
}

function renderAudioPreview(): string {
  const item = state.previewItem
  if (!item) return ''
  return `
         <div class="flex flex-col justify-start h-full gap-4 pt-4 px-4">
            <div class="w-full aspect-square max-w-[200px] mx-auto bg-bg-tertiary rounded flex items-center justify-center border border-border-color/50">
                <div class="w-20 h-20 text-text-muted opacity-50 overflow-visible">
                    ${ICONS.sound}
                </div>
            </div>
            <div class="flex flex-col gap-2">
                <div class="text-lg font-bold text-text-primary text-center">${item.title}</div>
                <audio src="${item.url}" controls class="w-full"></audio>
            </div>
            <div class="text-xs text-text-muted text-center leading-tight">
                Preview audio locally.<br>Go Live to broadcast.
            </div>
         </div>
    `
}

export function initPreviewListeners(): void {
  // Go live button
  document.getElementById('go-live')?.addEventListener('click', goLive)

  // Preview navigation
  document.getElementById('prev-preview')?.addEventListener('click', prevPreviewSlide)
  document.getElementById('next-preview')?.addEventListener('click', nextPreviewSlide)

  // Variation select
  document.getElementById('preview-variation')?.addEventListener('change', (e) => {
    selectPreviewVariation(parseInt((e.target as HTMLSelectElement).value))
  })

  // Slide selection
  document.querySelectorAll('.cp-preview .slide-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const partIndex = parseInt(btn.getAttribute('data-part') || '0')
      const slideIndex = parseInt(btn.getAttribute('data-slide') || '0')
      selectPreviewPosition({ partIndex, slideIndex })
    })
  })
}

export function updatePreviewSlideSelection(): void {
  // Song only
  if (state.previewItem?.type !== 'song') return

  const previewButtons = document.querySelectorAll('.cp-preview .slide-btn')
  const { previewPosition, liveSong, previewSong, livePosition } = state

  // Classes to toggle
  const activeClasses = ['active', 'bg-indigo-500/10', 'border-l-accent-primary']
  const liveClasses = ['live', 'bg-red-600/10', 'border-l-live-red']

  previewButtons.forEach(btn => {
    const partIndex = parseInt(btn.getAttribute('data-part') || '0')
    const slideIndex = parseInt(btn.getAttribute('data-slide') || '0')

    // Careful with missing partIndex in SimplePosition if reused
    const isActive = 'partIndex' in previewPosition && previewPosition.partIndex === partIndex &&
      previewPosition.slideIndex === slideIndex

    // Check if THIS slide matches the LIVE slide
    const isLive = liveSong?.id === previewSong?.id &&
      state.liveVariation === state.previewVariation &&
      'partIndex' in livePosition &&
      livePosition.partIndex === partIndex &&
      livePosition.slideIndex === slideIndex

    const numSpan = btn.querySelector('.slide-num')
    const textSpan = btn.querySelector('.slide-text')

    if (isActive) {
      btn.classList.add(...activeClasses)
      numSpan?.classList.add('text-accent-primary')
      textSpan?.classList.add('text-text-primary')
    } else {
      btn.classList.remove(...activeClasses)
      numSpan?.classList.remove('text-accent-primary')
      if (!isLive) {
        textSpan?.classList.remove('text-text-primary')
      }
    }

    if (isLive) {
      btn.classList.add(...liveClasses)
      numSpan?.classList.add('text-live-red')
      textSpan?.classList.add('text-text-primary')
    } else {
      btn.classList.remove(...liveClasses)
      numSpan?.classList.remove('text-live-red')
    }
  })
}

export function updatePreviewNavButtons(): void {
  // Song only
  if (state.previewItem?.type !== 'song' || !state.previewSong) return

  const { previewSong, previewVariation, previewPosition } = state
  // Check if position is valid for song navigation
  if (!('partIndex' in previewPosition)) return

  const prevBtn = document.getElementById('prev-preview') as HTMLButtonElement
  const nextBtn = document.getElementById('next-preview') as HTMLButtonElement

  updateDisabled(prevBtn, !getPrevPosition(previewSong, previewVariation, previewPosition))
  updateDisabled(nextBtn, !getNextPosition(previewSong, previewVariation, previewPosition))
}
