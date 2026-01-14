
import { ICONS } from '../../constants'
import { createSlideDeck, updateSlideDeck, uploadSlideImage, fetchLibrary } from '../../services/api'
import type { ProjectableItem } from '../../types'

interface Slide {
  id: string
  type: 'text' | 'image'
  content?: string // For text
  path?: string // For image
}

let currentSlides: Slide[] = []
let currentDeck: ProjectableItem | null = null
let currentName = ''

export async function openSlideDeckEditor(deckItem?: ProjectableItem, onClose?: () => void): Promise<void> {
  currentDeck = deckItem || null
  currentName = deckItem?.title || ''
  currentSlides = deckItem?.data?.slides ? JSON.parse(JSON.stringify(deckItem.data.slides)) : []

  // If new, prompt for name first? Or just have input field.
  // Let's render the modal.

  const modal = document.createElement('div')
  modal.className = 'modal-overlay'

  // Styles for list
  const listClass = "flex-1 overflow-y-auto min-h-0 bg-bg-tertiary border border-border-color rounded p-2 flex flex-col gap-2"
  const slideItemClass = "flex items-start gap-3 p-2 bg-bg-secondary border border-border-color rounded group relative"

  const renderSlides = () => {
    const container = modal.querySelector('#slide-list-container')
    if (!container) return

    if (currentSlides.length === 0) {
      container.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-text-muted text-sm opacity-60">
                    <span class="w-8 h-8 mb-2">${ICONS.slides}</span>
                    <p>No slides yet</p>
                </div>
            `
      return
    }

    container.innerHTML = currentSlides.map((slide, index) => `
            <div class="${slideItemClass}" draggable="true" data-index="${index}">
                <div class="text-xs font-bold text-text-muted mt-1 w-4">${index + 1}</div>
                <div class="flex-1 min-w-0">
                    ${slide.type === 'text'
        ? `<div class="text-sm text-text-primary whitespace-pre-wrap leading-tight">${slide.content}</div>`
        : `<div class="aspect-video bg-black rounded overflow-hidden relative">
                                <img src="${slide.path}" class="w-full h-full object-contain" />
                           </div>`
      }
                </div>
                <div class="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button class="w-6 h-6 flex items-center justify-center rounded bg-bg-hover hover:text-red-400 btn-delete-slide" data-index="${index}" title="Remove">${ICONS.close}</button>
                     ${index > 0 ? `<button class="w-6 h-6 flex items-center justify-center rounded bg-bg-hover hover:text-white btn-move-up" data-index="${index}" title="Move Up">↑</button>` : ''}
                     ${index < currentSlides.length - 1 ? `<button class="w-6 h-6 flex items-center justify-center rounded bg-bg-hover hover:text-white btn-move-down" data-index="${index}" title="Move Down">↓</button>` : ''}
                </div>
            </div>
        `).join('')

    // Attach listeners immediately after render
    container.querySelectorAll('.btn-delete-slide').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((btn as HTMLElement).getAttribute('data-index') || '0')
        currentSlides.splice(idx, 1)
        renderSlides()
      })
    })

    container.querySelectorAll('.btn-move-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((btn as HTMLElement).getAttribute('data-index') || '0')
        if (idx > 0) {
          const temp = currentSlides[idx]
          currentSlides[idx] = currentSlides[idx - 1]
          currentSlides[idx - 1] = temp
          renderSlides()
        }
      })
    })

    container.querySelectorAll('.btn-move-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((btn as HTMLElement).getAttribute('data-index') || '0')
        if (idx < currentSlides.length - 1) {
          const temp = currentSlides[idx]
          currentSlides[idx] = currentSlides[idx + 1]
          currentSlides[idx + 1] = temp
          renderSlides()
        }
      })
    })
  }

  modal.innerHTML = `
    <div class="bg-bg-primary border border-border-color rounded shadow-2xl w-[600px] h-[80vh] flex flex-col overflow-hidden animate-fade-in-up">
      <div class="px-4 py-3 bg-bg-secondary border-b border-border-color flex justify-between items-center shrink-0">
        <h2 class="text-sm font-bold text-text-primary flex items-center gap-2">
            <span class="text-accent-primary">${ICONS.slides}</span>
            ${currentDeck ? 'Edit Slide Deck' : 'New Slide Deck'}
        </h2>
        <button class="close-btn text-text-muted hover:text-text-primary">${ICONS.close}</button>
      </div>

      <div class="p-4 flex flex-col flex-1 min-h-0 gap-4">
        <!-- Name Input -->
        <div class="flex flex-col gap-1 shrink-0">
            <label class="text-xs font-bold text-text-muted uppercase">Deck Name</label>
            <input type="text" id="deck-name-input" class="w-full bg-bg-tertiary border border-border-color rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary" placeholder="Enter deck name..." value="${currentName}" ${currentDeck ? 'disabled' : ''} />
            ${currentDeck ? '<p class="text-[10px] text-text-muted">Rename via context menu (not yet impl) or recreate.</p>' : ''}
        </div>

         <!-- Toolbar -->
        <div class="flex items-center gap-2 shrink-0">
            <button id="btn-add-text" class="px-3 py-1.5 bg-bg-secondary border border-border-color rounded text-xs font-medium text-text-primary hover:bg-bg-hover flex items-center gap-2">
                <span class="w-3 h-3">${ICONS.file}</span> Add Text Slide
            </button>
            <button id="btn-add-image" class="px-3 py-1.5 bg-bg-secondary border border-border-color rounded text-xs font-medium text-text-primary hover:bg-bg-hover flex items-center gap-2">
                <span class="w-3 h-3">${ICONS.image}</span> Add Image Slide
            </button>
            <input type="file" id="slide-image-upload" accept="image/*" class="hidden" />
        </div>

        <!-- Slide List -->
        <div class="flex flex-col flex-1 min-h-0">
             <label class="text-xs font-bold text-text-muted uppercase mb-1">Slides</label>
             <div id="slide-list-container" class="${listClass}"></div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="px-4 py-3 bg-bg-secondary border-t border-border-color flex justify-end gap-2 shrink-0">
        <button class="close-btn px-4 py-1.5 text-sm bg-bg-tertiary border border-border-color rounded hover:bg-bg-hover text-text-secondary">Cancel</button>
        <button id="btn-save-deck" class="px-4 py-1.5 text-sm bg-accent-primary text-white rounded hover:brightness-110 font-medium">Save Deck</button>
      </div>
    </div>
    `

  document.body.appendChild(modal)
  renderSlides()

  // --- Listeners ---

  const close = () => {
    modal.remove()
    if (onClose) onClose()
  }
  modal.querySelectorAll('.close-btn').forEach(b => b.addEventListener('click', close))

  const nameInput = modal.querySelector('#deck-name-input') as HTMLInputElement
  nameInput?.addEventListener('input', (e) => currentName = (e.target as HTMLInputElement).value)

  // Add Text Slide
  modal.querySelector('#btn-add-text')?.addEventListener('click', () => {
    // Simple prompt for now, could be a better UI
    const text = prompt('Enter slide text:')
    if (text) {
      currentSlides.push({
        id: crypto.randomUUID(),
        type: 'text',
        content: text
      })
      renderSlides()
    }
  })

  // Add Image Slide
  const fileInput = modal.querySelector('#slide-image-upload') as HTMLInputElement
  modal.querySelector('#btn-add-image')?.addEventListener('click', () => fileInput.click())

  fileInput.addEventListener('change', async (e) => {
    const file = fileInput.files?.[0]
    if (!file) return

    // If we are editing an existing deck, we upload directly to its folder
    // If we are creating a NEW deck, we technically need a folder first. 
    // Strategy: If new, we might need to Create it first?
    // Or we upload to a temp location?
    // Let's force creation of deck if it doesn't exist yet to simplify upload logic.

    if (!currentName) {
      alert('Please enter a deck name first.')
      return
    }

    let deckName = currentName
    let type = 'local_slides'

    // If not saved yet, Create it now? 
    if (!currentDeck) {
      // Auto-create wrapper
      const res = await createSlideDeck(currentName, type)
      if (res?.success) {
        // Mock a currentDeck object
        currentDeck = {
          id: res.name, // using name as ID for now or whatever scanner returns
          title: res.name,
          type: 'slide',
          data: { slides: [] }
        } as any
        // Disable name input
        nameInput.disabled = true
      } else {
        alert('Failed to initialize deck for upload.')
        return
      }
    }

    // Now upload
    // We use the safe name from currentDeck if available, or currentName
    // Actually fetchLibrary might have normalized the ID/name.
    // Let's rely on currentName if we just created it.
    const safeName = currentDeck?.id || currentName

    const upRes = await uploadSlideImage(type, safeName, file)
    if (upRes?.success) {
      currentSlides.push({
        id: crypto.randomUUID(),
        type: 'image',
        path: `/slides/${type}/${safeName}/${upRes.file}`
      })
      renderSlides()
    } else {
      alert('Image upload failed')
    }

    fileInput.value = ''
  })

  // Save
  modal.querySelector('#btn-save-deck')?.addEventListener('click', async () => {
    if (!currentName) {
      alert('Please enter a name')
      return
    }

    // If new and not yet created (only text slides added maybe)
    if (!currentDeck) {
      const res = await createSlideDeck(currentName, 'local_slides')
      if (!res?.success) {
        alert('Failed to create deck (name might be taken)')
        return
      }
      // Now update content
      const upRes = await updateSlideDeck('local_slides', res.name, {
        title: currentName,
        slides: currentSlides
      })
      if (upRes?.success) {
        close()
        // Trigger global refresh?
        // The caller typically passes a callback or we rely on events
        // For now, UnifiedLibrary handles refresh on create_song action completion, 
        // but this is `create_slide_deck`.
        // We should probably broadcast or just let the user manually refresh.
        // But wait, the calling function in `UnifiedLibrary` handles refresh if passed?
        // `openSlideDeckEditor` signatures in `UnifiedLibrary` didn't pass callback. 
        // We should trigger a library refresh here or return promise.
        // Re-fetch library:
        await fetchLibrary()
        // HACK: Force UI update if possible, or reload page.
        // Ideally we emit an event.
        window.location.reload() // Simple brute force for prototype
      }
    } else {
      // Update existing
      // Assuming type is 'local_slides' for now.
      // Check deck structure.
      // If the ID is the directory name.
      const type = 'local_slides' // TODO: Infer from item
      const name = currentDeck.id // The ID in library scan is usually the folder name

      const res = await updateSlideDeck(type, name, {
        slides: currentSlides,
        title: currentName
      })

      if (res?.success) {
        close()
        window.location.reload()
      } else {
        alert('Failed to save')
      }
    }
  })
}

function attachSlideListeners(modal: Element) {
  modal.querySelectorAll('.btn-delete-slide').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt((btn as HTMLElement).getAttribute('data-index') || '0')
      currentSlides.splice(idx, 1)
      const container = modal.querySelector('#slide-list-container')
      if (container) {
        // Re-render
        // We can just re-call renderSlides if we had access, or hack it
        // Since renderSlides is scoped, we need to extract it or re-render manually.
        // Let's just remove the element and update array? No, indices shift.
        // Need full re-render.
        // Quick fix: trigger click on a hidden button? 
        // Better: separate render function outside or attach it to modal object? 
        // I will move renderSlides to be accessible or just re-implement innerHTML update here?
        // Recursion?
        // I'll make renderSlides a var inside openSlideDeckEditor that I can call.

        // Ah, I can't easily call `renderSlides` here because it's inside the main function scope 
        // and this listener is outside (if I move it).
        // But currently `attachSlideListeners` is OUTSIDE.

        // I should move `attachSlideListeners` INSIDE `openSlideDeckEditor` to access `renderSlides`.
      }
    })
  })
}
