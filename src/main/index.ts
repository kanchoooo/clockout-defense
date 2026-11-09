import { app, BrowserWindow, globalShortcut, ipcMain, Menu, nativeImage, screen, shell, Tray } from 'electron'
import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { BOSS_KEY, INSTAGRAM_URL, MORE_APPS_URL, SCALES, type Boot, type Corner, type Profile, type Settings } from '@shared/types'
import { Store } from './store'

/**
 * 개발·시험용 환경변수
 *  PD_USERDATA=폴더   저장 위치를 바꾼다
 *  PD_HEADLESS=1      화면 없이(오프스크린) 돌린다
 *  PD_SCRIPT=이름      자동 조작 (renderer 의 ui/script.ts). 끝나면 종료
 *  PD_SHOT_DIR=폴더    PD_SCRIPT 의 화면 저장 위치
 *  PD_LOG=1           렌더러 콘솔을 터미널로
 */
const env = process.env
const headless = env.PD_HEADLESS === '1'
const BASE_W = 480
const BASE_H = 300
const MARGIN = 14

if (process.platform === 'win32') app.setAppUserModelId('com.clockoutdefense.app')
if (env.PD_USERDATA) app.setPath('userData', env.PD_USERDATA)
if (!headless && !app.requestSingleInstanceLock()) app.quit()

let win: BrowserWindow | null = null
let tray: Tray | null = null
let store: Store
let quitting = false

function scalesFor(): number[] {
  const area = screen.getPrimaryDisplay().workAreaSize
  const fit = SCALES.filter((s) => BASE_W * s <= area.width && BASE_H * s <= area.height)
  return fit.length ? fit : [1]
}

function placement(s: Settings): { x: number; y: number; width: number; height: number } {
  const display = screen.getPrimaryDisplay().workArea
  const scales = scalesFor()
  const scale = scales.includes(s.scale) ? s.scale : scales[scales.length - 1]
  const width = Math.round(BASE_W * scale)
  const height = Math.round(BASE_H * scale)
  const right = (s.corner as Corner).endsWith('r')
  const bottom = (s.corner as Corner).startsWith('b')
  return {
    x: right ? display.x + display.width - width - MARGIN : display.x + MARGIN,
    y: bottom ? display.y + display.height - height - MARGIN : display.y + MARGIN,
    width,
    height
  }
}

function applyWindow(prev?: Settings): void {
  if (!win) return
  const s = store.settings
  win.setAlwaysOnTop(s.alwaysOnTop, 'floating')
  if (!prev || prev.scale !== s.scale || prev.corner !== s.corner) win.setBounds(placement(s))
}

function createWindow(): void {
  const s = store.settings
  const b = placement(s)
  win = new BrowserWindow({
    ...b,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    acceptFirstMouse: true,
    backgroundColor: '#00000000',
    title: '칼퇴 디펜스',
    webPreferences: {
      preload: join(__dirname, '../preload/game.js'),
      sandbox: true,
      contextIsolation: true,
      backgroundThrottling: false,
      offscreen: headless
    }
  })
  if (headless) win.webContents.setFrameRate(60)
  win.setAlwaysOnTop(s.alwaysOnTop, 'floating')
  win.on('ready-to-show', () => {
    if (!headless) win?.show()
  })
  win.on('close', (e) => {
    if (quitting) return
    e.preventDefault()
    win?.hide()
  })
  win.on('hide', () => win?.webContents.send('desk:visibility', false))
  win.on('show', () => win?.webContents.send('desk:visibility', true))
  win.on('focus', () => win?.webContents.send('desk:focus', true))
  win.on('blur', () => win?.webContents.send('desk:focus', false))
  if (env.PD_LOG === '1') win.webContents.on('console-message', (e) => console.log('[화면]', e.message))
  win.webContents.on('render-process-gone', (_e, d) => console.error('[화면 프로세스 종료]', d.reason))
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (e) => e.preventDefault())
  const dev = env.ELECTRON_RENDERER_URL
  if (dev) void win.loadURL(dev)
  else void win.loadFile(join(__dirname, '../renderer/index.html'))
}

function toggleWindow(): void {
  if (!win) return
  if (win.isVisible()) win.hide()
  else win.show()
}

function setupTray(): void {
  const iconPath = app.isPackaged ? join(process.resourcesPath, 'tray.png') : join(__dirname, '../../build/tray.png')
  let image = nativeImage.createFromPath(iconPath)
  if (image.isEmpty()) image = nativeImage.createEmpty()
  else image = image.resize({ width: 18, height: 18 })
  tray = new Tray(image)
  tray.setToolTip('칼퇴 디펜스')
  const menu = Menu.buildFromTemplate([
    { label: '보이기 / 숨기기', click: toggleWindow },
    { type: 'separator' },
    { label: '인스타그램 보기', click: () => void shell.openExternal(INSTAGRAM_URL) },
    { label: '개발자의 다른 앱 보기', click: () => void shell.openExternal(MORE_APPS_URL) },
    { type: 'separator' },
    { label: '종료', click: () => { quitting = true; app.quit() } }
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => {
    if (process.platform !== 'darwin') toggleWindow()
  })
}

function setupIpc(): void {
  ipcMain.handle('desk:boot', (): Boot => ({
    settings: store.settings,
    profile: store.profile,
    run: store.loadRun(),
    platform: process.platform,
    version: app.getVersion(),
    scales: scalesFor(),
    script: env.PD_SCRIPT ?? null
  }))
  ipcMain.handle('desk:settings', (_e, patch: Partial<Settings>) => {
    const prev = store.settings
    store.setSettings(patch)
    applyWindow(prev)
    return store.settings
  })
  ipcMain.on('desk:saveProfile', (_e, p: Profile) => store.setProfile(p))
  ipcMain.on('desk:saveRun', (_e, run: unknown | null) => store.saveRun(run))
  ipcMain.on('desk:hide', () => win?.hide())
  ipcMain.on('desk:quit', () => {
    quitting = true
    app.quit()
  })
  ipcMain.on('desk:openUrl', (_e, url: string) => {
    if (url === INSTAGRAM_URL || url === MORE_APPS_URL) void shell.openExternal(url)
  })
  ipcMain.on('desk:log', (_e, msg: string) => console.log('[게임]', msg))
  ipcMain.handle('desk:shot', async (_e, name: string) => {
    if (!win) return
    const dir = env.PD_SHOT_DIR ?? join(app.getPath('temp'), 'clockout-shots')
    const file = join(dir, `${name.replace(/[^\w.-]/g, '_')}.png`)
    const img = await win.webContents.capturePage()
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, img.toPNG())
    console.log('[화면 저장]', file)
  })
  ipcMain.handle('desk:info', () => ({
    bounds: win?.getBounds(),
    workArea: screen.getPrimaryDisplay().workArea,
    scaleFactor: screen.getPrimaryDisplay().scaleFactor,
    visible: win?.isVisible(),
    onTop: win?.isAlwaysOnTop(),
    shortcut: globalShortcut.isRegistered(BOSS_KEY),
    tray: !!tray && !tray.isDestroyed()
  }))
  ipcMain.on('desk:scriptDone', () => {
    quitting = true
    app.quit()
  })
}

void app.whenReady().then(() => {
  store = new Store()
  Menu.setApplicationMenu(null)
  if (process.platform === 'darwin' && !headless) app.dock?.hide()
  setupIpc()
  createWindow()
  if (!headless) setupTray()
  // 팀장 등장: 어디서든 누르면 숨기거나 위장
  if (!headless) {
    globalShortcut.register(BOSS_KEY, () => {
      if (!win) return
      if (!win.isVisible()) {
        win.show()
        return
      }
      if (store.settings.bossMode === 'hide') win.hide()
      else win.webContents.send('desk:bossKey')
    })
  }
})

app.on('second-instance', () => win?.show())
app.on('before-quit', () => {
  quitting = true
  store?.flush()
})
app.on('will-quit', () => globalShortcut.unregisterAll())
app.on('window-all-closed', () => app.quit())

