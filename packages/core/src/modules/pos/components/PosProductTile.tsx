import React from 'react'
import { CatalogProduct } from '../../catalog/data/entities'
import { Card, CardContent, CardFooter } from '@open-mercato/ui/primitives/card'
import Image from 'next/image'
import { Badge } from '@open-mercato/ui/primitives/badge'

interface PosProductTileProps {
    product: CatalogProduct
    onClick: (product: CatalogProduct) => void
}

export function PosProductTile({ product, onClick }: PosProductTileProps) {
    const getDisplayPrice = () => {
        const variants = (product.variants as any) || []
        const defaultVariant = variants.find((v: any) => v.isDefault) || variants[0]

        if (!defaultVariant) return 'N/A'

        const prices = defaultVariant.prices || []
        const price = prices[0]

        if (!price) return 'N/A'

        if (price.unitPriceGross) {
            return `$${Number(price.unitPriceGross).toFixed(2)}`
        }

        return 'N/A'
    }

    return (
        <Card
            className="cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary h-[200px] flex flex-col"
            onClick={() => onClick(product)}
        >
            <div className="relative h-28 w-full bg-muted">
                {product.defaultMediaUrl ? (
                    <Image
                        src={product.defaultMediaUrl}
                        alt={product.title}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        <span className="text-2xl">📦</span>
                    </div>
                )}
            </div>
            <CardContent className="p-3 flex-1">
                <h3 className="font-semibold text-sm line-clamp-2 md:text-base">
                    {product.title}
                </h3>
            </CardContent>
            <CardFooter className="p-3 pt-0 flex justify-between items-center">
                <Badge variant="secondary" className="font-mono">
                    {getDisplayPrice()}
                </Badge>
            </CardFooter>
        </Card>
    )
}
