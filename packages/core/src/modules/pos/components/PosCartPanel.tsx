'use client'

import React from 'react'
import { EmptyState } from '@open-mercato/ui/backend/EmptyState'

export function PosCartPanel() {
    return (
        <div className="flex h-full flex-col border-l border-border bg-white">
            <div className="flex-1 overflow-y-auto p-4">
                <EmptyState
                    title="Cart is empty"
                    description="Add items to start a sale."
                />
            </div>

            <div className="border-t border-border p-4">
                <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>0.00</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>0.00</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
