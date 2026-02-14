'use client'

import React, { useState, useRef } from 'react'
import { Input } from '@open-mercato/ui/primitives/input'
import { Search, Loader2 } from 'lucide-react'
import { parseBarcode } from '../lib/barcodeParser'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'

interface PosProductSearchProps {
    value: string
    onChange: (val: string) => void
    onAddToCart: (product: any, quantity: number) => void
}

export function PosProductSearch({ value, onChange, onAddToCart }: PosProductSearchProps) {
    const [isScanning, setIsScanning] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleScan = async (rawCode: string) => {
        console.log('Scanned:', rawCode)
        setIsScanning(true)

        try {
            const parsed = parseBarcode(rawCode)

            // Lookup product by SKU/Barcode
            // API: GET /api/catalog/products?sku=... or search=...
            // We might need a specific endpoint or use existing search

            // For now, let's assume specific SKU lookup:
            const res = await apiCall<any>('GET', `/api/catalog/products?search=${parsed.code}&limit=1`)
            const product = res.items?.[0]

            if (product) {
                flash(`Scanned: ${product.title}`, 'success')
                onAddToCart(product, parsed.quantity || 1)
            } else {
                flash(`Product not found: ${parsed.code}`, 'warning')
            }
        } catch (e) {
            console.error(e)
            flash('Error processing scan', 'error')
        } finally {
            setIsScanning(false)
        }
    }

    useBarcodeScanner(handleScan)

    return (
        <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                ref={inputRef}
                type="search"
                placeholder="Search products or scan barcode..."
                className="pl-9 w-full bg-background"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoFocus
            />
            {isScanning && (
                <div className="absolute right-2.5 top-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
            )}
        </div>
    )
}
