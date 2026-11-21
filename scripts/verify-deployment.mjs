import assert from 'node:assert/strict'

const argument = process.argv[2]
assert.ok(argument, 'Usage: node scripts/verify-deployment.mjs <public-site-url>')
const base = new URL(argument.endsWith('/') ? argument : `${argument}/`)
const revision = process.env.GITHUB_SHA

async function get(path) {
  const url = new URL(path, base)
  if (revision) url.searchParams.set('revision', revision)
  const response = await fetch(url, {
    headers: { 'cache-control': 'no-cache' },
    signal: AbortSignal.timeout(20_000),
  })
  assert.ok(response.ok, `${response.status} ${url}`)
  return response
}

async function verify() {
  const info = await (await get('quest-info.json')).json()
  assert.equal(info.scenarioCount, 20)
  assert.equal(info.maxScore, 200)
  assert.equal(info.base, base.pathname)
  if (revision) assert.equal(info.revision, revision, 'The deployed site is still serving an older commit')
  const html = await (await get('./')).text()
  assert.ok(html.includes('id="root"'), 'Missing React entry point')
  const assetPaths = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map((match) => match[1])
  assert.ok(
    assetPaths.some((path) => path.endsWith('.js')),
    'Missing JavaScript bundle',
  )
  assert.ok(
    assetPaths.some((path) => path.endsWith('.css')),
    'Missing stylesheet',
  )
  await Promise.all(
    [...new Set([...assetPaths, ...info.assets])].map(async (path) => {
      const response = await get(path)
      assert.ok((await response.arrayBuffer()).byteLength > 0, `Empty deployed asset: ${path}`)
    }),
  )
}

for (let attempt = 1; attempt <= 6; attempt++) {
  try {
    await verify()
    console.log(
      `Public GitHub Pages site verified: ${base.href} (20 situations, 200 points, all images and bundles accessible)`,
    )
    process.exit(0)
  } catch (error) {
    if (attempt === 6) throw error
    console.warn(`Pages propagation check ${attempt}/6: ${error.message}. Retrying in 15 seconds.`)
    await new Promise((resolve) => setTimeout(resolve, 15_000))
  }
}
