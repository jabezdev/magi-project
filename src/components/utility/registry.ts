import { MediaType } from '../../types'
import { UtilityRenderer } from './types'

export class UtilityRendererRegistry {
    private static renderers = new Map<MediaType, UtilityRenderer>()

    static register(type: MediaType, renderer: UtilityRenderer) {
        this.renderers.set(type, renderer)
    }

    static get(type: MediaType): UtilityRenderer | undefined {
        return this.renderers.get(type)
    }
}
