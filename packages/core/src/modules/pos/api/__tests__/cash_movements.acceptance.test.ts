/** @jest-environment node */
import { randomUUID } from 'crypto'
import {
    GET,
    POST,
    PUT,
    DELETE,
} from '../cash-movements'

const tenantId = randomUUID()
const organizationId = randomUUID()
const userId = randomUUID()

const mockItems = [
    {
        id: randomUUID(),
        sessionId: randomUUID(),
        type: 'cash_in',
        amount: '50.00',
        reason: 'Initial float',
        createdByUserId: userId,
        organizationId,
        tenantId,
        createdAt: new Date().toISOString()
    },
]

const mockEntityManager = {
    fork: () => mockEntityManager,
    findOne: jest.fn(async () => null),
    find: jest.fn(async () => []),
    create: jest.fn((cls, data) => ({ ...data, id: randomUUID() })),
    persist: jest.fn(),
    flush: jest.fn(),
    persistAndFlush: jest.fn(),
    getRepository: jest.fn(() => ({
        find: jest.fn(async () => mockItems),
        findOne: jest.fn(async () => null),
    })),
}

const mockCommandBus = {
    execute: jest.fn(async (id, { input }: any) => {
        if (id === 'pos.cash.movement.create') {
            return { result: { ...input, id: randomUUID() } }
        }
        if (id === 'pos.cash.movement.update') {
            return { result: { ...input } }
        }
        if (id === 'pos.cash.movement.delete') {
            return { result: { success: true } }
        }
        return { result: {} }
    }),
}

const mockDataEngine = {
    markOrmEntityChange: jest.fn(),
}

const mockQueryEngine = {
    query: jest.fn(async (params) => {
        if (params.id) {
            const item = mockItems.find(i => i.id === params.id)
            return item ? { item } : { item: null }
        }
        return { items: mockItems, total: mockItems.length }
    }),
}

// Mock the container
jest.mock('@open-mercato/shared/lib/di/container', () => ({
    createRequestContainer: async () => ({
        resolve: (key: string) => {
            if (key === 'commandBus') return mockCommandBus
            if (key === 'queryEngine') return mockQueryEngine
            if (key === 'dataEngine') return mockDataEngine
            if (key === 'em') return mockEntityManager
            if (key === 'accessLogService') return { log: jest.fn() }
            return null
        }
    }),
    container: {
        resolve: (key: string) => {
            if (key === 'commandBus') return mockCommandBus
            if (key === 'queryEngine') return mockQueryEngine
            if (key === 'dataEngine') return mockDataEngine
            if (key === 'em') return mockEntityManager
            if (key === 'accessLogService') return { log: jest.fn() }
            return null
        }
    }
}))

// Mock Auth
jest.mock('@open-mercato/shared/lib/auth/server', () => ({
    getAuthFromRequest: jest.fn(async () => ({
        tenantId,
        orgId: organizationId,
        sub: userId,
        roles: ['admin'],
        permissions: ['*'],
    })),
    getAuthFromCookies: jest.fn(async () => null),
}))

// Mock Organization Scope
jest.mock('@open-mercato/core/modules/directory/utils/organizationScope', () => ({
    resolveOrganizationScopeForRequest: jest.fn(async () => ({
        tenantId,
        selectedId: organizationId,
        allowedIds: [organizationId],
    })),
}))

// Mock Translations
jest.mock('@open-mercato/shared/lib/i18n/server', () => ({
    resolveTranslations: async () => ({
        translate: (key: string, fallback?: string) => fallback ?? key,
    }),
}))

// Mock entities
jest.mock('../../data/entities', () => ({
    PosCashMovement: class PosCashMovement { }
}))

describe('C11b API Acceptance: POS Cash Movement Management', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('1. Create PosCashMovement (POST /api/pos/cash-movements)', async () => {
        const payload = {
            sessionId: randomUUID(),
            type: 'cash_in',
            amount: '50.00',
            reason: 'Testing',
            createdByUserId: userId,
            organizationId,
        }

        const req = new Request('http://localhost/api/pos/cash-movements', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        })

        const res = await POST(req)
        const body = await res.json()

        expect(res.status).toBe(201)
        expect(body.ok).toBe(true)
        expect(mockCommandBus.execute).toHaveBeenCalledWith(
            'pos.cash.movement.create',
            expect.objectContaining({ input: expect.objectContaining({ reason: payload.reason }) }),
        )
    })

    it('2. Retrieve List (GET /api/pos/cash-movements)', async () => {
        const req = new Request('http://localhost/api/pos/cash-movements')
        const res = await GET(req)
        const body = await res.json()

        expect(res.status).toBe(200)
        expect(body.items).toHaveLength(1)
        expect(mockQueryEngine.query).toHaveBeenCalledWith(
            'pos:pos_cash_movement',
            expect.objectContaining({
                fields: expect.arrayContaining(['sessionId', 'amount']),
            }),
        )
    })

    it('3. Update PosCashMovement (PUT /api/pos/cash-movements/:id)', async () => {
        const id = mockItems[0].id
        const payload = { reason: 'Updated reason' }

        const req = new Request(`http://localhost/api/pos/cash-movements/${id}?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify({ id, ...payload }),
            headers: { 'Content-Type': 'application/json' },
        })

        const res = await PUT(req, { params: { id } } as any)
        const body = await res.json()

        expect(res.status).toBe(200)
        expect(body.ok).toBe(true)
        expect(mockCommandBus.execute).toHaveBeenCalledWith(
            'pos.cash.movement.update',
            expect.objectContaining({ input: expect.objectContaining({ id, reason: 'Updated reason' }) }),
        )
    })

    it('4. Delete PosCashMovement (DELETE /api/pos/cash-movements/:id)', async () => {
        const id = mockItems[0].id

        const req = new Request(`http://localhost/api/pos/cash-movements/${id}?id=${id}`, {
            method: 'DELETE',
        })

        const res = await DELETE(req, { params: { id } } as any)
        const body = await res.json()

        expect(res.status).toBe(200)
        expect(body.ok).toBe(true)
        expect(mockCommandBus.execute).toHaveBeenCalledWith(
            'pos.cash.movement.delete',
            expect.objectContaining({ input: { id } }),
        )
    })
})
