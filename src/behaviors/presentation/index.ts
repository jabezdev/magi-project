import { MediaBehavior } from '../types';
import { renderPresentationPreview } from './preview';
import { renderPresentationLive } from './live';
import { PresentationItem } from '../../types';

import { renderPresentationOutput } from './output';
import { renderPresentationConfidence } from './confidence';
import { renderPresentationMobile } from './mobile';

export const PresentationBehavior: MediaBehavior = {
    renderPreview: (item, container, strip) => renderPresentationPreview(item as PresentationItem, container, strip),
    renderLive: (item, container, strip) => renderPresentationLive(item as PresentationItem, container, strip),
    renderOutput: (item, container, slideIndex) => renderPresentationOutput(item, container, slideIndex),
    renderConfidence: (item, ctx) => renderPresentationConfidence(item, ctx),
    renderMobile: (item, ctx) => renderPresentationMobile(item as PresentationItem, ctx)
};
