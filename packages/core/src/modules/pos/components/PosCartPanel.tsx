'use client'

import React, { useState } from 'react'
import { EmptyState } from '@open-mercato/ui/backend/EmptyState'
import { usePosCart } from '../hooks/usePosCart'
import { usePosSession } from '../hooks/usePosSession'
import { CartLineItem } from './CartLineItem'
import { NumPadDialog } from './NumPadDialog'
import { Loader2 } from 'lucide-react'

export function PosCartPanel() {
    const { session } = usePosSession()
    const { cart, isLoading, updateLine, removeLine } = usePosCart(session?.id || null)

    const [numpadConfig, setNumpadConfig] = useState<{
        items: { lineId: string, type: 'quantity' | 'price', initialValue: number } | null
    }>({ items: null })

    const handleUpdateQuantity = (lineId: string, currentQty: number) => {
        setNumpadConfig({
            items: { lineId, type: 'quantity', initialValue: currentQty }
        })
    }

    const handleUpdatePrice = (lineId: string, currentPrice: number) => {
        setNumpadConfig({
            items: { lineId, type: 'price', initialValue: currentPrice }
        })
    }

    const handleNumpadConfirm = (value: number) => {
        if (!numpadConfig.items) return

        const { lineId, type } = numpadConfig.items

        if (type === 'quantity') {
            if (value === 0) {
                removeLine(lineId)
            } else {
                updateLine({ lineId, quantity: value })
            }
        } else {
            updateLine({ lineId, price: value })
        }

        setNumpadConfig({ items: null })
    }

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center border-l border-border bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!cart || cart.lines.length === 0) {
        return (
            <div className="flex h-full flex-col border-l border-border bg-white">
                <div className="flex-1 overflow-y-auto p-4">
                    <EmptyState
                        title="Cart is empty"
                        description="Add items to start a sale."
                    />
                </div>
                <div className="border-t border-border p-4">
                    <div className="mb-4 space-y-2 text-muted-foreground opacity-50">
                        <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
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

    return (
        <div className="flex h-full flex-col border-l border-border bg-white">
            <div className="flex-1 overflow-y-auto">
                {cart.lines.map(line => (
                    <CartLineItem
                        key={line.id}
                        line={line}
                        onUpdateQuantity={(q) => handleUpdateQuantity(line.id, q)}
                        onUpdatePrice={(p) => handleUpdatePrice(line.id, p)}
                        onRemove={() => removeLine(line.id)}
                    />
                ))}
            </div>

            <div className="border-t border-border p-4 bg-muted/20">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${Number(cart.subTotalAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span>${Number(cart.taxAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-border mt-2">
                        <span>Total</span>
                        <span>${Number(cart.totalAmount || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <NumPadDialog
                open={!!numpadConfig.items}
                onOpenChange={(open) => !open && setNumpadConfig({ items: null })}
                title={numpadConfig.items?.type === 'quantity' ? 'Set Quantity' : 'Override Price'}
                initialValue={numpadConfig.items?.initialValue}
                onConfirm={handleNumpadConfirm}
                allowDecimals={numpadConfig.items?.type === 'price'}
            />
        </div>
    )
}
