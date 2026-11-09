import type { DeskApi } from './game'

declare global {
  interface Window {
    desk: DeskApi
  }
}

export {}
