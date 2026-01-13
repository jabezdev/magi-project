import { socketService } from '../../services/socket'

export function renderStatusIndicator(): string {
  const isConnected = socketService.isConnected
  return `
    <div class="status-indicator" title="Connection Status">
      <div class="status-dot ${isConnected ? 'connected' : 'disconnected'}" id="connection-status"></div>
    </div>
  `
}

export function initStatusIndicatorListener(): void {
  const dot = document.getElementById('connection-status')

  if (!dot) return

  socketService.on('connect', () => {
    dot.className = 'status-dot connected'
    dot.title = 'Connected'
  })

  socketService.on('disconnect', () => {
    dot.className = 'status-dot disconnected'
    dot.title = 'Disconnected'
  })
}
