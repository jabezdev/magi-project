import { MediaBehavior } from '../types';
import { renderVideoPreview } from './preview';
import { renderVideoLive } from './live';
import { VideoItem } from '../../types';

import { renderVideoOutput } from './output';
import { renderVideoConfidence } from './confidence';
import { renderVideoMobile } from './mobile';

export const VideoBehavior: MediaBehavior = {
    renderPreview: (item, container, strip) => renderVideoPreview(item as VideoItem, container, strip),
    renderLive: (item, container, strip) => renderVideoLive(item as VideoItem, container, strip),
    renderOutput: (item, container, _slideIndex) => renderVideoOutput(item, container),
    renderConfidence: (item, ctx) => renderVideoConfidence(item, ctx),
    renderMobile: (item, ctx) => renderVideoMobile(item, ctx)
};
