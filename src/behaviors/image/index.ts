import { MediaBehavior } from '../types';
import { renderImagePreview } from './preview';
import { renderImageLive } from './live';
import { ImageItem } from '../../types';

import { renderImageOutput } from './output';
import { renderImageConfidence } from './confidence';
import { renderImageMobile } from './mobile';

export const ImageBehavior: MediaBehavior = {
    renderPreview: (item, container, strip) => renderImagePreview(item as ImageItem, container, strip),
    renderLive: (item, container, strip) => renderImageLive(item as ImageItem, container, strip),
    renderOutput: (item, container, _slideIndex) => renderImageOutput(item, container),
    renderConfidence: (item, ctx) => renderImageConfidence(item, ctx),
    renderMobile: (item, ctx) => renderImageMobile(item, ctx)
};
