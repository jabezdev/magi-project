import { libraryStore } from '../server/lib/library_store.mjs'
import assert from 'assert'
import fs from 'fs'

const TEST_ID = 'test-verification-script'

async function runTest() {
    console.log('Starting LibraryStore Verification...')

    // 1. Create
    console.log('[1] Create Song')
    const song = libraryStore.create({
        type: 'song',
        title: 'Amazing Grace',
        artist: 'John Newton',
        tags: ['Hymn']
    }, 'Tester')

    assert.equal(song.version, 1)
    assert.equal(song.title, 'Amazing Grace')
    console.log('✅ Created:', song.id)

    // 2. Update
    console.log('[2] Update Title')
    const v2 = libraryStore.update(song.id, { title: 'Amazing Grace (Remix)' }, 'Tester')
    assert.equal(v2.version, 2)
    assert.equal(v2.title, 'Amazing Grace (Remix)')
    console.log('✅ Updated to v2')

    // 3. Update Again
    console.log('[3] Update Artist')
    const v3 = libraryStore.update(song.id, { artist: 'Unknown' }, 'Tester')
    assert.equal(v3.version, 3)
    console.log('✅ Updated to v3')

    // 4. Verify History
    console.log('[4] Check History')
    const history = libraryStore.getHistory(song.id)
    assert.equal(history.length, 3) // v1, v2, v3
    assert.equal(history[0].version_number, 3) // Latest first
    console.log('✅ History has 3 entries')

    // 5. Revert
    console.log('[5] Revert to v1')
    // Find v1 commit
    const v1Commit = history.find(h => h.version_number === 1)

    const v4 = libraryStore.update(
        song.id,
        v1Commit.full_snapshot, // Restore snapshot
        'Tester',
        'device-1',
        'Revert to v1'
    )

    assert.equal(v4.version, 4)
    assert.equal(v4.title, 'Amazing Grace') // Should be original title
    console.log('✅ Reverted to v4 (content of v1)')

    console.log('🎉 Verification Successful!')
}

runTest().catch(e => {
    console.error('❌ Verification Failed:', e)
    process.exit(1)
})
