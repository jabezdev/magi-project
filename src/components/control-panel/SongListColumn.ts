import { renderScheduleList, initScheduleListListeners } from './ScheduleList'
import { renderLibraryList, initLibraryListListeners } from './LibraryList'
import { renderBackgroundsSection, initBackgroundsListeners } from './BackgroundsSection'
import { renderStatusIndicator, initStatusIndicatorListener } from './StatusIndicator'
import { openSettings } from '../settings'
import { renderControlPanel } from '../../screens/ControlPanel'
import { ICONS } from '../../constants/icons'

export function renderSongListColumn(): string {
  // We no longer rely on 'sets', we render Schedule + Library
  return `
    <div class="cp-column cp-songs">
      <div class="cp-column-body">
        ${renderScheduleList()}
        ${renderLibraryList()}
        ${renderBackgroundsSection()}
      </div>
      <div class="cp-column-footer" style="justify-content: space-between; align-items: center;">
        ${renderStatusIndicator()}
        <button class="icon-btn settings-footer-btn" id="settings-btn" title="Settings">${ICONS.settings}</button>
      </div>
    </div>
  `
}

export function initSongListListeners(): void {
  initScheduleListListeners()
  initLibraryListListeners()
  initBackgroundsListeners()
  initStatusIndicatorListener()

  // Settings button
  document.getElementById('settings-btn')?.addEventListener('click', () => {
    openSettings(() => renderControlPanel())
  })
}
