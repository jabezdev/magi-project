/**
 * SearchBar - Reusable search input with debounce
 */

export interface SearchBarOptions {
    placeholder?: string
    value?: string
    debounceMs?: number
    onSearch: (query: string) => void
    className?: string
}

export function createSearchBar(options: SearchBarOptions): HTMLElement {
    const { placeholder = 'Search...', value = '', debounceMs = 200, onSearch, className = '' } = options

    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const wrapper = document.createElement('div')
    wrapper.className = `relative ${className}`

    wrapper.innerHTML = `
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <input 
            type="text" 
            class="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-8 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="${placeholder}"
            value="${value}"
        >
        <button class="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-white opacity-0 transition-opacity" title="Clear">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `

    const input = wrapper.querySelector('input')!
    const clearBtn = wrapper.querySelector('button')!

    const triggerSearch = (val: string) => {
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => onSearch(val), debounceMs)
    }

    input.addEventListener('input', () => {
        const val = input.value
        clearBtn.style.opacity = val ? '1' : '0'
        triggerSearch(val)
    })

    clearBtn.addEventListener('click', () => {
        input.value = ''
        clearBtn.style.opacity = '0'
        onSearch('')
        input.focus()
    })

    // Initial state
    clearBtn.style.opacity = value ? '1' : '0'

    return wrapper
}
