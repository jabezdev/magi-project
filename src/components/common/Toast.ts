/**
 * Simple Toast Notification Utility
 */

export function showToast(message: string, duration = 3000): void {
    // Create container if not exists
    let container = document.getElementById('toast-container')
    if (!container) {
        container = document.createElement('div')
        container.id = 'toast-container'
        container.className = 'fixed bottom-4 right-4 flex flex-col gap-2 z-[9999] pointer-events-none'
        document.body.appendChild(container)
    }

    const toast = document.createElement('div')
    toast.className = 'bg-bg-secondary border border-border-color text-text-primary px-4 py-2 rounded shadow-lg text-sm font-medium animate-fade-in-up pointer-events-auto flex items-center gap-2'

    toast.innerHTML = `
    <span class="text-accent-primary">✓</span>
    <span>${message}</span>
  `

    container.appendChild(toast)

    // Auto remove
    setTimeout(() => {
        toast.style.opacity = '0'
        toast.style.transform = 'translateY(10px)'
        toast.style.transition = 'all 0.3s ease'
        setTimeout(() => {
            toast.remove()
            if (container && container.childNodes.length === 0) {
                container.remove()
            }
        }, 300)
    }, duration)
}
