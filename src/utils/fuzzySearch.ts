/**
 * Fuzzy Search Utility
 * 
 * Provides fuzzy string matching for song search functionality.
 */

export interface FuzzyResult {
  item: string
  score: number
  matches: Array<[number, number]> // Start and end indices of matching substrings
}

/**
 * Calculate fuzzy match score between a pattern and a string.
 * Returns a score where higher is better (0 means no match).
 * 
 * Features:
 * - Case insensitive matching
 * - Consecutive character bonus
 * - Word boundary bonus
 * - Prefix matching bonus
 */
export function fuzzyMatch(pattern: string, text: string): { score: number; matches: Array<[number, number]> } {
  if (!pattern || !text) {
    return { score: 0, matches: [] }
  }

  const patternLower = pattern.toLowerCase()
  const textLower = text.toLowerCase()

  // Exact match gets highest score
  if (textLower === patternLower) {
    return { score: 1000, matches: [[0, text.length - 1]] }
  }

  // Contains the full pattern
  const containsIndex = textLower.indexOf(patternLower)
  if (containsIndex !== -1) {
    const score = 500 + (containsIndex === 0 ? 100 : 0) // Bonus for prefix match
    return { score, matches: [[containsIndex, containsIndex + pattern.length - 1]] }
  }

  // Fuzzy character matching
  let patternIdx = 0
  let score = 0
  let consecutiveBonus = 0
  let lastMatchIdx = -1
  const matches: Array<[number, number]> = []
  let matchStart = -1

  for (let textIdx = 0; textIdx < textLower.length && patternIdx < patternLower.length; textIdx++) {
    if (textLower[textIdx] === patternLower[patternIdx]) {
      // Base score for matching character
      score += 10

      // Consecutive character bonus
      if (lastMatchIdx === textIdx - 1) {
        consecutiveBonus += 5
        score += consecutiveBonus
      } else {
        consecutiveBonus = 0
        // Save previous match range
        if (matchStart !== -1) {
          matches.push([matchStart, lastMatchIdx])
        }
        matchStart = textIdx
      }

      // Word boundary bonus (start of word)
      if (textIdx === 0 || /\s/.test(text[textIdx - 1])) {
        score += 15
      }

      // Prefix bonus
      if (textIdx === patternIdx) {
        score += 10
      }

      lastMatchIdx = textIdx
      patternIdx++
    }
  }

  // Save final match range
  if (matchStart !== -1 && lastMatchIdx !== -1) {
    matches.push([matchStart, lastMatchIdx])
  }

  // Only return score if all pattern characters were found
  if (patternIdx !== patternLower.length) {
    return { score: 0, matches: [] }
  }

  return { score, matches }
}

/**
 * Search an array of items with fuzzy matching.
 * Returns items sorted by match score (best first).
 */
export function fuzzySearch<T>(
  items: T[],
  pattern: string,
  keyFn: (item: T) => string
): Array<T & { _fuzzyScore: number; _fuzzyMatches: Array<[number, number]> }> {
  if (!pattern.trim()) {
    return items.map(item => ({ ...item, _fuzzyScore: 100, _fuzzyMatches: [] }))
  }

  const results = items
    .map(item => {
      const text = keyFn(item)
      const { score, matches } = fuzzyMatch(pattern, text)
      return { ...item, _fuzzyScore: score, _fuzzyMatches: matches }
    })
    .filter(item => item._fuzzyScore > 0)
    .sort((a, b) => b._fuzzyScore - a._fuzzyScore)

  return results
}

/**
 * Highlight matched portions of text with HTML markup.
 */
export function highlightMatches(text: string, matches: Array<[number, number]>): string {
  if (!matches.length) return escapeHtml(text)

  let result = ''
  let lastIdx = 0

  // Sort matches by start index
  const sortedMatches = [...matches].sort((a, b) => a[0] - b[0])

  for (const [start, end] of sortedMatches) {
    // Add text before match
    if (start > lastIdx) {
      result += escapeHtml(text.slice(lastIdx, start))
    }
    // Add highlighted match
    result += `<mark class="fuzzy-match">${escapeHtml(text.slice(start, end + 1))}</mark>`
    lastIdx = end + 1
  }

  // Add remaining text
  if (lastIdx < text.length) {
    result += escapeHtml(text.slice(lastIdx))
  }

  return result
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
