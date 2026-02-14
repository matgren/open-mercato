'use client'

import React from 'react'
import { EmptyState } from '@open-mercato/ui/backend/EmptyState'

export function PosProductGrid() {
    return (
        <div className="h-full w-full overflow-y-auto bg-gray-50 p-4">
            <EmptyState
                title="No products"
                description="Scan a barcode or search for products to add them to the cart."
            />
        </div>
    )
}
