import { MediaBehavior } from './types';
import { MediaType } from '../types';
import { SongBehavior } from './song';
import { ScriptureBehavior } from './scripture';
import { VideoBehavior } from './video';
import { ImageBehavior } from './image';
import { PresentationBehavior } from './presentation';
import { AudioBehavior } from './audio';

const registry: Partial<Record<MediaType, MediaBehavior>> = {};

// Register Default Behaviors
registry['song'] = SongBehavior;
registry['scripture'] = ScriptureBehavior;
registry['video'] = VideoBehavior;
registry['image'] = ImageBehavior;
registry['presentation'] = PresentationBehavior;
registry['audio'] = AudioBehavior;

export const BehaviorRegistry = {
    register: (type: MediaType, behavior: MediaBehavior) => {
        registry[type] = behavior;
    },
    get: (type: MediaType): MediaBehavior | undefined => {
        return registry[type];
    },
    getAll: () => registry
};
