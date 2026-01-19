import { LibraryItem, GlobalSettings } from '../types';

export interface ConfidenceContext {
    currentContainer: HTMLElement
    nextContainer: HTMLElement
    prevContainer?: HTMLElement
    stripContainer?: HTMLElement
    infoContainer?: HTMLElement
    settings?: GlobalSettings
}

export interface MobileContext {
    container: HTMLElement
    settings?: GlobalSettings
}

export interface MediaBehavior {
    renderPreview(item: LibraryItem, container: HTMLElement, stripContainer?: HTMLElement): void;
    renderLive(item: LibraryItem, container: HTMLElement, stripContainer?: HTMLElement): void;
    renderOutput(item: LibraryItem, container: HTMLElement, slideIndex?: number): void;
    renderConfidence(item: LibraryItem, ctx: ConfidenceContext): void;
    renderMobile(item: LibraryItem, ctx: MobileContext): void;
}
