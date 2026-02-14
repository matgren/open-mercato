'use client'

import React from 'react'
import { EmptyState } from '@open-mercato/ui/backend/EmptyState'
import { usePosProducts } from '../hooks/usePosCatalog'
import { PosProductTile } from './PosProductTile'
import { PosLoadMore } from './PosLoadMore'
import { CatalogProduct } from '../../catalog/data/entities'
import { Loader2 } from 'lucide-react'

interface PosProductGridProps {
    organizationId: string
    tenantId: string
    categoryId?: string
    search?: string
    onProductClick: (product: CatalogProduct) => void
}

export function PosProductGrid({
    organizationId,
    tenantId,
    categoryId,
    search,
    onProductClick,
}: PosProductGridProps) {
    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = usePosProducts({
        organizationId,
        tenantId,
        categoryId,
        search: search || '',
    })

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex h-full w-full items-center justify-center text-red-500">
                Failed to load products.
            </div>
        )
    }

    const allProducts = data?.pages.flatMap((page) => page.items) || []

    if (allProducts.length === 0) {
        return (
            <div className="h-full w-full overflow-y-auto bg-gray-50 p-4">
                <EmptyState
                    title="No products found"
                    description={
                        categoryId && categoryId !== 'ALL'
                            ? "Try selecting a different category."
                            : "Scan a barcode or search for products."
                    }
                />
            </div>
        )
    }

    return (
        <div className="h-full w-full overflow-y-auto bg-gray-50 p-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {allProducts.map((product) => (
                    <PosProductTile
                        key={product.id}
                        product={product}
                        onClick={onProductClick}
                    />
                ))}
            </div>
            <PosLoadMore
                onLoadMore={() => fetchNextPage()}
                isLoading={isFetchingNextPage}
                hasMore={!!hasNextPage}
            />
        </div>
    )
}
