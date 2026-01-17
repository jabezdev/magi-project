export interface BibleBook {
    name: string
    chapters: number
}

export const OLD_TESTAMENT: BibleBook[] = [
    { name: 'Genesis', chapters: 50 },
    { name: 'Exodus', chapters: 40 },
    { name: 'Psalms', chapters: 150 },
    // ... complete list in real app
]

export const NEW_TESTAMENT: BibleBook[] = [
    { name: 'Matthew', chapters: 28 },
    { name: 'Mark', chapters: 16 },
    { name: 'Luke', chapters: 24 },
    { name: 'John', chapters: 21 },
    { name: 'Acts', chapters: 28 },
    { name: 'Romans', chapters: 16 },
    { name: 'Revelation', chapters: 22 }
]

export const ALL_BOOKS = [...OLD_TESTAMENT, ...NEW_TESTAMENT]

// Mock Data for Demo
const MOCK_VERSES: Record<string, string> = {
    'Genesis 1:1': 'In the beginning God created the heaven and the earth.',
    'John 3:16': 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
    'Psalms 23:1': 'The LORD is my shepherd; I shall not want.',
    'Psalms 23:2': 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.',
    'Psalms 23:3': 'He restoreth my soul: he leadeth me in the paths of righteousness for his name\'s sake.',
    'Psalms 23:4': 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.',
    'Psalms 23:5': 'Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.',
    'Psalms 23:6': 'Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.'
}

export type Translation = 'KJV' | 'WEB' | 'NIV'

export interface ScriptureReference {
    book: string
    chapter: number
    verses: number[] // [1, 2, 3]
    translation: Translation
}

export const BibleApi = {
    getBooks: () => ALL_BOOKS,

    getChapterCount: (bookName: string) => {
        return ALL_BOOKS.find(b => b.name === bookName)?.chapters || 0
    },

    getVerseCount: (bookName: string, chapter: number) => {
        // Mock: Return 30 verses for every chapter for now
        // In real app, this needs a map of verse counts per chapter
        if (bookName === 'Psalms' && chapter === 119) return 176
        return 30
    },

    getVerses: async (ref: ScriptureReference): Promise<{ reference: string, text: string }[]> => {
        // Simulate network delay
        await new Promise(r => setTimeout(r, 200))

        return ref.verses.map(v => {
            const key = `${ref.book} ${ref.chapter}:${v}`
            // Return mock or placeholder
            const text = MOCK_VERSES[key] || `(Placeholder text for ${key} in ${ref.translation})`
            return {
                reference: key,
                text
            }
        })
    }
}
