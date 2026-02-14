import React from 'react'
import { CatalogProduct } from '../../catalog/data/entities' // Ensure this import path is correct and entity has 'title', 'defaultMediaUrl'
import { Card, CardContent, CardFooter } from '@open-mercato/ui/components/card'
import Image from 'next/image' // Or use a UI specific image component if available
import { Badge } from '@open-mercato/ui/components/badge'

interface PosProductTileProps {
    product: CatalogProduct // Using partial type might be safer if not all props are loaded
    onClick: (product: CatalogProduct) => void
}

export function PosProductTile({ product, onClick }: PosProductTileProps) {
    // Find default variant price or product price
    // SPEC says: "Shows default variant's gross price"
    // We need to traverse variants.
    // Accessing relations in frontend might differ depending on how they are serialized.
    // If `variants` is loaded as a property.

    // Checking data fetching in hook: fields=...variants.prices
    // So `product.variants` should be an array of objects.

    // Helper to extract price
    const getDisplayPrice = () => {
        // In MikroORM loaded entities, collections might need .getItems() if it was a loaded Collection, 
        // but from JSON API it should be an array.
        // However, the type definition in `entities.ts` says `variants = new Collection(...)`.
        // The API JSON serialization usually converts Collection to array if populated.
        // We'll assume it's an array in the prop.

        // Casting to any to avoid strict Collection typing issues in frontend component 
        // when receiving JSON data which doesn't have Collection methods.
        const variants = (product.variants as any) || []
        const defaultVariant = variants.find((v: any) => v.isDefault) || variants[0]

        if (!defaultVariant) return 'N/A'

        const prices = defaultVariant.prices || []
        // Assuming we want the first applicable price or a specific price kind. 
        // Spec doesn't specify price kind logic, assume first one is usable or 'regular'.
        const price = prices[0]

        if (!price) return 'N/A'

        // Check if unitPriceGross is available
        if (price.unitPriceGross) {
            return `$${Number(price.unitPriceGross).toFixed(2)}` // TODO: Currency formatting
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
