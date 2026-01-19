import { MediaBehavior } from '../types';
import { renderScripturePreview } from './preview';
import { renderScriptureLive } from './live';
import { ScriptureItem } from '../../types';

import { renderScriptureOutput } from './output';
import { renderScriptureConfidence } from './confidence';
import { renderScriptureMobile } from './mobile';

export const ScriptureBehavior: MediaBehavior = {
    renderPreview: (item, container, strip) => renderScripturePreview(item as ScriptureItem, container, strip),
    renderLive: (item, container, strip) => renderScriptureLive(item as ScriptureItem, container, strip),
    renderOutput: (item, container, _slideIndex) => renderScriptureOutput(item, container),
    renderConfidence: (item, ctx) => renderScriptureConfidence(item as ScriptureItem, ctx),
    renderMobile: (item, ctx) => renderScriptureMobile(item as ScriptureItem, ctx)
};
