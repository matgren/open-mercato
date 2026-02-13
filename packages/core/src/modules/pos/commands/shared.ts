import type { CommandRuntimeContext } from '@open-mercato/shared/lib/commands'
import { CrudHttpError } from '@open-mercato/shared/lib/crud/errors'
import { ensureOrganizationScope } from '@open-mercato/shared/lib/commands/scope'
import { extractUndoPayload } from '@open-mercato/shared/lib/commands/undo'
import type { EntityManager } from '@mikro-orm/postgresql'
import { PosCart, PosCartLine, PosRegister, PosSession } from '../data/entities'

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

export async function requirePosCart(
    em: EntityManager,
    cartId: string,
    message = 'POS Cart not found',
): Promise<PosCart> {
    const cart = await em.findOne(PosCart, { id: cartId, deletedAt: null })
    if (!cart) throw new CrudHttpError(404, { error: message })
    return cart
}

export async function requirePosCartLine(
    em: EntityManager,
    lineId: string,
    message = 'POS Cart Line not found',
): Promise<PosCartLine> {
    const line = await em.findOne(PosCartLine, { id: lineId, deletedAt: null })
    if (!line) throw new CrudHttpError(404, { error: message })
    return line
}

