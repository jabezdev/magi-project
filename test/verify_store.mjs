import { LibraryStore } from '../server/lib/library_store.mjs'
import { AssetStore } from '../server/lib/asset_store.mjs'
import fs from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const DATA_ROOT = './test_data'
const LIBRARY_ROOT = join(DATA_ROOT, 'library')

// Clean up previous test
if (fs.existsSync(DATA_ROOT)) {
    console.log('Cleaning up previous test data...')
    fs.rmSync(DATA_ROOT, { recursive: true, force: true })
}

const libStore = new LibraryStore(LIBRARY_ROOT)
const assetStore = new AssetStore(LIBRARY_ROOT)

async function testLibrary() {
    console.log('\n--- Testing Library Store ---')

    // 1. Create
    console.log('Creating item...')
    const item = libStore.create({
        type: 'song',
        title: 'Amazing Grace',
        tags: ['Hymn']
    }, 'Tester', 'test-device')
    console.log('Created:', item.id, item.version)

    // 2. Read
    const readItem = libStore.get(item.id)
    if (readItem.title !== 'Amazing Grace') throw new Error('Read failed')
    console.log('Read verified.')

    // 3. Update
    console.log('Updating item...')
    const updated = libStore.update(item.id, { title: 'Amazing Grace (Remix)' }, 'Tester', 'test-device')
    if (updated.version !== 2) throw new Error('Version mismatch')
    console.log('Updated to version:', updated.version)

    // 4. History
    const history = libStore.getHistory(item.id)
    if (history.length !== 2) throw new Error('History length mismatch')
    console.log('History verified:', history.length, 'entries')

    // 5. Delete
    console.log('Deleting item...')
    libStore.delete(item.id)
    const deletedItem = libStore.get(item.id)
    if (!deletedItem.is_deleted) throw new Error('Delete failed')

    const listNormal = libStore.list()
    if (listNormal.find(i => i.id === item.id)) throw new Error('Deleted item appeared in list')

    const listAll = libStore.list(null, true)
    if (!listAll.find(i => i.id === item.id)) throw new Error('Deleted item missing from includeDeleted list')
    console.log('Delete verified.')

    // 6. Revert (Restore)
    console.log('Reverting to v1...')
    // v1 is the second entry in history (index 1) because newest is first
    const v1Commit = history[1]
    const v1Delta = { ...v1Commit.full_snapshot, is_deleted: false }
    libStore.update(item.id, v1Delta, 'Tester', 'test-device', 'Restoring v1')

    const restored = libStore.get(item.id)
    if (restored.title !== 'Amazing Grace') throw new Error('Restore failed')
    if (restored.version !== 4) throw new Error('Version mismatch on restore') // v1 -> v2 -> v3(del) -> v4
    if (restored.is_deleted) throw new Error('Item still deleted after restore')
    console.log('Revert verified.')
}

async function testAssets() {
    console.log('\n--- Testing Asset Store (CAS) ---')

    // Create dummy file
    const tempFile = join(DATA_ROOT, 'temp.txt')
    fs.mkdirSync(DATA_ROOT, { recursive: true })
    fs.writeFileSync(tempFile, 'Hello CAS World!')

    // Ingest
    console.log('Ingesting asset...')
    const result = await assetStore.ingest(tempFile, 'original.txt')
    console.log('Ingested:', result)

    // Verify file exists at path
    // result.path is relative to LIBRARY_ROOT usually (implemented as 'library/assets/...')
    // Wait, in my impl I returned join('library', 'assets'...) which is relative to DATA_ROOT concept if generic.
    // In the test `assetStore` was init with `LIBRARY_ROOT`. 
    // And `ingest` joins `this.assetsRoot`.

    // Let's check physical existence
    const expectedPhysical = join(LIBRARY_ROOT, 'assets', result.file_hash.substring(0, 2), result.file_hash + '.txt')

    if (!fs.existsSync(expectedPhysical)) {
        throw new Error(`File not found at ${expectedPhysical}`)
    }

    const content = fs.readFileSync(expectedPhysical, 'utf-8')
    if (content !== 'Hello CAS World!') throw new Error('Content mismatch')
    console.log('CAS verification successful.')
}

async function run() {
    try {
        await testLibrary()
        await testAssets()
        console.log('\n✅ ALL TESTS PASSED')
    } catch (e) {
        console.error('\n❌ TEST FAILED:', e)
        process.exit(1)
    } finally {
        // cleanup
        if (fs.existsSync(DATA_ROOT)) {
            fs.rmSync(DATA_ROOT, { recursive: true, force: true })
        }
    }
}

run()
