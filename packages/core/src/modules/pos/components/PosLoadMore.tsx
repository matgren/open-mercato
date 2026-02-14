import React from 'react'
import { Button } from '@open-mercato/ui'
import { Loader2 } from 'lucide-react'

interface PosLoadMoreProps {
    onLoadMore: () => void
    isLoading: boolean
    hasMore: boolean
}

export function PosLoadMore({ onLoadMore, isLoading, hasMore }: PosLoadMoreProps) {
    if (!hasMore) return null

    return (
        <div className="flex justify-center p-4">
            <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={isLoading}
                className="w-full max-w-xs"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                    </>
                ) : (
                    'Load More Products'
                )}
            </Button>
        </div>
    )
}
