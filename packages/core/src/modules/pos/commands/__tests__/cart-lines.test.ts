/** @jest-environment node */
import { commandRegistry } from '@open-mercato/shared/lib/commands/registry'
import { PosCartLine } from '../../data/entities'

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

describe('pos cart line commands', () => {
    beforeAll(async () => {
        commandRegistry.clear?.()
        await import('../cart-lines')
    })

    const addCommand = () => commandRegistry.get('pos.cart.line.add')
    const updateCommand = () => commandRegistry.get('pos.cart.line.update')
    const deleteCommand = () => commandRegistry.get('pos.cart.line.delete')

    const mockEm = {
        fork: jest.fn().mockReturnThis(),
        create: jest.fn().mockImplementation((entity, data) => ({ ...data, id: 'line-1' })),
        persist: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
    }

    const mockDataEngine = {}
    const mockCtx = {
        container: {
            resolve: jest.fn((key) => {
                if (key === 'em') return mockEm
                if (key === 'dataEngine') return mockDataEngine
                return null
            }),
        },
        auth: { userId: 'user-1' },
        organizationId: 'org-1',
        tenantId: 'tenant-1',
    }

    it('successfully adds a cart line', async () => {
        const cmd = addCommand()
        expect(cmd).toBeDefined()

        mockEm.findOne.mockResolvedValueOnce({ id: 'cart-1', organizationId: 'org-1', tenantId: 'tenant-1' }) // requirePosCart

        const input = {
            organizationId: 'org-1',
            tenantId: 'tenant-1',
            cartId: 'cart-1',
            productId: 'prod-1',
            name: 'Test Product',
            quantity: '2',
            unitPrice: '10.00',
            taxAmount: '1.00',
            totalAmount: '21.00',
        }

        const result = await cmd?.execute(input, mockCtx as any)
        expect(result).toEqual({ id: 'line-1' })
        expect(mockEm.create).toHaveBeenCalledWith(PosCartLine, expect.objectContaining(input))
        expect(mockEm.persist).toHaveBeenCalled()
    })

    it('successfully updates a cart line', async () => {
        const cmd = updateCommand()
        expect(cmd).toBeDefined()

        const existingLine = {
            id: 'line-1',
            organizationId: 'org-1',
            tenantId: 'tenant-1',
            name: 'Old Name',
        }
        mockEm.findOne.mockResolvedValue(existingLine)

        const input = {
            id: 'line-1',
            name: 'New Name',
        }

        const result = await cmd?.execute(input, mockCtx as any)
        expect(result).toEqual({ id: 'line-1' })
        expect(existingLine.name).toBe('New Name')
    })

    it('successfully deletes a cart line', async () => {
        const cmd = deleteCommand()
        expect(cmd).toBeDefined()

        const existingLine = {
            id: 'line-1',
            organizationId: 'org-1',
            tenantId: 'tenant-1',
            deletedAt: null,
        }
        mockEm.findOne.mockResolvedValue(existingLine)

        const input = { id: 'line-1' }

        const result = await cmd?.execute(input, mockCtx as any)
        expect(result).toEqual({ id: 'line-1' })
        expect(existingLine.deletedAt).toBeInstanceOf(Date)
    })

    it('captures after snapshot for add and supports undo', async () => {
        const cmd = addCommand()

        const mockLine = {
            id: 'line-1',
            organizationId: 'org-1',
            tenantId: 'tenant-1',
            cartId: 'cart-1',
            productId: 'prod-1',
            name: 'Test Product',
            quantity: '2',
            unitPrice: '10.00',
            taxAmount: '1.00',
            totalAmount: '21.00',
        }

        mockEm.findOne.mockResolvedValue(mockLine)

        const result = { id: 'line-1' }
        const snapshot = await cmd?.captureAfter?.({}, result, mockCtx as any)

        expect(snapshot).toEqual(expect.objectContaining(mockLine))

        // Test Undo
        const logEntry = {
            payload: {
                undo: {
                    after: snapshot,
                },
            },
        }

        await cmd?.undo?.({ ctx: mockCtx as any, logEntry: logEntry as any })
        expect(mockEm.remove).toHaveBeenCalledWith(mockLine)
    })
})
