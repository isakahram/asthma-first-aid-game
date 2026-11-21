import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve('dist')
const info = JSON.parse(await readFile(resolve(root, 'quest-info.json'), 'utf8'))
assert.equal(info.base, '/asthma-first-aid-game/')
assert.equal(info.scenarioCount, 20)
assert.equal(info.maxScore, 200)
assert.equal(info.scenarios.length, 20)
assert.equal(new Set(info.scenarios.map((scene) => scene.id)).size, 20)
assert.equal(new Set(info.scenarios.map((scene) => scene.image)).size, 20)
for (const path of [...info.assets, 'favicon.svg', '.nojekyll']) {
  assert.ok(!path.startsWith('/') && !path.includes('..'), `Invalid asset path: ${path}`)
  assert.ok((await stat(resolve(root, path))).isFile(), `Missing asset: ${path}`)
}
const html = await readFile(resolve(root, 'index.html'), 'utf8')
const urls = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map((match) => match[1])
assert.ok(urls.some((url) => url.startsWith(`${info.base}assets/`) && url.endsWith('.js')))
assert.ok(urls.some((url) => url.startsWith(`${info.base}assets/`) && url.endsWith('.css')))
for (const url of urls) {
  assert.ok(url.startsWith(info.base), `Asset escapes the Pages subpath: ${url}`)
  assert.ok((await stat(resolve(root, url.slice(info.base.length)))).isFile(), `Missing HTML asset: ${url}`)
}
console.log(
  'Production build verified: 20 situations, 200 points, 20 unique scene images, correct Pages asset paths.',
)
