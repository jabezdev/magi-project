import { UtilityRendererRegistry } from './registry'
import { songUtilityRenderer } from './renderers/song'
import { mediaUtilityRenderer } from './renderers/media'
import { presentationUtilityRenderer } from './renderers/presentation'
import { genericUtilityRenderer } from './renderers/generic'

// Register Renderers
UtilityRendererRegistry.register('song', songUtilityRenderer)
UtilityRendererRegistry.register('scripture', songUtilityRenderer)
UtilityRendererRegistry.register('video', mediaUtilityRenderer)
UtilityRendererRegistry.register('image', mediaUtilityRenderer)
UtilityRendererRegistry.register('audio', mediaUtilityRenderer)
UtilityRendererRegistry.register('presentation', presentationUtilityRenderer)

export * from './types'
export * from './registry'
export { songUtilityRenderer, mediaUtilityRenderer, presentationUtilityRenderer, genericUtilityRenderer }
