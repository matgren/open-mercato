import { z } from 'zod'
import type { CommandHandler } from '@open-mercato/shared/lib/commands'
import { registerCommand } from '@open-mercato/shared/lib/commands'
import type { EntityManager } from '@mikro-orm/postgresql'
import { buildChanges, emitCrudSideEffects, emitCrudUndoSideEffects } from '@open-mercato/shared/lib/commands/helpers'
import { withAtomicFlush } from '@open-mercato/shared/lib/commands/flush'
import type { DataEngine } from '@open-mercato/shared/lib/data/engine'
import type { CrudIndexerConfig } from '@open-mercato/shared/lib/crud/types'
import { E } from '#generated/entities.ids.generated'
import { User } from '../../auth/data/entities'
import { PosSession } from '../data/entities'
import {
    posSessionCreateSchema,
    posSessionUpdateSchema,
    type PosSessionCreateInput,
    type PosSessionUpdateInput,
} from '../data/validators'
import { ensureOrganizationScope, ensureTenantScope, extractUndoPayload, requirePosSession } from './shared'

const posSessionCrudIndexer: CrudIndexerConfig<PosSession> = {
    entityType: E.pos.pos_session,
}

export type PosSessionSnapshot = {
    id: string
    organizationId: string
    tenantId: string
    registerId: string
    openedByUserId: string
    closedByUserId: string | null
    status: 'open' | 'closed' | 'suspended'
    openedAt: Date
    closedAt: Date | null
    openingFloatAmount: string
    closingCashAmount: string | null
    expectedCashAmount: string | null
    varianceAmount: string | null
    currencyCode: string
    metadata: Record<string, unknown> | null
}

export type PosSessionUndoPayload = {
    before?: PosSessionSnapshot | null
    after?: PosSessionSnapshot | null
}

export function loadPosSessionSnapshot(session: PosSession): PosSessionSnapshot {
    return {
        id: session.id,
        organizationId: session.organizationId,
        tenantId: session.tenantId,
        registerId: session.registerId,
        openedByUserId: session.openedByUserId,
        closedByUserId: session.closedByUserId ?? null,
        status: session.status,
        openedAt: session.openedAt,
        closedAt: session.closedAt ?? null,
        openingFloatAmount: session.openingFloatAmount,
        closingCashAmount: session.closingCashAmount ?? null,
        expectedCashAmount: session.expectedCashAmount ?? null,
        varianceAmount: session.varianceAmount ?? null,
        currencyCode: session.currencyCode,
        metadata: session.metadata ?? null,
    }
}

export const createPosSessionCommand: CommandHandler<PosSessionCreateInput, { id: string }> = {
    id: 'pos.session.create',
    isUndoable: true,
    async execute(input, ctx) {
        ensureOrganizationScope(ctx, input.organizationId)
        ensureTenantScope(ctx, input.tenantId)

        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const now = new Date()
        const session = em.create(PosSession, {
            ...input,
            status: 'open', // New sessions are always open
            openedAt: now,
            createdAt: now,
            updatedAt: now,
        } as any)

        await withAtomicFlush(em, [
            () => { em.persist(session) }
        ], { transaction: true, label: 'pos.session.create' })

        const de = ctx.container.resolve('dataEngine') as DataEngine
        await emitCrudSideEffects({
            dataEngine: de,
            action: 'created',
            entity: session,
            identifiers: {
                id: session.id,
                organizationId: session.organizationId,
                tenantId: session.tenantId,
            },
            indexer: posSessionCrudIndexer,
        })

        return { id: session.id }
    },
    async buildLog({ input, result, snapshots }) {
        return {
            tenantId: input.tenantId,
            organizationId: input.organizationId,
            resourceKind: E.pos.pos_session,
            resourceId: result.id,
            snapshotAfter: snapshots.after,
        }
    },
    async captureAfter(input, result, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const session = await em.findOne(PosSession, { id: result.id })
        return session ? loadPosSessionSnapshot(session) : null
    },
    async undo({ ctx, logEntry }) {
        const payload = extractUndoPayload<PosSessionUndoPayload>(logEntry)
        if (!payload?.after?.id) return

        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const session = await em.findOne(PosSession, { id: payload.after.id })
        if (session) {
            await withAtomicFlush(em, [
                () => { em.remove(session) }
            ], { transaction: true, label: 'pos.session.create.undo' })

            const de = ctx.container.resolve('dataEngine') as DataEngine
            await emitCrudUndoSideEffects({
                dataEngine: de,
                action: 'deleted',
                entity: session,
                identifiers: {
                    id: session.id,
                    organizationId: session.organizationId,
                    tenantId: session.tenantId,
                },
                indexer: posSessionCrudIndexer,
            })
        }
    },
}

export const updatePosSessionCommand: CommandHandler<PosSessionUpdateInput, { id: string }> = {
    id: 'pos.session.update',
    isUndoable: true,
    async prepare(input, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const session = await em.findOne(PosSession, { id: input.id })
        return { before: session ? loadPosSessionSnapshot(session) : null }
    },
    async execute(input, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const session = await requirePosSession(em, input.id)
        ensureOrganizationScope(ctx, session.organizationId)
        ensureTenantScope(ctx, session.tenantId)

        await withAtomicFlush(em, [
            () => {
                if (input.registerId !== undefined) session.registerId = input.registerId
                if (input.openedByUserId !== undefined) session.openedByUserId = input.openedByUserId
                if (input.closedByUserId !== undefined) session.closedByUserId = input.closedByUserId
                if (input.status !== undefined) session.status = input.status
                if (input.closedAt !== undefined) session.closedAt = input.closedAt
                if (input.openingFloatAmount !== undefined) session.openingFloatAmount = input.openingFloatAmount
                if (input.closingCashAmount !== undefined) session.closingCashAmount = input.closingCashAmount
                if (input.expectedCashAmount !== undefined) session.expectedCashAmount = input.expectedCashAmount
                if (input.varianceAmount !== undefined) session.varianceAmount = input.varianceAmount
                if (input.currencyCode !== undefined) session.currencyCode = input.currencyCode
                if (input.metadata !== undefined) session.metadata = input.metadata

                session.updatedAt = new Date()
            }
        ], { transaction: true, label: 'pos.session.update' })

        const de = ctx.container.resolve('dataEngine') as DataEngine
        await emitCrudSideEffects({
            dataEngine: de,
            action: 'updated',
            entity: session,
            identifiers: {
                id: session.id,
                organizationId: session.organizationId,
                tenantId: session.tenantId,
            },
            indexer: posSessionCrudIndexer,
        })

        return { id: session.id }
    },
    async buildLog({ result, snapshots }) {
        const before = snapshots.before as PosSessionSnapshot
        const after = snapshots.after as PosSessionSnapshot
        return {
            tenantId: after.tenantId,
            organizationId: after.organizationId,
            resourceKind: E.pos.pos_session,
            resourceId: result.id,
            snapshotBefore: before,
            snapshotAfter: after,
            changes: buildChanges(before, after, [
                'registerId', 'openedByUserId', 'closedByUserId', 'status',
                'closedAt', 'openingFloatAmount', 'closingCashAmount',
                'expectedCashAmount', 'varianceAmount', 'currencyCode',
            ]),
        }
    },
    async captureAfter(input, result, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const session = await em.findOne(PosSession, { id: result.id })
        return session ? loadPosSessionSnapshot(session) : null
    },
    async undo({ ctx, logEntry }) {
        const payload = extractUndoPayload<PosSessionUndoPayload>(logEntry)
        if (!payload?.before || !payload?.after) return

        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const session = await em.findOne(PosSession, { id: payload.after.id })
        if (session) {
            await withAtomicFlush(em, [
                () => {
                    Object.assign(session, payload.before)
                    session.updatedAt = new Date()
                }
            ], { transaction: true, label: 'pos.session.update.undo' })

            const de = ctx.container.resolve('dataEngine') as DataEngine
            await emitCrudUndoSideEffects({
                dataEngine: de,
                action: 'updated',
                entity: session,
                identifiers: {
                    id: session.id,
                    organizationId: session.organizationId,
                    tenantId: session.tenantId,
                },
                indexer: posSessionCrudIndexer,
            })
        }
    },
}

export const deletePosSessionCommand: CommandHandler<{ id: string }, { id: string }> = {
    id: 'pos.session.delete',
    isUndoable: true,
    async prepare(input, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const session = await em.findOne(PosSession, { id: input.id })
        return { before: session ? loadPosSessionSnapshot(session) : null }
    },
    async execute(input, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const session = await requirePosSession(em, input.id)
        ensureOrganizationScope(ctx, session.organizationId)
        ensureTenantScope(ctx, session.tenantId)

        await withAtomicFlush(em, [
            () => {
                const now = new Date()
                session.deletedAt = now
                session.updatedAt = now
            }
        ], { transaction: true, label: 'pos.session.delete' })

        const de = ctx.container.resolve('dataEngine') as DataEngine
        await emitCrudSideEffects({
            dataEngine: de,
            action: 'deleted',
            entity: session,
            identifiers: {
                id: session.id,
                organizationId: session.organizationId,
                tenantId: session.tenantId,
            },
            indexer: posSessionCrudIndexer,
        })

        return { id: session.id }
    },
    async buildLog({ snapshots, result }) {
        const before = snapshots.before as PosSessionSnapshot
        return {
            tenantId: before.tenantId,
            organizationId: before.organizationId,
            resourceKind: E.pos.pos_session,
            resourceId: result.id,
            snapshotBefore: before,
        }
    },
    async captureAfter() {
        return null
    },
    async undo({ ctx, logEntry }) {
        const payload = extractUndoPayload<PosSessionUndoPayload>(logEntry)
        if (!payload?.before) return

        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const session = await em.findOne(PosSession, { id: payload.before.id })
        if (session) {
            await withAtomicFlush(em, [
                () => {
                    session.deletedAt = null
                    session.updatedAt = new Date()
                }
            ], { transaction: true, label: 'pos.session.delete.undo' })

            const de = ctx.container.resolve('dataEngine') as DataEngine
            await emitCrudUndoSideEffects({
                dataEngine: de,
                action: 'updated',
                entity: session,
                identifiers: {
                    id: session.id,
                    organizationId: session.organizationId,
                    tenantId: session.tenantId,
                },
                indexer: posSessionCrudIndexer,
            })
        }
    },
}

export const openPosSessionCommand: CommandHandler<{ id: string, pin: string }, { id: string }> = {
    id: 'pos.session.open',
    isUndoable: true,
    async prepare(input, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const session = await em.findOne(PosSession, { id: input.id })
        return { before: session ? loadPosSessionSnapshot(session) : null }
    },
    async execute(input, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const session = await requirePosSession(em, input.id)
        ensureOrganizationScope(ctx, session.organizationId)
        ensureTenantScope(ctx, session.tenantId)

        const userId = ctx.auth?.userId
        if (!userId) throw new Error('Authentication is required to open a POS session.')
        const user = await em.findOne(User, { id: userId })
        if (!user || !user.pinHash) throw new Error('User not found or PIN not set up.')

        const bcrypt = ctx.container.resolve('bcrypt')
        const pinMatches = await bcrypt.compare(input.pin, user.pinHash)
        if (!pinMatches) {
            throw new Error('Invalid PIN.')
        }

        if (session.status === 'open') {
            throw new Error('POS session is already open.')
        }

        await withAtomicFlush(em, [
            () => {
                session.status = 'open'
                session.closedAt = null // Clear closedAt if re-opening
                session.openedByUserId = userId
                session.updatedAt = new Date()
            }
        ], { transaction: true, label: 'pos.session.open' })

        const de = ctx.container.resolve('dataEngine') as DataEngine
        await emitCrudSideEffects({
            dataEngine: de,
            action: 'updated', // Treat as an update for side effects
            entity: session,
            identifiers: {
                id: session.id,
                organizationId: session.organizationId,
                tenantId: session.tenantId,
            },
            indexer: posSessionCrudIndexer,
        })

        return { id: session.id }
    },
    async buildLog({ snapshots, result }) {
        const before = snapshots.before as PosSessionSnapshot
        const after = snapshots.after as PosSessionSnapshot
        return {
            tenantId: after.tenantId,
            organizationId: after.organizationId,
            resourceKind: E.pos.pos_session,
            resourceId: result.id,
            snapshotBefore: before,
            snapshotAfter: after,
            changes: buildChanges(before, after, ['status', 'closedAt']),
        }
    },
    async captureAfter(input, result, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const session = await em.findOne(PosSession, { id: result.id })
        return session ? loadPosSessionSnapshot(session) : null
    },
    async undo({ ctx, logEntry }) {
        const payload = extractUndoPayload<PosSessionUndoPayload>(logEntry)
        if (!payload?.before || !payload?.after) return

        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const session = await em.findOne(PosSession, { id: payload.after.id })
        if (session) {
            await withAtomicFlush(em, [
                () => {
                    if (!payload.before) return
                    session.status = payload.before.status
                    session.closedAt = payload.before.closedAt
                    session.updatedAt = new Date()
                }
            ], { transaction: true, label: 'pos.session.open.undo' })

            const de = ctx.container.resolve('dataEngine') as DataEngine
            await emitCrudUndoSideEffects({
                dataEngine: de,
                action: 'updated',
                entity: session,
                identifiers: {
                    id: session.id,
                    organizationId: session.organizationId,
                    tenantId: session.tenantId,
                },
                indexer: posSessionCrudIndexer,
            })
        }
    },
}

export const closePosSessionCommand: CommandHandler<
    { id: string; pin: string, closingCashAmount: string; expectedCashAmount?: string; },
    { id: string }
> = {
    id: 'pos.session.close',
    isUndoable: true,
    async prepare(input, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const session = await em.findOne(PosSession, { id: input.id })
        return { before: session ? loadPosSessionSnapshot(session) : null }
    },
    async execute(input, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const session = await requirePosSession(em, input.id)
        ensureOrganizationScope(ctx, session.organizationId)
        ensureTenantScope(ctx, session.tenantId)

        const userId = ctx.auth?.userId
        if (!userId) throw new Error('Authentication is required to close a POS session.')
        const user = await em.findOne(User, { id: userId })
        if (!user || !user.pinHash) throw new Error('User not found or PIN not set up.')

        const bcrypt = ctx.container.resolve('bcrypt')
        const pinMatches = await bcrypt.compare(input.pin, user.pinHash)
        if (!pinMatches) {
            throw new Error('Invalid PIN.')
        }

        if (session.status === 'closed') {
            throw new Error('POS session is already closed.')
        }

        const variance = (parseFloat(input.closingCashAmount) - parseFloat(session.openingFloatAmount)).toString()

        await withAtomicFlush(em, [
            () => {
                session.status = 'closed'
                session.closedByUserId = userId
                session.closedAt = new Date()
                session.closingCashAmount = input.closingCashAmount
                session.expectedCashAmount = input.expectedCashAmount ?? session.openingFloatAmount
                session.varianceAmount = variance
                session.updatedAt = new Date()
            }
        ], { transaction: true, label: 'pos.session.close' })

        const de = ctx.container.resolve('dataEngine') as DataEngine
        await emitCrudSideEffects({
            dataEngine: de,
            action: 'updated', // Treat as an update for side effects
            entity: session,
            identifiers: {
                id: session.id,
                organizationId: session.organizationId,
                tenantId: session.tenantId,
            },
            indexer: posSessionCrudIndexer,
        })

        return { id: session.id }
    },
    async buildLog({ snapshots, result }) {
        const before = snapshots.before as PosSessionSnapshot
        const after = snapshots.after as PosSessionSnapshot
        return {
            tenantId: after.tenantId,
            organizationId: after.organizationId,
            resourceKind: E.pos.pos_session,
            resourceId: result.id,
            snapshotBefore: before,
            snapshotAfter: after,
            changes: buildChanges(before, after, [
                'status', 'closedByUserId', 'closedAt',
                'closingCashAmount', 'expectedCashAmount', 'varianceAmount',
            ]),
        }
    },
    async captureAfter(input, result, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const session = await em.findOne(PosSession, { id: result.id })
        return session ? loadPosSessionSnapshot(session) : null
    },
    async undo({ ctx, logEntry }) {
        const payload = extractUndoPayload<PosSessionUndoPayload>(logEntry)
        if (!payload?.before || !payload?.after) return

        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const session = await em.findOne(PosSession, { id: payload.after.id })
        if (session) {
            await withAtomicFlush(em, [
                () => {
                    if (!payload.before) return
                    session.status = payload.before.status
                    session.closedByUserId = payload.before.closedByUserId
                    session.closedAt = payload.before.closedAt
                    session.closingCashAmount = payload.before.closingCashAmount
                    session.expectedCashAmount = payload.before.expectedCashAmount
                    session.varianceAmount = payload.before.varianceAmount
                    session.updatedAt = new Date()
                }
            ], { transaction: true, label: 'pos.session.close.undo' })

            const de = ctx.container.resolve('dataEngine') as DataEngine
            await emitCrudUndoSideEffects({
                dataEngine: de,
                action: 'updated',
                entity: session,
                identifiers: {
                    id: session.id,
                    organizationId: session.organizationId,
                    tenantId: session.tenantId,
                },
                indexer: posSessionCrudIndexer,
            })
        }
    },
}

registerCommand(createPosSessionCommand)
registerCommand(updatePosSessionCommand)
registerCommand(deletePosSessionCommand)
registerCommand(openPosSessionCommand)
registerCommand(closePosSessionCommand)
