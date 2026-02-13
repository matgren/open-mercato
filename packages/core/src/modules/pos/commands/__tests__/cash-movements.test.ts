/** @jest-environment node */
import { commandRegistry } from '@open-mercato/shared/lib/commands/registry'
import { PosCashMovement } from '../../data/entities'

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

describe('pos cash movement commands', () => {
    beforeAll(async () => {
        commandRegistry.clear?.()
        await import('../cash-movements')
    })

    const createCommand = () => commandRegistry.get('pos.cash.movement.create')

    it('successfully creates a cash movement', async () => {
        const cmd = createCommand()
        expect(cmd).toBeDefined()

        const mockEm = {
            fork: jest.fn().mockReturnThis(),
            create: jest.fn().mockReturnValue({ id: 'movement-1', organizationId: 'org-1', tenantId: 'tenant-1' }),
            persist: jest.fn(),
            flush: jest.fn(),
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

        const input = {
            organizationId: 'org-1',
            tenantId: 'tenant-1',
            sessionId: 'session-1',
            type: 'cash_in' as const,
            amount: '100.00',
            reason: 'Opening float',
            createdByUserId: 'user-1',
        }

        const result = await cmd?.execute(input, mockCtx as any)
        expect(result).toEqual({ id: 'movement-1' })
        expect(mockEm.create).toHaveBeenCalledWith(PosCashMovement, expect.objectContaining(input))
        expect(mockEm.persist).toHaveBeenCalled()
    })

    it('captures after snapshot and supports undo', async () => {
        const cmd = createCommand()

        const mockMovement = {
            id: 'movement-1',
            organizationId: 'org-1',
            tenantId: 'tenant-1',
            sessionId: 'session-1',
            type: 'cash_in' as const,
            amount: '100.00',
            reason: 'Opening float',
            reference: null,
            createdByUserId: 'user-1',
        }

        const mockEm = {
            fork: jest.fn().mockReturnThis(),
            findOne: jest.fn().mockResolvedValue(mockMovement),
            remove: jest.fn(),
        }

        const mockCtx = {
            container: {
                resolve: jest.fn().mockReturnValue(mockEm),
            },
        }

        const result = { id: 'movement-1' }
        const snapshot = await cmd?.captureAfter?.({}, result, mockCtx as any)

        expect(snapshot).toEqual(mockMovement)

        // Test Undo
        const logEntry = {
            payload: {
                undo: {
                    after: snapshot,
                },
            },
        }

        await cmd?.undo?.({ ctx: mockCtx as any, logEntry: logEntry as any })
        expect(mockEm.remove).toHaveBeenCalledWith(mockMovement)
    })
})
