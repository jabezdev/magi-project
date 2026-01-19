// Behaviors Module - Central Export
// This module provides media-type-specific rendering behaviors for Preview and Live panels.
// Each media type has its own subdirectory with:
//   - index.ts: Exports the MediaBehavior object
//   - preview.ts: Implements renderPreview function
//   - live.ts: Implements renderLive function

export { BehaviorRegistry } from './registry';
export type { MediaBehavior } from './types';

// Individual Behaviors (for direct access if needed)
export { SongBehavior } from './song';
export { ScriptureBehavior } from './scripture';
export { VideoBehavior } from './video';
export { ImageBehavior } from './image';
export { PresentationBehavior } from './presentation';
export { AudioBehavior } from './audio';
