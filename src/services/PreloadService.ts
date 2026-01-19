import { store } from '../state/store';
import { LibraryItem, ImageItem, SongItem } from '../types';

const LOOKAHEAD_COUNT = 5;

/**
 * PreloadService
 * Predictively loads assets for upcoming schedule items to ensure
 * zero-latency display on Mobile and Projection screens.
 */
class PreloadService {
    private cache: Set<string> = new Set();
    private loadedImages: HTMLImageElement[] = []; // Keep references to prevent GC

    constructor() {
        // Listen to state changes
        store.subscribe((state) => {
            if (state.live.item_id) {
                this.analyzeAndPreload(state.live.item_id);
            }
        });
    }

    private analyzeAndPreload(currentId: string) {
        const schedule = store.schedule;
        if (!schedule || schedule.length === 0) return;

        // Find current index
        const currentIndex = schedule.findIndex(i => i.library_item_id === currentId || i.id === currentId);
        if (currentIndex === -1) return;

        // Get upcoming items
        const upcoming = schedule.slice(currentIndex + 1, currentIndex + 1 + LOOKAHEAD_COUNT);

        upcoming.forEach(sItem => {
            // Resolve full library item
            const item = store.library.find(i => i.id === sItem.library_item_id);
            if (item) {
                this.preloadItem(item);
            }
        });
    }

    private preloadItem(item: LibraryItem) {
        // Strategy: Only preload what's heavy but cacheable (Images)
        // Video is streamed, so pre-loading full blobs is risky for memory. 
        // Browsers handle video buffering well enough usually.
        // We focus on Images which cause the "pop-in" effect.

        if (item.type === 'image') {
            const img = item as ImageItem;
            this.fetchImage(img.source_url);
        } else if (item.type === 'song') {
            const song = item as SongItem;
            if (song.default_background_id) {
                const bg = store.library.find(i => i.id === song.default_background_id);
                if (bg && bg.type === 'image') {
                    this.fetchImage((bg as ImageItem).source_url);
                }
                // If video, we might preload thumbnail? 
                // Video preload is heavy. Let's stick to images for mobile responsiveness.
            }
        }
    }

    private fetchImage(url: string) {
        if (!url || this.cache.has(url)) return;


        this.cache.add(url);

        const img = new Image();
        img.src = url;
        img.onload = () => {
            // Keep reference
            this.loadedImages.push(img);
            // Prune old references if too many?
            if (this.loadedImages.length > 50) {
                this.loadedImages.shift();
            }
        };
    }
}

export const preloadService = new PreloadService();
