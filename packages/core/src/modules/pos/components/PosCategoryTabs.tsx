import React from 'react'
import { ScrollArea, ScrollBar } from '@open-mercato/ui/components/scroll-area'
import { cn } from '@open-mercato/ui/lib/utils'
import { usePosCategories } from '../hooks/usePosCatalog'
import { Skeleton } from '@open-mercato/ui/components/skeleton'

interface PosCategoryTabsProps {
    selectedCategoryId?: string
    organizationId: string
    tenantId: string
    onSelectCategory: (id: string) => void
}

export function PosCategoryTabs({
    selectedCategoryId,
    organizationId,
    tenantId,
    onSelectCategory,
}: PosCategoryTabsProps) {
    const { data: categories, isLoading } = usePosCategories({ organizationId, tenantId })

    if (isLoading) {
        return (
            <div className="flex gap-2 p-2 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-24 rounded-full" />
                ))}
            </div>
        )
    }

    const allCategories = [{ id: 'ALL', name: 'All Products' }, ...(categories || [])]

    return (
        <ScrollArea className="w-full whitespace-nowrap border-b border-border bg-background">
            <div className="flex w-max space-x-2 p-2">
                {allCategories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => onSelectCategory(category.id)}
                        className={cn(
                            'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                            selectedCategoryId === category.id
                                ? 'bg-primary text-primary-foreground shadow hover:bg-primary/90'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        )}
                    >
                        {category.name}
                    </button>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    )
}
