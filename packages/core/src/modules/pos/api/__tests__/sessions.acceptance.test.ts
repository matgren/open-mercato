/** @jest-environment node */
import { randomUUID } from 'crypto'
import {
  GET,
  POST,
  PUT,
  DELETE,
  POST_OPEN,
  POST_CLOSE,
} from '../sessions'

const tenantId = randomUUID()
const organizationId = randomUUID()
const userId = randomUUID()

const mockItems = [
  {
    id: randomUUID(),
    registerId: randomUUID(),
    openedByUserId: userId,
    status: 'open',
    openedAt: new Date().toISOString(),
    organizationId,
    tenantId,
    openingFloatAmount: '100.00',
    currencyCode: 'EUR'
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
    if (id === 'pos.session.create') {
      return { result: { ...input, id: randomUUID() } }
    }
    if (id === 'pos.session.update') {
      return { result: { ...input } }
    }
    if (id === 'pos.session.delete') {
      return { result: { success: true } }
    }
    if (id === 'pos.session.open') {
      return { result: { ...input, status: 'open', openedAt: new Date().toISOString() } }
    }
    if (id === 'pos.session.close') {
      return { result: { ...input, status: 'closed', closedAt: new Date().toISOString() } }
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

// Mock the container to return our mocks
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
  PosSession: class PosSession { }
}))

describe('C09 API Acceptance: POS Session Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('1. Create PosSession (POST /api/pos/sessions)', async () => {
    const payload = {
      registerId: randomUUID(),
      openedByUserId: userId,
      openingFloatAmount: '100.00',
      currencyCode: 'EUR',
      organizationId,
    }

    const req = new Request('http://localhost/api/pos/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    const body = await res.json()

    if (res.status !== 201) {
      console.error('POST /api/pos/sessions failed with status', res.status, ':', JSON.stringify(body, null, 2))
    }

    expect(res.status).toBe(201)
    expect(body.ok).toBe(true)
    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      'pos.session.create',
      expect.objectContaining({ input: expect.objectContaining({ registerId: payload.registerId }) }),
    )
  })

  it('2. Retrieve List (GET /api/pos/sessions)', async () => {
    const req = new Request('http://localhost/api/pos/sessions')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.items).toHaveLength(1)
    expect(mockQueryEngine.query).toHaveBeenCalledWith(
      'pos:pos_session',
      expect.objectContaining({
        fields: expect.arrayContaining(['id', 'status']),
      }),
    )
  })

  it('3. Update PosSession (PUT /api/pos/sessions/:id)', async () => {
    const sessionId = mockItems[0].id
    const payload = { status: 'suspended' }

    const req = new Request(`http://localhost/api/pos/sessions/${sessionId}?id=${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify({ id: sessionId, status: 'closed' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await PUT(req, { params: { id: sessionId } } as any)
    const body = await res.json()

    if (res.status !== 200) {
      console.error('PUT /api/pos/sessions failed:', JSON.stringify(body, null, 2))
    }

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      'pos.session.update',
      expect.objectContaining({ input: expect.objectContaining({ id: sessionId, status: 'closed' }) }),
    )
  })

  it('4. Open PosSession (POST /api/pos/sessions/:id/open)', async () => {
    const sessionId = mockItems[0].id
    const payload = { pin: '1234' }

    const req = new Request(`http://localhost/api/pos/sessions/${sessionId}/open`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST_OPEN(req, {
      params: { id: sessionId },
      container: {
        resolve: (key: string) => {
          if (key === 'commandBus') return mockCommandBus
          if (key === 'em') return mockEntityManager
          return null
        }
      }
    } as any)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('open')
    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      'pos.session.open',
      expect.objectContaining({ input: { id: sessionId, pin: '1234' } }),
    )
  })

  it('5. Close PosSession (POST /api/pos/sessions/:id/close)', async () => {
    const sessionId = mockItems[0].id
    const payload = {
      pin: '1234',
      closingCashAmount: '150.00',
      expectedCashAmount: '150.00'
    }

    const req = new Request(`http://localhost/api/pos/sessions/${sessionId}/close`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST_CLOSE(req, {
      params: { id: sessionId },
      container: {
        resolve: (key: string) => {
          if (key === 'commandBus') return mockCommandBus
          if (key === 'em') return mockEntityManager
          return null
        }
      }
    } as any)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('closed')
    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      'pos.session.close',
      expect.objectContaining({ input: { id: sessionId, ...payload } }),
    )
  })
})
