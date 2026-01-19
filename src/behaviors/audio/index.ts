import { MediaBehavior } from '../types';
import { renderAudioPreview } from './preview';
import { renderAudioLive } from './live';
import { AudioItem } from '../../types';

import { renderAudioOutput } from './output';
import { renderAudioConfidence } from './confidence';
import { renderAudioMobile } from './mobile';

export const AudioBehavior: MediaBehavior = {
    renderPreview: (item, container, strip) => renderAudioPreview(item as AudioItem, container, strip),
    renderLive: (item, container, strip) => renderAudioLive(item as AudioItem, container, strip),
    renderOutput: (item, container, _slideIndex) => renderAudioOutput(item, container),
    renderConfidence: (item, ctx) => renderAudioConfidence(item, ctx),
    renderMobile: (item, ctx) => renderAudioMobile(item, ctx)
};
