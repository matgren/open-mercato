'use client'

import React from 'react'
import { CartLine } from '../../hooks/usePosCart'
import { Button } from '@open-mercato/ui/primitives/button'
import { Trash2, Edit2 } from 'lucide-react'
import { Badge } from '@open-mercato/ui/primitives/badge'

interface CartLineItemProps {
    line: CartLine
    onUpdateQuantity: (newQuantity: number) => void
    onUpdatePrice: (newPrice: number) => void
    onRemove: () => void
}

export function CartLineItem({
    line,
    onUpdateQuantity,
    onUpdatePrice,
    onRemove
}: CartLineItemProps) {
    return (
        <div className="flex items-center justify-between p-3 border-b border-border bg-card">
            <div className="flex-1 min-w-0 mr-4">
                <div className="font-medium truncate" title={line.productTitle}>
                    {line.productTitle}
                </div>
                <div className="flex items-center text-sm text-muted-foreground space-x-2 mt-1">
                    <button
                        onClick={() => onUpdateQuantity(line.quantity)}
                        className="hover:underline flex items-center bg-muted px-2 py-0.5 rounded cursor-pointer"
                        title="Edit Quantity"
                    >
                        x{line.quantity}
                    </button>
                    <span>@</span>
                    <button
                        onClick={() => onUpdatePrice(line.price)}
                        className="hover:underline cursor-pointer"
                        title="Edit Price"
                    >
                        ${Number(line.price).toFixed(2)}
                    </button>
                </div>
            </div>

            <div className="flex items-center space-x-3">
                <div className="font-bold">
                    ${Number(line.total).toFixed(2)}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={onRemove}
                    title="Remove Item"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
