import { state } from '../../state'
import { ICONS } from '../../constants/icons'
import {
  selectPreviewVariation,
  selectPreviewPosition,
  prevPreviewSlide,
  nextPreviewSlide,
  goLive
} from '../../actions/controlPanel'
import { updateDisabled } from '../../utils/dom'
import { getNextSlideIndex, getPrevSlideIndex } from '../../utils/content'
import type { ContentSlide } from '../../types'

export function renderPreviewColumn(): string {
  const item = state.previewItem

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
    if (item.type === 'song') {
      const songSummary = state.songs.find(s => s.id === item.songId)
      const variations = songSummary?.variations || []

      headerContent = `
            <div class="${infoStackClass}">
                 <span class="${titleClass}">${item.title}</span>
                 <select class="${variationSelectClass}" id="preview-variation" style="text-align-last: center;">
                    ${variations.map((v: any, i: number) => `
                    <option value="${i}" ${i === item.variationId ? 'selected' : ''}>${v.name}</option>
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

  // Mandatory hydration check - all items MUST have content slides now
  if (state.previewContent.length > 0) {
    return renderUnifiedContent()
  }

  return `
            <div class="${emptyStateClass}">
                <span class="w-16 h-16 opacity-20">${ICONS.file}</span>
                <p>Loading preview...</p>
            </div>
        `
}

/**
 * Unified content rendering - renders any type using ContentSlide[]
 */
function renderUnifiedContent(): string {
  const content = state.previewContent
  const currentPosition = state.previewPosition
  const item = state.previewItem

  if (content.length === 0) {
    return `<div class="p-4 text-center text-text-muted">No content</div>`
  }

  // Group by partId if present (songs)
  const hasGroups = content.some((s: ContentSlide) => s.partId)

  // Specific media type overrides for single-slide items within the grid
  if (content.length === 1 && item) {
    if (item.type === 'video') return renderVideoPreview()
    if (item.type === 'image') return renderImagePreview()
    if (item.type === 'audio') return renderAudioPreview()
  }

  if (hasGroups) {
    return renderGroupedContent(content, currentPosition)
  } else {
    return renderFlatContent(content, currentPosition)
  }
}

function renderGroupedContent(content: ContentSlide[], currentPosition: number): string {
  const groups: Map<string, { label: string, slides: ContentSlide[] }> = new Map()

  for (const slide of content) {
    const key = slide.partId || '_default'
    if (!groups.has(key)) {
      groups.set(key, { label: slide.label || key, slides: [] })
    }
    groups.get(key)!.slides.push(slide)
  }

  // Check if preview item matches live item to show "live" highlights
  const isSelectedLive = state.liveItem && state.previewItem && (
    (state.liveItem.type === 'song' && state.previewItem.type === 'song' && (state.liveItem as any).songId === (state.previewItem as any).songId) ||
    state.liveItem.id === state.previewItem.id
  )

  return `
    <div class="flex flex-col gap-2 pb-8">
    ${Array.from(groups.entries()).map(([partId, group]) => `
        <div class="lyrics-part" data-part-id="${partId}">
        <div class="text-[0.65rem] font-bold text-text-muted uppercase mb-1 flex items-center gap-2 part-${partId}">${group.label}</div>
        <div class="flex flex-col gap-[1px]">
            ${group.slides.map(slide => {
    const isActive = slide.index === currentPosition
    const isLive = isSelectedLive && slide.index === state.livePosition

    const slideBtnClass = "group relative flex items-start gap-4 w-full p-2 pl-3 bg-bg-tertiary border-l-[3px] border-transparent cursor-pointer transition-all duration-100 min-h-[48px] text-left hover:bg-bg-hover focus:outline-none"
    const slideBtnActiveClass = "bg-indigo-500/10 border-l-accent-primary active"
    const slideBtnLiveClass = "bg-red-600/10 border-l-live-red live"
    const numClass = "text-[0.7rem] font-bold text-text-muted mt-[0.15rem] w-3 flex justify-center group-hover:text-text-secondary"
    const textClass = "flex-1 text-sm leading-[1.4] text-text-secondary font-medium whitespace-pre-wrap group-hover:text-text-primary"

    let finalClass = slideBtnClass
    if (isActive) finalClass += ` ${slideBtnActiveClass}`
    if (isLive) finalClass += ` ${slideBtnLiveClass}`

    return `
                <button class="${finalClass} slide-btn" 
                        data-index="${slide.index}"
                        data-context="preview">
                    <span class="slide-num ${numClass} ${isActive ? 'text-accent-primary' : ''} ${isLive ? 'text-live-red' : ''}">${slide.index + 1}</span>
                    <span class="${textClass} ${isActive || isLive ? 'text-text-primary' : ''} slide-text">${slide.content.replace(/\n/g, '<br>')}</span>
                </button>
              `
  }).join('')}
        </div>
        </div>
    `).join('')}
    </div>
  `
}

function renderFlatContent(content: ContentSlide[], currentPosition: number): string {
  const isSelectedLive = state.liveItem && state.previewItem && state.liveItem.id === state.previewItem.id

  return `
    <div class="flex flex-col gap-2 p-2 pb-8">
        ${content.map(slide => {
    const isActive = slide.index === currentPosition
    const isLive = isSelectedLive && slide.index === state.livePosition

    const thumbHTML = slide.type === 'image'
      ? `<div class="w-10 h-8 bg-black rounded overflow-hidden shrink-0"><img src="${slide.content}" class="w-full h-full object-cover"></div>`
      : `<div class="w-10 h-8 bg-bg-tertiary rounded flex items-center justify-center shrink-0 border border-border-color text-[8px] text-text-muted">TXT</div>`

    const displayContent = slide.type === 'image'
      ? (slide.content.split('/').pop() || 'Image')
      : slide.content

    return `
                <button class="w-full flex items-center gap-3 p-2 text-left bg-bg-tertiary border border-border-color rounded hover:bg-bg-hover transition-colors slide-btn ${isActive ? 'active bg-indigo-500/10 border-accent-primary' : ''} ${isLive ? 'live bg-red-600/10 border-live-red' : ''}"
                        data-index="${slide.index}">
                    <div class="text-[0.65rem] font-bold text-text-muted w-4 text-center ${isActive ? 'text-accent-primary' : ''} ${isLive ? 'text-live-red' : ''} slide-num">${slide.index + 1}</div>
                    ${thumbHTML}
                    <div class="flex-1 min-w-0 text-sm truncate ${isActive || isLive ? 'text-white font-medium' : 'text-text-secondary'}">
                        ${displayContent}
                    </div>
                </button>
            `
  }).join('')}
    </div>
  `
}

function renderVideoPreview(): string {
  const item = state.previewItem as any
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
  const item = state.previewItem as any
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
  const item = state.previewItem as any
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

  // Slide selection (Unified index)
  document.querySelectorAll('.cp-preview .slide-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-index') || '0')
      selectPreviewPosition(index)
    })
  })
}

export function updatePreviewSlideSelection(): void {
  const previewButtons = document.querySelectorAll('.cp-preview .slide-btn')
  const { previewPosition, livePosition } = state

  // Check if preview item matches live item to show "live" highlights
  const isSelectedLive = state.liveItem && state.previewItem && (
    (state.liveItem.type === 'song' && state.previewItem.type === 'song' && (state.liveItem as any).songId === (state.previewItem as any).songId) ||
    state.liveItem.id === state.previewItem.id
  )

  // Classes to toggle
  const activeClasses = ['active', 'bg-indigo-500/10', 'border-l-accent-primary']
  const liveClasses = ['live', 'bg-red-600/10', 'border-l-live-red']

  previewButtons.forEach(btn => {
    const index = parseInt(btn.getAttribute('data-index') || '0')
    const isActive = index === previewPosition
    const isLive = isSelectedLive && index === livePosition

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
  const content = state.previewContent
  if (content.length === 0) return

  const prevBtn = document.getElementById('prev-preview') as HTMLButtonElement
  const nextBtn = document.getElementById('next-preview') as HTMLButtonElement

  updateDisabled(prevBtn, getPrevSlideIndex(content, state.previewPosition) === null)
  updateDisabled(nextBtn, getNextSlideIndex(content, state.previewPosition) === null)
}
