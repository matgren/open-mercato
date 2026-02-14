'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { CatalogProduct } from '../../catalog/data/entities'

export interface CartLine {
    id: string
    productId: string
    productTitle: string
    quantity: number
    price: number
    total: number
}

// TODO: Replace with real POS Cart entity type
export interface PosCart {
    id: string
    lines: CartLine[]
    totalAmount: number
    subTotalAmount: number
    taxAmount: number
}

async function fetchCart(sessionId: string) {
    if (!sessionId) return null
    // Assuming GET /api/pos/carts?sessionId=...
    const res = await apiCall<{ items: PosCart[] }>('GET', `/api/pos/carts?sessionId=${sessionId}`)
    return res.items[0] || null
}

async function addToCart(cartId: string, product: CatalogProduct, quantity: number = 1) {
    // Check if we need to create a cart first? 
    // Usually the session has a current cart or we create one on first add.
    // For now assume cartId exists or we need a way to create it.
    // If cartId is null, we might need createCart(sessionId)

    // Simplification: We blindly try to add to a cart if we have one.

    return apiCall('POST', '/api/pos/cart/line/add', {
        cartId,
        productId: product.id,
        quantity,
        price: 0 // Backend should resolve price? Or we send it?
        // Spec C14 says: pos.cart.line.add
    })
}

export function usePosCart(sessionId: string | null) {
    const queryClient = useQueryClient()

    const query = useQuery({
        queryKey: ['pos', 'cart', sessionId],
        queryFn: () => sessionId ? fetchCart(sessionId) : Promise.resolve(null),
        enabled: !!sessionId
    })

    const addMutation = useMutation({
        mutationFn: ({ product, quantity }: { product: CatalogProduct, quantity: number }) => {
            if (!query.data?.id) throw new Error('No active cart')
            return addToCart(query.data.id, product, quantity)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pos', 'cart', sessionId] })
            flash('Item added', 'success')
        },
        onError: (e: any) => {
            flash(e.message || 'Failed to add item', 'error')
        }
    })

    return {
        cart: query.data,
        isLoading: query.isLoading,
        addToCart: addMutation.mutate
    }
}
