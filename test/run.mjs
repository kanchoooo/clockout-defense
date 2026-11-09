// 시험 실행: TS 를 esbuild 로 묶어서 node 로 돌린다. 사용법: node test/run.mjs [test/파일.ts]
import { build } from 'esbuild'
import { mkdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const dir = resolve('node_modules/.cache/pd-test')
mkdirSync(dir, { recursive: true })
const out = join(dir, `test-${process.pid}.mjs`)
try {
  await build({
    entryPoints: [process.argv[2] ?? 'test/sim.test.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: out,
    alias: { '@shared': resolve('src/shared'), '@': resolve('src/renderer/src') },
    logLevel: 'error'
  })
  await import(pathToFileURL(out).href)
} finally {
  rmSync(out, { force: true })
}
