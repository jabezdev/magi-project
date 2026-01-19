/**
 * Library Registry - Maps media types to their renderers
 */

import { MediaType } from '../../types'
import { LibraryRenderer } from './types'

import { SongLibraryRenderer } from './renderers/song'
import { ScriptureLibraryRenderer } from './renderers/scripture'
import { VideoLibraryRenderer } from './renderers/video'
import { ImageLibraryRenderer } from './renderers/image'
import { PresentationLibraryRenderer } from './renderers/presentation'
import { AudioLibraryRenderer } from './renderers/audio'

const registry: Partial<Record<MediaType, LibraryRenderer>> = {}

// Register default renderers
registry['song'] = SongLibraryRenderer
registry['scripture'] = ScriptureLibraryRenderer
registry['video'] = VideoLibraryRenderer
registry['image'] = ImageLibraryRenderer
registry['presentation'] = PresentationLibraryRenderer
registry['audio'] = AudioLibraryRenderer

export const LibraryRendererRegistry = {
    register(type: MediaType, renderer: LibraryRenderer) {
        registry[type] = renderer
    },
    get(type: MediaType): LibraryRenderer | undefined {
        return registry[type]
    },
    getAll() {
        return registry
    }
}
