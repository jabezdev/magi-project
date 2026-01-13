import { socketService } from '../../services'

export function renderStatusIndicator(): string {
  const isConnected = socketService.isConnected

  // Inline Tailwind Classes
  const indicatorClass = "flex items-center gap-2 ml-2"
  const dotBaseClass = "w-2 h-2 rounded-full shrink-0 transition-colors duration-300"
  const connectedClass = `${dotBaseClass} bg-success shadow-[0_0_6px_var(--success)]`
  const disconnectedClass = `${dotBaseClass} bg-danger animate-pulse`

  const dotClass = isConnected ? connectedClass : disconnectedClass
  const statusClass = isConnected ? 'connected' : 'disconnected'

  return `
    <div class="${indicatorClass}" title="Connection Status">
      <div class="${dotClass} status-dot ${statusClass}" id="connection-status"></div>
    </div>
  `
}

export function initStatusIndicatorListener(): void {
  const dot = document.getElementById('connection-status')

  if (!dot) return

  // Define inline classes for state changes
  const dotBaseClass = "w-2 h-2 rounded-full shrink-0 transition-colors duration-300"
  const connectedClass = `${dotBaseClass} bg-success shadow-[0_0_6px_var(--success)] status-dot connected`
  const disconnectedClass = `${dotBaseClass} bg-danger animate-pulse status-dot disconnected`

  socketService.on('connect', () => {
    dot.className = connectedClass
    dot.title = 'Connected'
  })

  socketService.on('disconnect', () => {
    dot.className = disconnectedClass
    dot.title = 'Disconnected'
  })
}
