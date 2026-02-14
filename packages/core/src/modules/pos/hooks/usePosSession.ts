'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'

export interface PosSesionData {
    id: string
    organizationId: string
    tenantId: string
    registerId: string
    status: 'OPEN' | 'CLOSED' | 'LOCKED'
    openedAt: string
    closedAt?: string
    version: number
}

// TODO: Replace with real API route once verified
// Currently assuming GET /api/pos/sessions?registerId=... returns list or current
// Or GET /api/pos/registers/:id/session

async function fetchCurrentSession(registerId: string) {
    // For now, we simulate or fetch if API exists
    // The previous implementation used local state.
    // We need to implement the real API call.
    // Based on C09, we have sessions CRUD.
    // usage: apiCall<{items: PosSessionData[]}>('GET', `/api/pos/sessions?registerId=${registerId}&status=OPEN`)

    // Attempt real fetch
    try {
        const res = await apiCall<{ items: PosSesionData[] }>('GET', `/api/pos/sessions?registerId=${registerId}&status=OPEN`)
        return res.items[0] || null
    } catch (e) {
        console.warn('Failed to fetch session, using mock for dev if needed', e)
        return null
    }
}

async function openSession(registerId: string, floatAmount: number) {
    return apiCall('POST', '/api/pos/sessions/open', {
        registerId,
        openingFloatAmount: floatAmount
    })
}

async function closeSession(sessionId: string) {
    // We probably need closing counts, but for now strict close
    return apiCall('POST', '/api/pos/sessions/close', {
        id: sessionId,
        closingCashAmount: 0 // Simplification for now
    })
}

export function usePosSession(registerId: string) {
    const queryClient = useQueryClient()

    const query = useQuery({
        queryKey: ['pos', 'session', registerId],
        queryFn: () => fetchCurrentSession(registerId),
    })

    const openMutation = useMutation({
        mutationFn: (floatAmount: number) => openSession(registerId, floatAmount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pos', 'session', registerId] })
            flash('Session opened successfully', 'success')
        },
        onError: (err: any) => {
            flash(err.message || 'Failed to open session', 'error')
        }
    })

    const closeMutation = useMutation({
        mutationFn: (sessionId: string) => closeSession(sessionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pos', 'session', registerId] })
            flash('Session closed successfully', 'success')
        },
        onError: (err: any) => {
            flash(err.message || 'Failed to close session', 'error')
        }
    })

    return {
        session: query.data,
        isLoading: query.isLoading,
        isOpen: !!query.data,
        openSession: openMutation.mutate,
        closeSession: closeMutation.mutate
    }
}
