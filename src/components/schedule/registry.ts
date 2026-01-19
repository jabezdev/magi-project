/**
 * Schedule Registry - Maps media types to their schedule renderers
 */

import { MediaType } from '../../types'
import { ScheduleRenderer } from './types'

import { SongScheduleRenderer } from './renderers/song'
import { ScriptureScheduleRenderer } from './renderers/scripture'
import { VideoScheduleRenderer } from './renderers/video'
import { ImageScheduleRenderer } from './renderers/image'
import { PresentationScheduleRenderer } from './renderers/presentation'
import { AudioScheduleRenderer } from './renderers/audio'

const registry: Partial<Record<MediaType, ScheduleRenderer>> = {}

// Register default renderers
registry['song'] = SongScheduleRenderer
registry['scripture'] = ScriptureScheduleRenderer
registry['video'] = VideoScheduleRenderer
registry['image'] = ImageScheduleRenderer
registry['presentation'] = PresentationScheduleRenderer
registry['audio'] = AudioScheduleRenderer

export const ScheduleRendererRegistry = {
    register(type: MediaType, renderer: ScheduleRenderer) {
        registry[type] = renderer
    },
    get(type: MediaType): ScheduleRenderer | undefined {
        return registry[type]
    },
    getAll() {
        return registry
    }
}
