/**
 * Helper to setup range input with value display
 */
export function setupRangeInput(inputId: string, valueId: string, suffix: string = ''): void {
    const input = document.getElementById(inputId) as HTMLInputElement
    const valueEl = document.getElementById(valueId)
    if (input && valueEl) {
        input.addEventListener('input', () => {
            valueEl.textContent = input.value + suffix
        })
    }
}

/**
 * Helper to setup range input with value display and margin preview
 */
export function setupRangeInputWithPreview(inputId: string, valueId: string, previewId: string, suffix: string = ''): void {
    const input = document.getElementById(inputId) as HTMLInputElement
    const valueEl = document.getElementById(valueId)
    const previewEl = document.getElementById(previewId)
    if (input && valueEl) {
        input.addEventListener('input', () => {
            valueEl.textContent = input.value + suffix
            if (previewEl) previewEl.textContent = input.value + suffix
        })
    }
}
