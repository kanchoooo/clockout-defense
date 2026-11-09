import { contextBridge, ipcRenderer } from 'electron'
import type { Boot, Profile, Settings } from '@shared/types'

const api = {
  boot: (): Promise<Boot> => ipcRenderer.invoke('desk:boot'),
  setSettings: (patch: Partial<Settings>): Promise<Settings> => ipcRenderer.invoke('desk:settings', patch),
  saveProfile: (p: Profile): void => ipcRenderer.send('desk:saveProfile', p),
  saveRun: (run: unknown | null): void => ipcRenderer.send('desk:saveRun', run),
  hide: (): void => ipcRenderer.send('desk:hide'),
  quit: (): void => ipcRenderer.send('desk:quit'),
  openUrl: (url: string): void => ipcRenderer.send('desk:openUrl', url),
  log: (msg: string): void => ipcRenderer.send('desk:log', msg),
  shot: (name: string): Promise<void> => ipcRenderer.invoke('desk:shot', name),
  scriptDone: (): void => ipcRenderer.send('desk:scriptDone'),
  info: (): Promise<Record<string, unknown>> => ipcRenderer.invoke('desk:info'),
  onBossKey: (fn: () => void): void => {
    ipcRenderer.on('desk:bossKey', () => fn())
  },
  onVisibility: (fn: (visible: boolean) => void): void => {
    ipcRenderer.on('desk:visibility', (_e, v: boolean) => fn(v))
  },
  onBlur: (fn: (focused: boolean) => void): void => {
    ipcRenderer.on('desk:focus', (_e, v: boolean) => fn(v))
  }
}

export type DeskApi = typeof api
contextBridge.exposeInMainWorld('desk', api)
