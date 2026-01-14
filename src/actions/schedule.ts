
import { state, updateState, getSavedCurrentSchedule } from '../state'
import { saveSchedule } from '../services/api'
import type { Schedule, ScheduleItem } from '../types'

/**
 * Add a generic item to the schedule
 */
export async function addItemToSchedule(item: ScheduleItem): Promise<void> {
    const currentSchedule = state.schedule
    const scheduleName = getSavedCurrentSchedule()
    const newItems = [...currentSchedule.items, item]

    const newSchedule: Schedule = {
        ...currentSchedule,
        items: newItems
    }

    try {
        updateState({ schedule: newSchedule })
        await saveSchedule(newSchedule, scheduleName)
        // Dispatch event for UI auto-scroll
        window.dispatchEvent(new CustomEvent('schedule-item-added'))
    } catch (e) {
        console.error('Failed to add to schedule', e)
    }
}

/**
 * Helper: Add a song to the schedule
 */
export async function addSongToSchedule(songId: number, variationId: number | string = 'default'): Promise<void> {
    const song = state.songs.find(s => s.id === songId)
    // Resolve variation ID
    let resolvedVariationId: number = 0
    if (typeof variationId === 'number') {
        resolvedVariationId = variationId
    } else {
        // Default to first variation or find one named 'Default' 
        // For now, if string 'default' or unknown, use 0 or the first one available
        if (song?.variations && song.variations.length > 0) {
            resolvedVariationId = song.variations[0].id
        } else {
            resolvedVariationId = 0
        }
    }

    await addItemToSchedule({
        id: crypto.randomUUID(), // Generate unique ID for the schedule item itself
        type: 'song',
        title: song ? song.title : 'Song',
        subtitle: song?.artist,
        songId,
        variationId: resolvedVariationId
    })
}

/**
 * Remove a song from the schedule by index
 */
export async function removeFromSchedule(index: number): Promise<void> {
    const currentSchedule = state.schedule
    const scheduleName = getSavedCurrentSchedule()
    if (index < 0 || index >= currentSchedule.items.length) return

    const newItems = [...currentSchedule.items]
    newItems.splice(index, 1)

    const newSchedule: Schedule = {
        ...currentSchedule,
        items: newItems
    }

    try {
        updateState({ schedule: newSchedule })
        await saveSchedule(newSchedule, scheduleName)
    } catch (e) {
        console.error('Failed to remove from schedule', e)
    }
}

/**
 * Update a schedule item (e.g. change variation)
 */
export async function updateScheduleItem(index: number, updates: Partial<ScheduleItem>): Promise<void> {
    const currentSchedule = state.schedule
    const scheduleName = getSavedCurrentSchedule()
    if (index < 0 || index >= currentSchedule.items.length) return

    const newItems = [...currentSchedule.items]
    newItems[index] = { ...newItems[index], ...updates } as ScheduleItem

    const newSchedule: Schedule = {
        ...currentSchedule,
        items: newItems
    }

    try {
        updateState({ schedule: newSchedule })
        await saveSchedule(newSchedule, scheduleName)
    } catch (e) {
        console.error('Failed to update schedule item', e)
    }
}

/**
 * Move a schedule item (reorder)
 */
export async function moveScheduleItem(fromIndex: number, toIndex: number): Promise<void> {
    const currentSchedule = state.schedule
    const scheduleName = getSavedCurrentSchedule()
    const items = [...currentSchedule.items]

    if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) return

    const [movedItem] = items.splice(fromIndex, 1)
    items.splice(toIndex, 0, movedItem)

    const newSchedule: Schedule = {
        ...currentSchedule,
        items
    }

    try {
        updateState({ schedule: newSchedule })
        await saveSchedule(newSchedule, scheduleName)
    } catch (e) {
        console.error('Failed to move schedule item', e)
    }
}
