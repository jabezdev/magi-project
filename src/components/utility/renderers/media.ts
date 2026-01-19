import { UtilityRenderer, UtilityRendererContext } from '../types'
import { LibraryItem } from '../../../types'

class MediaUtilityRenderer implements UtilityRenderer {
    render(container: HTMLElement, item: LibraryItem, ctx: UtilityRendererContext) {
        const isLive = ctx.context === 'live'
        // Type assertion for duration if it exists (Video/Audio)
        const duration = (item as any).duration_total || (item as any).duration
            ? this.formatTime((item as any).duration_total || (item as any).duration)
            : '00:00'

        container.innerHTML = `
            <div class="panel-header flex items-center justify-between px-4 bg-gray-800 border-b border-gray-700 h-9 shrink-0 gap-2">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">${item.type} Controls</span>
                <span class="text-xs text-gray-500 font-mono">${duration}</span>
            </div>
            
            <div class="flex-1 flex flex-col p-4 items-center justify-center gap-4">
                <!-- Transport -->
                <div class="flex items-center gap-4">
                     ${isLive ? `
                        <button class="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-lg">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                        <button class="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"/></svg>
                        </button>
                     ` : `
                        <button class="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                        <button class="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white">
                             <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        </button>
                     `}
                </div>

                <!-- Scrubber -->
                <div class="w-full flex flex-col gap-1">
                    <div class="flex justify-between text-[10px] text-gray-400 font-mono">
                        <span>00:00</span>
                        <span>-00:00</span>
                    </div>
                    <div class="w-full h-1 bg-gray-700 rounded overflow-hidden relative">
                        <div class="absolute top-0 left-0 h-full bg-gray-400 w-0"></div> <!-- Progress -->
                    </div>
                </div>

                <div class="text-[10px] text-gray-500">
                    ID: ${item.id}
                </div>
            </div>
        `
    }

    private formatTime(seconds: number): string {
        const m = Math.floor(seconds / 60)
        const s = Math.floor(seconds % 60)
        return `${m}:${s.toString().padStart(2, '0')}`
    }
}

export const mediaUtilityRenderer = new MediaUtilityRenderer()
