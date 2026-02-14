'use client'

import React, { useState } from 'react'
import { Page } from '@open-mercato/ui'
import { PosProductGrid } from '../../../components/PosProductGrid'
import { PosCategoryTabs } from '../../../components/PosCategoryTabs'
import { PosCartPanel } from '../../../components/PosCartPanel'
import { PosHeader } from '../../../components/PosHeader'
import { PosSessionManager } from '../../../components/PosSessionManager'
import { PosProductSearch } from '../../../components/PosProductSearch'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useIdleTimer } from '../../../hooks/useIdleTimer'
import { usePosSession } from '../../../hooks/usePosSession'
import { usePosCart } from '../../../hooks/usePosCart'

// TODO: Get real register ID from URL or context
const REGISTER_ID = '00000000-0000-0000-0000-000000000000'

export default function PosCheckoutPage() {
    // Session State
    const { session, openSession, closeSession, isLoading: isSessionLoading } = usePosSession(REGISTER_ID)
    const isSessionOpen = session?.status === 'OPEN'

    // Cart State
    const { cart, addToCart } = usePosCart(session?.id || null)

    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL')
    const [searchQuery, setSearchQuery] = useState('')

    // Auto-lock after 15 minutes of inactivity (900000 ms)
    useIdleTimer({
        timeout: 900000,
        onIdle: () => {
            if (isSessionOpen) {
                console.log('User idle, locking terminal...')
                // flash('Terminal locked due to inactivity', 'warning')
            }
        }
    })

    const handleOpenSession = (floatAmount: number) => {
        openSession(floatAmount)
    }

    const handleCloseSession = () => {
        if (confirm('Are you sure you want to close this session?')) {
            if (session?.id) {
                closeSession(session.id)
            }
        }
    }

    const handleAddToCart = (product: any, quantity: number = 1) => {
        if (!isSessionOpen) {
            flash('Session is closed. Open session to sell.', 'error')
            return
        }
        addToCart({ product, quantity })
    }

    return (
        <Page className="space-y-0 overflow-hidden h-[100svh] flex flex-col">
            <div className="shrink-0">
                <PosHeader
                    isSessionOpen={isSessionOpen}
                    onCloseSession={handleCloseSession}
                />
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                <PosSessionManager isOpen={isSessionOpen} onOpenSession={handleOpenSession}>
                    <div className="flex h-full w-full">
                        <div className="flex-1 overflow-hidden relative border-r border-border flex flex-col">
                            {/* Search Bar */}
                            <div className="shrink-0 p-4 pb-0 bg-background z-10">
                                <PosProductSearch
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    onAddToCart={handleAddToCart}
                                />
                            </div>

                            {/* Category Tabs */}
                            <div className="shrink-0 pt-2">
                                <PosCategoryTabs
                                    organizationId=""
                                    tenantId=""
                                    selectedCategoryId={selectedCategoryId}
                                    onSelectCategory={setSelectedCategoryId}
                                />
                            </div>

                            {/* Product Grid */}
                            <div className="flex-1 overflow-hidden relative">
                                <PosProductGrid
                                    organizationId=""
                                    tenantId=""
                                    categoryId={selectedCategoryId}
                                    search={searchQuery}
                                    onProductClick={handleAddToCart}
                                />
                            </div>
                        </div>
                        <div className="w-1/3 min-w-[350px] max-w-[500px] shadow-xl z-20 bg-background">
                            <PosCartPanel />
                        </div>
                    </div>
                </PosSessionManager>
            </div>
        </Page>
    )
}
