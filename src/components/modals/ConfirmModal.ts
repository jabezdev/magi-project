import { Modal } from '../Modal'

/**
 * ConfirmModal - A confirmation dialog replacement for browser confirm()
 */
export interface ConfirmOptions {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    danger?: boolean
    onConfirm: () => void
    onCancel?: () => void
}

export function openConfirmModal(options: ConfirmOptions) {
    const content = document.createElement('div')
    content.className = 'space-y-4'
    content.innerHTML = `
        <p class="text-zinc-300">${options.message}</p>
    `

    const footer = document.createElement('div')
    footer.className = 'flex gap-2'

    const cancelBtn = document.createElement('button')
    cancelBtn.type = 'button'
    cancelBtn.className = 'px-4 py-2 text-sm text-zinc-500 hover:text-white font-bold transition-colors'
    cancelBtn.textContent = options.cancelText || 'Cancel'

    const confirmBtn = document.createElement('button')
    confirmBtn.type = 'button'
    confirmBtn.className = options.danger
        ? 'px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg shadow-red-900/20 transition-colors'
        : 'px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-colors'
    confirmBtn.textContent = options.confirmText || 'Confirm'

    footer.appendChild(cancelBtn)
    footer.appendChild(confirmBtn)

    const modal = new Modal(options.title, content, footer, { width: 'w-full max-w-md' })

    cancelBtn.addEventListener('click', () => {
        modal.close()
        options.onCancel?.()
    })

    confirmBtn.addEventListener('click', () => {
        modal.close()
        options.onConfirm()
    })

    return modal
}

/**
 * AlertModal - A modal replacement for browser alert()
 */
export interface AlertOptions {
    title: string
    message: string
    buttonText?: string
    type?: 'info' | 'success' | 'warning' | 'error'
    onClose?: () => void
}

export function openAlertModal(options: AlertOptions) {
    const content = document.createElement('div')
    content.className = 'space-y-4'

    // Icon based on type
    let iconClass = 'text-blue-500'
    let icon = '💡'

    if (options.type === 'success') {
        iconClass = 'text-green-500'
        icon = '✓'
    } else if (options.type === 'warning') {
        iconClass = 'text-yellow-500'
        icon = '⚠'
    } else if (options.type === 'error') {
        iconClass = 'text-red-500'
        icon = '✕'
    }

    content.innerHTML = `
        <div class="flex items-start gap-3">
            <span class="text-2xl ${iconClass}">${icon}</span>
            <p class="text-zinc-300 flex-1">${options.message}</p>
        </div>
    `

    const footer = document.createElement('div')
    footer.className = 'flex justify-end'

    const okBtn = document.createElement('button')
    okBtn.type = 'button'
    okBtn.className = 'px-4 py-2 text-sm bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-lg transition-colors'
    okBtn.textContent = options.buttonText || 'OK'

    footer.appendChild(okBtn)

    const modal = new Modal(options.title, content, footer, {
        width: 'w-full max-w-md',
        onClose: options.onClose
    })

    okBtn.addEventListener('click', () => {
        modal.close()
    })

    return modal
}

/**
 * Toast - A lightweight notification that auto-dismisses
 */
export interface ToastOptions {
    message: string
    type?: 'info' | 'success' | 'warning' | 'error'
    duration?: number // ms, default 3000
}

export function showToast(options: ToastOptions) {
    const duration = options.duration || 3000

    let bgClass = 'bg-zinc-800 border-zinc-700'
    let iconClass = 'text-blue-400'
    let icon = 'ℹ'

    if (options.type === 'success') {
        bgClass = 'bg-green-900/80 border-green-700'
        iconClass = 'text-green-400'
        icon = '✓'
    } else if (options.type === 'warning') {
        bgClass = 'bg-yellow-900/80 border-yellow-700'
        iconClass = 'text-yellow-400'
        icon = '⚠'
    } else if (options.type === 'error') {
        bgClass = 'bg-red-900/80 border-red-700'
        iconClass = 'text-red-400'
        icon = '✕'
    }

    const toast = document.createElement('div')
    toast.className = `fixed bottom-4 right-4 z-[200] ${bgClass} border shadow-xl px-4 py-3 flex items-center gap-2 min-w-[250px] max-w-md animate-slide-in`
    toast.innerHTML = `
        <span class="text-lg ${iconClass}">${icon}</span>
        <span class="text-sm text-zinc-200 flex-1">${options.message}</span>
        <button class="text-zinc-500 hover:text-white text-lg font-bold ml-2" id="toast-close">×</button>
    `

    document.body.appendChild(toast)

    const close = () => {
        toast.classList.add('animate-slide-out')
        setTimeout(() => toast.remove(), 200)
    }

    toast.querySelector('#toast-close')?.addEventListener('click', close)

    // Auto-dismiss
    setTimeout(close, duration)

    return { close }
}
