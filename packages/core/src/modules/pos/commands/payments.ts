import type { EntityManager } from '@mikro-orm/postgresql'
import type { RequiredEntityData } from '@mikro-orm/core'
import type { CommandHandler } from '@open-mercato/shared/lib/commands'
import { registerCommand } from '@open-mercato/shared/lib/commands'
import { withAtomicFlush } from '@open-mercato/shared/lib/commands/flush'
import { emitCrudSideEffects, emitCrudUndoSideEffects } from '@open-mercato/shared/lib/commands/helpers'
import type { DataEngine } from '@open-mercato/shared/lib/data/engine'
import type { CrudIndexerConfig } from '@open-mercato/shared/lib/crud/types'
import { E } from '#generated/entities.ids.generated'
import { PosPayment, PosCart } from '../data/entities'
import {
    posPaymentCreateSchema,
    type PosPaymentCreateInput,
} from '../data/validators'
import {
    ensureOrganizationScope,
    ensureTenantScope,
    requirePosCart,
    requirePosSession,
    extractUndoPayload,
} from './shared'
import { CrudHttpError } from '@open-mercato/shared/lib/crud/errors'

const paymentCrudIndexer: CrudIndexerConfig<PosPayment> = {
    entityType: E.pos.pos_payment,
}

export type PaymentSnapshot = {
    id: string
    organizationId: string
    tenantId: string
    sessionId: string
    cartId: string
    method: string
    amount: string
    currencyCode: string
    status: string
    changeAmount: string
}

export type CartPaymentSnapshot = {
    id: string
    amountReturn: string
}

export type PaymentUndoPayload = {
    payment?: PaymentSnapshot | null
    cart?: CartPaymentSnapshot | null
}

export function loadPaymentSnapshot(payment: PosPayment): PaymentSnapshot {
    return {
        id: payment.id,
        organizationId: payment.organizationId,
        tenantId: payment.tenantId,
        sessionId: payment.sessionId,
        cartId: payment.cartId,
        method: payment.method,
        amount: payment.amount,
        currencyCode: payment.currencyCode,
        status: payment.status,
        changeAmount: payment.changeAmount,
    }
}

export function loadCartPaymentSnapshot(cart: PosCart): CartPaymentSnapshot {
    return {
        id: cart.id,
        amountReturn: cart.amountReturn,
    }
}

export const recordPaymentCommand: CommandHandler<PosPaymentCreateInput, { id: string, cartId: string }> = {
    id: 'pos.payment.record',
    isUndoable: true,
    async execute(input, ctx) {
        const validated = posPaymentCreateSchema.parse(input)
        ensureOrganizationScope(ctx, validated.organizationId)
        ensureTenantScope(ctx, validated.tenantId)

        const em = (ctx.container.resolve('em') as EntityManager).fork()

        const cart = await requirePosCart(em, validated.cartId)
        if (cart.status !== 'open') {
            throw new CrudHttpError(400, { error: `Cannot record payment for cart in status: ${cart.status}` })
        }

        await requirePosSession(em, validated.sessionId)

        // Calculate change if cash
        const existingPayments = await em.find(PosPayment, { cartId: cart.id, deletedAt: null })
        const totalAppliedAlready = existingPayments.reduce(
            (acc, p) => acc + (parseFloat(p.amount) - parseFloat(p.changeAmount)),
            0
        )
        const balanceRemaining = parseFloat(cart.grandAmount) - totalAppliedAlready

        let changeAmount = '0.0000'
        const currentPaymentAmount = parseFloat(validated.amount)
        if (validated.method === 'cash' && currentPaymentAmount > balanceRemaining) {
            changeAmount = Math.max(0, currentPaymentAmount - Math.max(0, balanceRemaining)).toFixed(4)
        }

        const now = new Date()
        const payment = em.create(PosPayment, {
            ...validated,
            changeAmount,
            createdAt: now,
            updatedAt: now,
        } as RequiredEntityData<PosPayment>)

        await withAtomicFlush(em, [
            () => { em.persist(payment) },
            () => {
                const totalReturn = existingPayments.reduce(
                    (acc, p) => acc + parseFloat(p.changeAmount),
                    0
                ) + parseFloat(changeAmount)
                cart.amountReturn = totalReturn.toFixed(4)
                cart.updatedAt = now
            }
        ], { transaction: true, label: 'pos.payment.record' })

        const de = ctx.container.resolve('dataEngine') as DataEngine
        await emitCrudSideEffects({
            dataEngine: de,
            action: 'created',
            entity: payment,
            identifiers: {
                id: payment.id,
                organizationId: payment.organizationId,
                tenantId: payment.tenantId,
            },
            indexer: paymentCrudIndexer,
        })

        return { id: payment.id, cartId: cart.id }
    },
    async prepare(input, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const cart = await em.findOne(PosCart, { id: input.cartId })
        return {
            cartBefore: cart ? loadCartPaymentSnapshot(cart) : null
        }
    },
    async captureAfter(input, result, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const payment = await em.findOne(PosPayment, { id: result.id })
        const cart = await em.findOne(PosCart, { id: result.cartId })
        return {
            payment: payment ? loadPaymentSnapshot(payment) : null,
            cart: cart ? loadCartPaymentSnapshot(cart) : null,
        }
    },
    async buildLog({ input, result, snapshots }) {
        const after = snapshots.after as { payment: PaymentSnapshot, cart: CartPaymentSnapshot }
        return {
            tenantId: input.tenantId,
            organizationId: input.organizationId,
            resourceKind: E.pos.pos_payment,
            resourceId: result.id,
            snapshotBefore: snapshots.before,
            snapshotAfter: after,
        }
    },
    async undo({ ctx, logEntry }) {
        const payload = extractUndoPayload<{ payment: PaymentSnapshot, cart: CartPaymentSnapshot, cartBefore: CartPaymentSnapshot }>(logEntry)
        if (!payload?.payment?.id || !payload?.cartBefore) return

        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const payment = await em.findOne(PosPayment, { id: payload.payment.id })
        const cart = await em.findOne(PosCart, { id: payload.cartBefore.id })

        if (payment && cart) {
            await withAtomicFlush(em, [
                () => { em.remove(payment) },
                () => {
                    cart.amountReturn = payload.cartBefore!.amountReturn
                    cart.updatedAt = new Date()
                }
            ], { transaction: true, label: 'pos.payment.record.undo' })

            const de = ctx.container.resolve('dataEngine') as DataEngine
            await emitCrudUndoSideEffects({
                dataEngine: de,
                action: 'deleted',
                entity: payment,
                identifiers: {
                    id: payment.id,
                    organizationId: payment.organizationId,
                    tenantId: payment.tenantId,
                },
                indexer: paymentCrudIndexer,
            })
        }
    }
}

registerCommand(recordPaymentCommand)
