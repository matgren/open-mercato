/** @jest-environment node */
import { commandRegistry } from '@open-mercato/shared/lib/commands/registry'
import { PosCart, PosPayment, PosReceipt, PosRegister, PosSession } from '../../data/entities'

// Mock dependencies
jest.mock('@open-mercato/shared/lib/i18n/server', () => ({
    resolveTranslations: async () => ({
        locale: 'en',
        dict: {},
        t: (key: string) => key,
        translate: (key: string) => key,
    }),
}))

jest.mock('@open-mercato/shared/lib/commands/flush', () => ({
    withAtomicFlush: jest.fn((em, cb) => cb(em)),
}))

describe('pos receipt commands', () => {
    beforeAll(async () => {
        commandRegistry.clear?.()
        await import('../receipts')
    })

    const createCommand = () => commandRegistry.get('pos.receipt.generate')

    const mockOrgId = '00000000-0000-4000-a000-000000000001'
    const mockTenantId = '00000000-0000-4000-a000-000000000002'
    const mockSessionId = '00000000-0000-4000-a000-000000000003'
    const mockCartId = '00000000-0000-4000-a000-000000000004'
    const mockRegisterId = '00000000-0000-4000-a000-000000000005'

    const createMockCtx = (mockEm: any) => ({
        container: {
            resolve: jest.fn((key) => {
                if (key === 'em') return mockEm
                return null
            }),
        },
        auth: { organizationId: mockOrgId, tenantId: mockTenantId },
    })

    it('successfully generates a receipt for a completed cart', async () => {
        const cmd = createCommand()

        const mockCart = {
            id: mockCartId,
            organizationId: mockOrgId,
            tenantId: mockTenantId,
            sessionId: mockSessionId,
            status: 'completed',
            subtotalAmount: '100.0000',
            taxAmount: '10.0000',
            grandAmount: '110.0000',
            amountReturn: '0.0000',
            currencyCode: 'USD',
            lines: {
                getItems: () => [
                    {
                        name: 'Item 1',
                        quantity: '1',
                        unitPrice: '100.0000',
                        totalAmount: '100.0000',
                    },
                ],
            },
        }

        const mockSession = {
            id: mockSessionId,
            registerId: mockRegisterId,
            openedAt: new Date(),
        }

        const mockRegister = {
            id: mockRegisterId,
            name: 'Reg 1',
            code: 'R1',
        }

        const mockPayments = [
            {
                method: 'cash',
                amount: '110.0000',
                changeAmount: '0.0000',
            },
        ]

        const mockEm = {
            fork: jest.fn().mockReturnThis(),
            findOne: jest.fn((entity, filter) => {
                if (entity === PosCart) return Promise.resolve(mockCart)
                if (entity === PosSession) return Promise.resolve(mockSession)
                if (entity === PosRegister) return Promise.resolve(mockRegister)
                return Promise.resolve(null)
            }),
            find: jest.fn((entity) => {
                if (entity === PosPayment) return Promise.resolve(mockPayments)
                return Promise.resolve([])
            }),
            create: jest.fn((cls, data) => ({
                id: 'receipt-1',
                receiptNumber: data.receiptNumber,
                ...data,
            })),
            persist: jest.fn(),
        }

        const input = {
            organizationId: mockOrgId,
            tenantId: mockTenantId,
            cartId: mockCartId,
            deliveryMethod: 'print' as const,
        }

        const result = await cmd?.execute(input, createMockCtx(mockEm) as any)

        expect(result).toMatchObject({
            receiptId: 'receipt-1',
            receiptNumber: expect.stringMatching(/^REC-/),
        })

        expect(mockEm.create).toHaveBeenCalledWith(
            PosReceipt,
            expect.objectContaining({
                cartId: mockCartId,
                deliveryMethod: 'print',
                payloadSnapshot: expect.objectContaining({
                    cart: expect.objectContaining({ grandAmount: '110.0000' }),
                    register: expect.objectContaining({ code: 'R1' }),
                }),
            })
        )
    })

    it('throws error if cart is not completed', async () => {
        const cmd = createCommand()
        const mockCart = {
            id: mockCartId,
            status: 'open', // Not completed
        }

        const mockEm = {
            fork: jest.fn().mockReturnThis(),
            findOne: jest.fn().mockResolvedValue(mockCart),
        }

        const input = {
            organizationId: mockOrgId,
            tenantId: mockTenantId,
            cartId: mockCartId,
            deliveryMethod: 'print' as const,
        }

        await expect(
            cmd?.execute(input, createMockCtx(mockEm) as any)
        ).rejects.toThrow(/Cart must be completed/)
    })
})
