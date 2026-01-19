import { MediaBehavior } from '../types';
import { renderSongPreview } from './preview';
import { renderSongLive } from './live';
import { renderSongOutput } from './output';
import { renderSongConfidence } from './confidence';
import { renderSongMobile } from './mobile';

export const SongBehavior: MediaBehavior = {
    renderPreview: renderSongPreview,
    renderLive: renderSongLive,
    renderOutput: renderSongOutput,
    renderConfidence: renderSongConfidence,
    renderMobile: renderSongMobile
};
