/** @jest-environment node */
import { POST, GET } from '../registers'
import { randomUUID } from 'crypto'

const tenantId = randomUUID()
const organizationId = randomUUID()

const mockItems = [
    { id: randomUUID(), name: 'Register 1', code: 'R1', isActive: true, tenantId, organizationId }
]

const mockEm = {
    fork: () => mockEm,
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((cls, data) => ({ ...data, id: randomUUID() })),
    persist: jest.fn(),
    flush: jest.fn(),
    persistAndFlush: jest.fn(),
    getRepository: jest.fn(() => ({
        find: jest.fn(async () => mockItems),
        findOne: jest.fn(async () => null),
    }))
}

const mockCommandBus = {
    execute: jest.fn(async (id, { input }) => {
        if (id === 'pos.register.create') {
            const reg = { ...input, id: randomUUID() }
            return { result: reg, logEntry: { id: randomUUID(), undoToken: 'abc', commandId: id } }
        }
        return { result: {}, logEntry: null }
    })
}

const mockDataEngine = {
    markOrmEntityChange: jest.fn(),
}

const mockQueryEngine = {
    query: jest.fn(async () => ({ items: mockItems, total: mockItems.length }))
}

// Mock the container to return our mocks
jest.mock('@open-mercato/shared/lib/di/container', () => ({
    createRequestContainer: async () => ({
        resolve: (key: string) => {
            if (key === 'em') return mockEm
            if (key === 'dataEngine') return mockDataEngine
            if (key === 'commandBus') return mockCommandBus
            if (key === 'queryEngine') return mockQueryEngine
            if (key === 'accessLogService') return { log: jest.fn() }
            return null
        }
    })
}))

// Mock Auth
jest.mock('@open-mercato/shared/lib/auth/server', () => ({
    getAuthFromRequest: jest.fn(async () => ({
        tenantId,
        orgId: organizationId,
        sub: 'user-1',
        roles: ['admin'],
        permissions: ['*']
    })),
    getAuthFromCookies: jest.fn(async () => null)
}))

// Mock Organization Scope
jest.mock('@open-mercato/core/modules/directory/utils/organizationScope', () => ({
    resolveOrganizationScopeForRequest: jest.fn(async () => ({
        tenantId,
        selectedId: organizationId,
        allowedIds: [organizationId]
    }))
}))

// Mock Translations
jest.mock('@open-mercato/shared/lib/i18n/server', () => ({
    resolveTranslations: async () => ({
        translate: (key: string, fallback?: string) => fallback ?? key
    })
}))

// Mock entities
jest.mock('../../data/entities', () => ({
    PosRegister: class PosRegister { }
}))

describe('A-06 API Acceptance: POS Register Management', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('1. Create Register (POST /api/pos/registers)', async () => {
        const payload = {
            name: 'Main Terminal',
            code: 'REG-001',
            organizationId
        }

        const req = new Request('http://localhost/api/pos/registers', {
            method: 'POST',
            body: JSON.stringify(payload)
        })

        const res = await POST(req)
        const body = await res.json()

        expect(res.status).toBe(201)
        expect(body.ok).toBe(true)
        expect(body.item.name).toBe('Main Terminal')
    })

    it('2. Retrieve List (GET /api/pos/registers)', async () => {
        const req = new Request('http://localhost/api/pos/registers')
        const res = await GET(req)
        const body = await res.json()

        expect(res.status).toBe(200)
        expect(body.items).toHaveLength(1)
        expect(body.items[0].name).toBe('Register 1')
    })

    it('3. Verify Constraints (Duplicate Code)', async () => {
        const payload = {
            name: 'Dup Terminal',
            code: '', // Validation should fail (min length 1)
            organizationId
        }

        const req = new Request('http://localhost/api/pos/registers', {
            method: 'POST',
            body: JSON.stringify(payload)
        })

        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it('4. Audit Check (Action Log Integration)', async () => {
        const payload = {
            name: 'Audit Terminal',
            code: 'AUDIT-001',
            organizationId
        }

        const req = new Request('http://localhost/api/pos/registers', {
            method: 'POST',
            body: JSON.stringify(payload)
        })

        await POST(req)

        expect(mockCommandBus.execute).toHaveBeenCalledWith(
            'pos.register.create',
            expect.anything()
        )
    })
})
