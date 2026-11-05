/**
 * Shared real-Loader composition helper: mounts the dsh-filable host half plus
 * the real webserver (prior art: packages/host/webserver/tests/webserver.spec.ts)
 * so tests exercise the user-visible HTTP surface over real sockets.
 * A test-only sessions stub provides header.cwd so the host's authoritative
 * workspace resolution works in the composition.
 */
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import Include from '@deepseek-ai/cordis-plugin-include'
import HttpServer from '@deepseek-ai/dsh-host-webserver'
import * as dshFilable from '../dsh/index.js'
import * as sessionsStub from './sessions-stub.js'

export interface Composition {
  context: Context
  port: number
  /** Test workspace root; uploads land in <workspace>/sessionfiles/. */
  workspace: string
  teardown: () => Promise<void>
}

export async function loadComposition(opts: { maxBytes?: number } = {}): Promise<Composition> {
  const root = await mkdtemp(join(tmpdir(), 'dsh-filable-up-'))
  const workspace = join(root, 'workspace')
  const configPath = join(root, 'cordis.yml')
  const rows = [
    "- name: 'sessions-stub'",
    '  config:',
    `    cwd: ${JSON.stringify(workspace)}`,
    "- name: 'dsh-filable'",
    '  config:',
    ...(opts.maxBytes !== undefined ? [`    maxBytes: ${String(opts.maxBytes)}`] : []),
    "- name: '@deepseek-ai/dsh-host-webserver'",
    '  config:',
    "    host: '127.0.0.1'",
    '    port: 0',
    '',
  ]
  await writeFile(configPath, rows.join('\n'))
  const context = new Context()
  context.baseUrl = pathToFileURL(root).href + '/'
  await context.plugin(Loader)
  context.loader.builtins.include = Include
  const modules = new Map<string, unknown>([
    ['dsh-filable', dshFilable],
    ['@deepseek-ai/dsh-host-webserver', HttpServer],
    ['sessions-stub', sessionsStub],
  ])
  context.loader.internal = {
    version: 'v2',
    async import(specifier: string) {
      if (!modules.has(specifier)) throw new Error(`unexpected Loader import: ${specifier}`)
      return modules.get(specifier)
    },
  } as unknown as NonNullable<typeof context.loader.internal>
  await context.loader.create({
    name: 'cordis:include',
    config: { path: pathToFileURL(configPath).href },
  })
  await context.loader.await()
  const port = Number((context as unknown as { webServer: { port: number } }).webServer.port)
  return {
    context,
    port,
    workspace,
    teardown: async () => {
      await context.fiber.dispose()
      await rm(root, { recursive: true, force: true })
    },
  }
}
