/**
 * Test-only 'sessions' service stub: provides get(id).header.cwd for every id
 * except 'unknown', so the host's authoritative workspace resolution works in
 * the composition without the real SessionStore.
 */
import { Service } from '@deepseek-ai/cordis'

export function apply(ctx: any, config: any): void {
  const svc = new Service(ctx, 'sessions')
  svc.get = (id: string) => {
    if (id === 'unknown') return undefined
    return { header: { cwd: config && config.cwd } }
  }
}
