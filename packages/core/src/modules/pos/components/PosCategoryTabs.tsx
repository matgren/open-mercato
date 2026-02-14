import React from 'react'
import { cn } from '@open-mercato/shared/lib/utils'
import { usePosCategories } from '../hooks/usePosCatalog'

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
                    <div key={i} className="h-10 w-24 rounded-full bg-muted animate-pulse" />
                ))}
            </div>
        )
    }

    const allCategories = [{ id: 'ALL', name: 'All Products' }, ...(categories || [])]

    return (
        <div className="w-full whitespace-nowrap border-b border-border bg-background overflow-x-auto">
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
        </div>
    )
}
