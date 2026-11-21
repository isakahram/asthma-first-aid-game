import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { MAX_SCORE, SCENARIO_COUNT, scenarios } from './src/data'

const base = '/asthma-first-aid-game/'

export default defineConfig({
  base,
  plugins: [
    react(),
    {
      name: 'quest-publication-manifest',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'quest-info.json',
          source: JSON.stringify(
            {
              version: 2,
              base,
              scenarioCount: SCENARIO_COUNT,
              maxScore: MAX_SCORE,
              revision: process.env.GITHUB_SHA ?? 'local',
              scenarios: scenarios.map(({ id, image }) => ({ id, image })),
              assets: ['images/school-friends.webp', ...scenarios.map((scene) => scene.image)],
            },
            null,
            2,
          ),
        })
        this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' })
      },
    },
  ],
  server: { host: '0.0.0.0', allowedHosts: ['.e2b.app', 'localhost'] },
  preview: { host: '0.0.0.0', allowedHosts: ['.e2b.app', 'localhost'] },
})
