import fs from 'fs'
import { join } from 'path'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'

// Paths - configurable via constructor but defaults to standard layout
const DATA_ROOT = process.env.DATA_ROOT || './data'
const LIBRARY_ROOT = join(DATA_ROOT, 'library')
const DB_PATH = join(LIBRARY_ROOT, 'db')
const HISTORY_PATH = join(LIBRARY_ROOT, 'history')

/**
 * LibraryStore
 * 
 * Manages the "Distributed Document Store" architecture.
 * - Hot Store: JSON files in /db (Current State)
 * - Cold Store: JSONL files in /history (Append-only logs)
 */
export class LibraryStore {
    constructor(rootPath = LIBRARY_ROOT) {
        this.root = rootPath
        this.dbPath = join(this.root, 'db')
        this.historyPath = join(this.root, 'history')

        this.ensureDirectories()
    }

    ensureDirectories() {
        if (!fs.existsSync(this.dbPath)) fs.mkdirSync(this.dbPath, { recursive: true })
        if (!fs.existsSync(this.historyPath)) fs.mkdirSync(this.historyPath, { recursive: true })
    }

    // ============ CRUD OPERATIONS ============

    /**
     * Create a new item
     * @param {Object} partialItem - The item data (without system fields)
     * @param {string} author - User creating the item
     * @param {string} deviceId - Origin device ID
     */
    create(partialItem, author = 'System', deviceId = 'unknown-device') {
        const id = uuidv4()
        const now = new Date().toISOString()

        // Construct the V1 State
        const newItem = {
            ...partialItem,
            id,
            version: 1,
            history_head_id: uuidv4(), // First commit ID
            created_at: now,
            updated_at: now,
            usage_count: 0,
            author, // Original author
            origin_device_id: deviceId,
            last_modified_device_id: deviceId
        }

        // Calculate hash
        newItem.content_hash = this.calculateHash(newItem)

        // Writoe to DB (Hot Store)
        this.writeToDb(newItem)

        // Write to History (Cold Store)
        this.appendToHistory(newItem.id, {
            commit_id: newItem.history_head_id,
            parent_commit_id: null,
            version_number: 1,
            timestamp: now,
            author,
            device_id: deviceId,
            change_summary: 'Created item',
            full_snapshot: newItem
        })

        return newItem
    }

    /**
     * Get an item by ID
     * @param {string} id 
     */
    get(id) {
        const path = join(this.dbPath, `${id}.json`)
        if (!fs.existsSync(path)) return null
        try {
            return JSON.parse(fs.readFileSync(path, 'utf-8'))
        } catch (e) {
            console.error(`Failed to read item ${id}`, e)
            return null
        }
    }

    /**
     * Update an item
     * @param {string} id 
     * @param {Object} delta - Partial update object
     * @param {string} author 
     * @param {string} deviceId 
     * @param {string} changeSummary 
     */
    update(id, delta, author = 'System', deviceId = 'unknown-device', changeSummary = 'Updated item') {
        const current = this.get(id)
        if (!current) throw new Error(`Item ${id} not found`)

        const now = new Date().toISOString()
        const newCommitId = uuidv4()

        // Create new state
        const nextVersion = current.version + 1
        const updatedItem = {
            ...current,
            ...delta,
            version: nextVersion,
            history_head_id: newCommitId,
            updated_at: now,
            last_modified_device_id: deviceId
        }

        // Calculate new hash
        updatedItem.content_hash = this.calculateHash(updatedItem)

        // Write to DB
        this.writeToDb(updatedItem)

        // Write to History
        this.appendToHistory(id, {
            commit_id: newCommitId,
            parent_commit_id: current.history_head_id, // Pointer to previous commit
            version_number: nextVersion,
            timestamp: now,
            author,
            device_id: deviceId,
            change_summary: changeSummary,
            full_snapshot: updatedItem
        })

        return updatedItem
    }

    /**
     * List all items, optionally filtered by type
     * @param {string} typeFilter 
     */
    list(typeFilter = null) {
        const files = fs.readdirSync(this.dbPath)
        const items = []

        for (const file of files) {
            if (!file.endsWith('.json')) continue

            try {
                // Optimization: In a real DB we'd query index. 
                // Here we read files but we could keep an in-memory index if needed.
                const path = join(this.dbPath, file)
                const item = JSON.parse(fs.readFileSync(path, 'utf-8'))

                if (!typeFilter || item.type === typeFilter) {
                    items.push(item)
                }
            } catch (e) {
                console.warn(`Failed to read ${file}`, e)
            }
        }

        return items
    }

    /**
     * Get history log for an item
     * @param {string} id 
     */
    getHistory(id) {
        const path = join(this.historyPath, `${id}.jsonl`)
        if (!fs.existsSync(path)) return []

        const fileContent = fs.readFileSync(path, 'utf-8')
        return fileContent.split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line))
            .sort((a, b) => b.version_number - a.version_number) // Newest first
    }

    // ============ HELPERS ============

    writeToDb(item) {
        const path = join(this.dbPath, `${item.id}.json`)
        fs.writeFileSync(path, JSON.stringify(item, null, 2))
    }

    appendToHistory(id, entry) {
        const path = join(this.historyPath, `${id}.jsonl`)
        fs.appendFileSync(path, JSON.stringify(entry) + '\n')
    }

    calculateHash(obj) {
        // Simple stable hash of the object content
        // Exclude system fields that change on every save to ensure content-based hashing works for sync later
        // (Though for now we hash everything except hash itself to detect ANY change)
        const { content_hash, ...rest } = obj
        return crypto.createHash('sha256').update(JSON.stringify(rest)).digest('hex')
    }
}

// Singleton instance
export const libraryStore = new LibraryStore()
