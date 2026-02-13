/** @jest-environment node */
import { commandRegistry } from '@open-mercato/shared/lib/commands/registry'
import { PosPayment, PosCart } from '../../data/entities'

jest.mock('@open-mercato/shared/lib/i18n/server', () => ({
    resolveTranslations: async () => ({
        locale: 'en',
        dict: {},
        t: (key: string) => key,
        translate: (key: string) => key,
    }),
}))

jest.mock('@open-mercato/shared/lib/commands/flush', () => ({
    withAtomicFlush: jest.fn((em, callbacks) => Promise.all(callbacks.map((cb: any) => cb()))),
}))

jest.mock('@open-mercato/shared/lib/commands/helpers', () => ({
    emitCrudSideEffects: jest.fn(),
    emitCrudUndoSideEffects: jest.fn(),
    buildChanges: jest.fn(),
}))

describe('pos payment commands', () => {
    beforeAll(async () => {
        commandRegistry.clear?.()
        await import('../payments')
    })

    const createCommand = () => commandRegistry.get('pos.payment.record')

    const mockOrgId = '00000000-0000-4000-a000-000000000001'
    const mockTenantId = '00000000-0000-4000-a000-000000000002'
    const mockSessionId = '00000000-0000-4000-a000-000000000003'
    const mockCartId = '00000000-0000-4000-a000-000000000004'

    const createMockCtx = (mockEm: any) => ({
        container: {
            resolve: jest.fn((key) => {
                if (key === 'em') return mockEm
                if (key === 'dataEngine') return {}
                return null
            }),
        },
        auth: { organizationId: mockOrgId, tenantId: mockTenantId },
    })

    it('successfully records an exact cash payment', async () => {
        const cmd = createCommand()
        const mockCart = {
            id: mockCartId,
            organizationId: mockOrgId,
            tenantId: mockTenantId,
            status: 'open',
            grandAmount: '100.0000',
            amountReturn: '0.0000',
        }
        const mockSession = { id: mockSessionId, status: 'open' }

        const mockEm = {
            fork: jest.fn().mockReturnThis(),
            findOne: jest.fn((entity, filter) => {
                if (entity === PosCart) return Promise.resolve(mockCart)
                if (entity === PosCart) return Promise.resolve(mockCart) // double check
                return Promise.resolve(mockSession)
            }),
            find: jest.fn().mockResolvedValue([]), // No previous payments
            create: jest.fn().mockReturnValue({ id: 'payment-1', organizationId: mockOrgId, tenantId: mockTenantId }),
            persist: jest.fn(),
        }

        const input = {
            organizationId: mockOrgId,
            tenantId: mockTenantId,
            sessionId: mockSessionId,
            cartId: mockCartId,
            method: 'cash' as const,
            amount: '100.0000',
            currencyCode: 'USD',
        }

        const result = await cmd?.execute(input, createMockCtx(mockEm) as any)
        expect(result).toEqual({ id: 'payment-1', cartId: mockCartId })
        expect(mockEm.create).toHaveBeenCalledWith(PosPayment, expect.objectContaining({
            amount: '100.0000',
            changeAmount: '0.0000',
        }))
        expect(mockCart.amountReturn).toBe('0.0000')
    })

    it('calculates change for cash overpayment', async () => {
        const cmd = createCommand()
        const mockCart = {
            id: mockCartId,
            organizationId: mockOrgId,
            tenantId: mockTenantId,
            status: 'open',
            grandAmount: '47.5000',
            amountReturn: '0.0000',
        }

        const mockEm = {
            fork: jest.fn().mockReturnThis(),
            findOne: jest.fn().mockResolvedValue(mockCart),
            find: jest.fn().mockResolvedValue([]),
            create: jest.fn().mockReturnValue({ id: 'payment-1' }),
            persist: jest.fn(),
        }

        const input = {
            organizationId: mockOrgId,
            tenantId: mockTenantId,
            sessionId: mockSessionId,
            cartId: mockCartId,
            method: 'cash' as const,
            amount: '50.0000',
            currencyCode: 'USD',
        }

        await cmd?.execute(input, createMockCtx(mockEm) as any)
        expect(mockEm.create).toHaveBeenCalledWith(PosPayment, expect.objectContaining({
            amount: '50.0000',
            changeAmount: '2.5000',
        }))
        expect(mockCart.amountReturn).toBe('2.5000')
    })

    it('does not calculate change for card overpayment', async () => {
        const cmd = createCommand()
        const mockCart = {
            id: mockCartId,
            organizationId: mockOrgId,
            tenantId: mockTenantId,
            status: 'open',
            grandAmount: '47.5000',
            amountReturn: '0.0000',
        }

        const mockEm = {
            fork: jest.fn().mockReturnThis(),
            findOne: jest.fn().mockResolvedValue(mockCart),
            find: jest.fn().mockResolvedValue([]),
            create: jest.fn().mockReturnValue({ id: 'payment-1' }),
            persist: jest.fn(),
        }

        const input = {
            organizationId: mockOrgId,
            tenantId: mockTenantId,
            sessionId: mockSessionId,
            cartId: mockCartId,
            method: 'card' as const,
            amount: '50.0000',
            currencyCode: 'USD',
        }

        await cmd?.execute(input, createMockCtx(mockEm) as any)
        expect(mockEm.create).toHaveBeenCalledWith(PosPayment, expect.objectContaining({
            amount: '50.0000',
            changeAmount: '0.0000',
        }))
        expect(mockCart.amountReturn).toBe('0.0000')
    })

    it('accumulates amountReturn for multiple payments', async () => {
        const cmd = createCommand()
        const mockCart = {
            id: mockCartId,
            organizationId: mockOrgId,
            tenantId: mockTenantId,
            status: 'open',
            grandAmount: '100.0000',
            amountReturn: '0.0000',
        }

        const existingPayment = { amount: '60.0000', changeAmount: '0.0000' }

        const mockEm = {
            fork: jest.fn().mockReturnThis(),
            findOne: jest.fn().mockResolvedValue(mockCart),
            find: jest.fn().mockResolvedValue([existingPayment]),
            create: jest.fn().mockReturnValue({ id: 'payment-2' }),
            persist: jest.fn(),
        }

        const input = {
            organizationId: mockOrgId,
            tenantId: mockTenantId,
            sessionId: mockSessionId,
            cartId: mockCartId,
            method: 'cash' as const,
            amount: '50.0000',
            currencyCode: 'USD',
        }

        // Remaining needed was 40. Paid 50. Change 10.
        await cmd?.execute(input, createMockCtx(mockEm) as any)
        expect(mockEm.create).toHaveBeenCalledWith(PosPayment, expect.objectContaining({
            amount: '50.0000',
            changeAmount: '10.0000',
        }))
        expect(mockCart.amountReturn).toBe('10.0000')
    })

    it('supports undoing a payment', async () => {
        const cmd = createCommand()
        const mockPayment = { id: 'payment-1', organizationId: mockOrgId, tenantId: mockTenantId }
        const mockCart = { id: mockCartId, amountReturn: '10.0000' }

        const mockEm = {
            fork: jest.fn().mockReturnThis(),
            findOne: jest.fn((entity, filter) => {
                if (entity === PosPayment) return Promise.resolve(mockPayment)
                return Promise.resolve(mockCart)
            }),
            remove: jest.fn(),
        }

        const logEntry = {
            payload: {
                undo: {
                    payment: { id: 'payment-1' },
                    cartBefore: { id: mockCartId, amountReturn: '0.0000' }
                }
            }
        }

        await cmd?.undo?.({ ctx: createMockCtx(mockEm) as any, logEntry: logEntry as any })
        expect(mockEm.remove).toHaveBeenCalledWith(mockPayment)
        expect(mockCart.amountReturn).toBe('0.0000')
    })
})
