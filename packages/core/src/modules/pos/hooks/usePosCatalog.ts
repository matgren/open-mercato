import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { CatalogProduct, CatalogProductCategory } from '../../catalog/data/entities'

const FETCH_LIMIT = 20

interface BaseParams {
    organizationId?: string
    tenantId?: string
}

interface UsePosProductsParams extends BaseParams {
    categoryId?: string
    search?: string
}

interface ProductResponse {
    items: CatalogProduct[]
    total: number
}

async function fetchCategories(params: BaseParams): Promise<CatalogProductCategory[]> {
    const searchParams = new URLSearchParams()
    if (params.organizationId) searchParams.set('organizationId', params.organizationId)
    if (params.tenantId) searchParams.set('tenantId', params.tenantId)
    searchParams.set('parentId', 'null') // string 'null' works for current API? or just leave empty? SPEC states parentId=null
    searchParams.set('isActive', 'true')
    searchParams.set('fields', 'id,name,slug') // Optimization

    const res = await fetch(`/api/catalog/product-categories?${searchParams.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch categories')

    // The API likely returns { items: [], total: ... } or just [] depending on implementation.
    // Catalog usually uses makeCrudRoute which returns { items, meta }. 
    // Let's assume standard response format.
    const data = await res.json()
    return data.items || []
}

async function fetchProducts(params: UsePosProductsParams & { pageParam?: number }): Promise<ProductResponse> {
    const searchParams = new URLSearchParams()
    if (params.organizationId) searchParams.set('organizationId', params.organizationId)
    if (params.tenantId) searchParams.set('tenantId', params.tenantId)
    if (params.categoryId && params.categoryId !== 'ALL') searchParams.set('categoryId', params.categoryId)
    if (params.search) searchParams.set('search', params.search) // Note: Standard catalog might not support search param directly without 'q' or filter, but Plan assumed generic API. 
    // Checking SPEC-022a: "GET /api/catalog/products ... &categoryId=... "

    searchParams.set('isActive', 'true')
    searchParams.set('limit', String(FETCH_LIMIT))
    searchParams.set('offset', String(params.pageParam || 0))
    // Request specific fields to reduce payload
    searchParams.set('fields', 'id,title,defaultMediaUrl,variants.prices')

    const res = await fetch(`/api/catalog/products?${searchParams.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch products')

    return res.json()
}

export function usePosCategories(params: BaseParams = {}) {
    return useQuery({
        queryKey: ['pos', 'categories', params],
        queryFn: () => fetchCategories(params),
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

export function usePosProducts(params: UsePosProductsParams = {}) {
    return useInfiniteQuery({
        queryKey: ['pos', 'products', params],
        queryFn: ({ pageParam }) => fetchProducts({ ...params, pageParam: pageParam as number }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const loadedCount = allPages.length * FETCH_LIMIT
            if (loadedCount < lastPage.total) {
                return loadedCount
            }
            return undefined
        },
    })
}
