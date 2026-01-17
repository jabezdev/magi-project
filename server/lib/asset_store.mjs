import fs from 'fs'
import { join, dirname, extname } from 'path'
import crypto from 'crypto'

/**
 * AssetStore
 * 
 * Manages physical file storage using Content-Addressable Storage (CAS) principles.
 * Files are stored in a structural layout based on their content hash.
 * 
 * Layout: /library/assets/[ha]/[hash][ext]
 * Example: /library/assets/a1/a1b2c3d4e5... .jpg
 */
export class AssetStore {
    constructor(rootPath) {
        this.assetsRoot = join(rootPath, 'assets')
        this.ensureRoot()
    }

    ensureRoot() {
        if (!fs.existsSync(this.assetsRoot)) {
            fs.mkdirSync(this.assetsRoot, { recursive: true })
        }
    }

    /**
     * Calculate SHA-256 hash of a file
     * @param {string} filePath 
     * @returns {Promise<string>}
     */
    calculateFileHash(filePath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256')
            const stream = fs.createReadStream(filePath)

            stream.on('data', data => hash.update(data))
            stream.on('end', () => resolve(hash.digest('hex')))
            stream.on('error', err => reject(err))
        })
    }

    /**
     * Ingest a file into the CAS store.
     * Moves the source file to the destination.
     * 
     * @param {string} tempFilePath - Current location of the file
     * @param {string} originalName - Original filename (to preserve extension)
     * @returns {Promise<Object>}Metadata { hash, path, size, mimeType? }
     */
    async ingest(tempFilePath, originalName) {
        const hash = await this.calculateFileHash(tempFilePath)
        const ext = extname(originalName).toLowerCase()

        // Create partition directory (first 2 chars of hash)
        const partition = hash.substring(0, 2)
        const partitionDir = join(this.assetsRoot, partition)

        if (!fs.existsSync(partitionDir)) {
            fs.mkdirSync(partitionDir, { recursive: true })
        }

        const stats = fs.statSync(tempFilePath)
        const finalFilename = `${hash}${ext}`
        const finalPath = join(partitionDir, finalFilename)

        // If file already exists, we can technically skip copy (deduplication!)
        // But for safety/mtime updates, we might just overwrite or check.
        if (!fs.existsSync(finalPath)) {
            fs.copyFileSync(tempFilePath, finalPath)
        }

        // Clean up temp
        try {
            fs.unlinkSync(tempFilePath)
        } catch (e) {
            console.warn('Failed to cleanup temp file', e)
        }

        // Return the relative path from library root, or absolute? 
        // Let's return relative to Data Root so it's portable-ish if `data` moves,
        // but strict enough. Actually, for the DB, we might want to store the Hash 
        // and let the system resolve the path. 
        // For now, let's return the structured info.

        return {
            hash,
            file_hash: hash, // Alias for DB consistency
            size: stats.size,
            extension: ext,
            path: join('library', 'assets', partition, finalFilename) // Relative to DATA_ROOT
        }
    }
}
