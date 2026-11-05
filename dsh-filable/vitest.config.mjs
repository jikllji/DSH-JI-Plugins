// dsh-filable vitest config — plain object (no imports), so the config loader
// needs no module resolution from this external directory. Harness workspace
// packages resolve through absolute-path aliases to the vendored lib builds
// (tsconfig.base.json maps the same sources in-repo).
// Cache dirs live in the session workspace so test runs never write into the
// installed profile/vendor trees.
const CACHE = 'Z:/Github_project/Deepseek_Harness/workspacetest/.scratch/dsh-filable/.vitest-cache'

export default {
  cacheDir: CACHE,
  resolve: {
    alias: {
      '@deepseek-ai/cordis': 'Z:/Github_project/Deepseek_Harness/deepseek-harness/vendor/cordis/lib/index.js',
      '@deepseek-ai/cosmokit': 'Z:/Github_project/Deepseek_Harness/deepseek-harness/vendor/cosmokit/lib/index.js',
      '@deepseek-ai/cordis-plugin-loader': 'Z:/Github_project/Deepseek_Harness/deepseek-harness/vendor/loader/lib/index.js',
      '@deepseek-ai/cordis-plugin-include': 'Z:/Github_project/Deepseek_Harness/deepseek-harness/vendor/include/lib/index.js',
      '@deepseek-ai/dsh-host-webserver': 'Z:/Github_project/Deepseek_Harness/deepseek-harness/packages/host/webserver/src/index.ts',
      '@deepseek-ai/schemastery': 'Z:/Github_project/Deepseek_Harness/deepseek-harness/vendor/schemastery/lib/index.mjs',
      'js-yaml': 'Z:/Github_project/Deepseek_Harness/deepseek-harness/node_modules/js-yaml',
    },
  },
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
    pool: 'threads',
  },
}
