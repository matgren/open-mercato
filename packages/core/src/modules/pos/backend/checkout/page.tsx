'use client'

import React, { useState } from 'react'
import { Page } from '@open-mercato/ui/backend/Page'
import { PosProductGrid } from '../../components/PosProductGrid'
import { PosCartPanel } from '../../components/PosCartPanel'
import { PosHeader } from '../../components/PosHeader'
import { PosSessionManager } from '../../components/PosSessionManager'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useIdleTimer } from '../../hooks/useIdleTimer'

export default function PosCheckoutPage() {
    // Placeholder state - in real implementation this would come from api/context
    const [isSessionOpen, setIsSessionOpen] = useState(false)

    // Auto-lock after 15 minutes of inactivity (900000 ms)
    useIdleTimer({
        timeout: 900000,
        onIdle: () => {
            if (isSessionOpen) {
                console.log('User idle, locking terminal...')
                // flast('Terminal locked due to inactivity', 'warning')
                // In real app, this would lock the screen or logout
            }
        }
    })

    const handleOpenSession = (floatAmount: number) => {
        console.log('Opening session with float:', floatAmount)
        setIsSessionOpen(true)
        flash('Session opened successfully', 'success')
    }

    const handleCloseSession = () => {
        if (confirm('Are you sure you want to close this session?')) {
            setIsSessionOpen(false)
            flash('Session closed', 'info')
        }
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
                        <div className="flex-1 overflow-hidden relative border-r border-border">
                            <PosProductGrid />
                        </div>
                        <div className="w-1/3 min-w-[350px] max-w-[500px] shadow-xl z-10">
                            <PosCartPanel />
                        </div>
                    </div>
                </PosSessionManager>
            </div>
        </Page>
    )
}
