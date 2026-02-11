import type { CommandRuntimeContext } from '@open-mercato/shared/lib/commands'
import { CrudHttpError } from '@open-mercato/shared/lib/crud/errors'
import { ensureOrganizationScope } from '@open-mercato/shared/lib/commands/scope'
import { extractUndoPayload } from '@open-mercato/shared/lib/commands/undo'
import type { EntityManager } from '@mikro-orm/postgresql'
import { PosRegister, PosSession } from '../data/entities'

export function ensureTenantScope(ctx: CommandRuntimeContext, tenantId: string): void {
    const currentTenant = ctx.auth?.tenantId ?? null
    if (currentTenant && currentTenant !== tenantId) {
        throw new CrudHttpError(403, { error: 'Forbidden' })
    }
}

export { ensureOrganizationScope, extractUndoPayload }

export async function requireRegister(
    em: EntityManager,
    registerId: string,
    message = 'Register not found',
): Promise<PosRegister> {
    const register = await em.findOne(PosRegister, { id: registerId, deletedAt: null })
    if (!register) throw new CrudHttpError(404, { error: message })
    return register
}

export async function requirePosSession(
    em: EntityManager,
    sessionId: string,
    message = 'POS Session not found',
): Promise<PosSession> {
    const session = await em.findOne(PosSession, { id: sessionId, deletedAt: null })
    if (!session) throw new CrudHttpError(404, { error: message })
    return session
}
