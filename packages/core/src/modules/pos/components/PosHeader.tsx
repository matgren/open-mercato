'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@open-mercato/ui/primitives/button'
import { Users, Clock, LogOut } from 'lucide-react'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { format } from 'date-fns'
import Link from 'next/link'

interface PosHeaderProps {
    registerName?: string
    isSessionOpen: boolean
    onCloseSession?: () => void
}

export function PosHeader({ registerName = 'Register 1', isSessionOpen, onCloseSession }: PosHeaderProps) {
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="flex items-center justify-between border-b border-border bg-background px-4 py-2 shadow-sm">
            <div className="flex items-center gap-4">
                <Link href="/backend/pos/registers" className="font-bold text-lg hover:underline transition-colors">
                    {registerName}
                </Link>
                <Badge variant={isSessionOpen ? 'default' : 'destructive'} className="transition-colors">
                    {isSessionOpen ? 'Session Open' : 'Session Closed'}
                </Badge>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2 font-mono bg-muted/30 px-2 py-1 rounded">
                    <Clock className="h-4 w-4" />
                    <span>{format(currentTime, 'aaa HH:mm')}</span>
                </div>

                <Button variant="outline" size="sm" className="gap-2">
                    <Users className="h-4 w-4" />
                    <span>Walk-In Customer</span>
                </Button>

                {isSessionOpen && (
                    <Button variant="ghost" size="sm" onClick={onCloseSession} title="Close Session">
                        <LogOut className="h-4 w-4 text-destructive" />
                    </Button>
                )}
            </div>
        </div>
    )
}
