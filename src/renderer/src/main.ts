import './style.css'
import { App } from './ui/app'
import { runScript } from './ui/script'

async function start(): Promise<void> {
  const boot = await window.desk.boot()
  // 도트 글꼴이 준비된 다음 그려야 도장 글자가 제대로 나온다
  await Promise.all([document.fonts.load("11px 'Galmuri11'", '가'), document.fonts.load("9px 'Galmuri9'", '가'), document.fonts.load("14px 'Galmuri14'", '가')])
  const t0 = performance.now()
  const app = new App(boot)
  if (boot.script) window.desk.log(`시작 준비 ${Math.round(performance.now() - t0)}ms`)
  app.start()
  if (boot.script) void runScript(app, boot.script)
}

void start()
