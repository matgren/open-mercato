'use client'

import React, { useState } from 'react'
import { Button, Label } from '@open-mercato/ui'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@open-mercato/ui/primitives/card'
import { Input } from '@open-mercato/ui/primitives/input'
import { Store, Lock } from 'lucide-react'
import { flash } from '@open-mercato/ui/backend/FlashMessages'

interface PosSessionManagerProps {
    isOpen: boolean
    onOpenSession: (floatAmount: number) => void
    children: React.ReactNode
}

export function PosSessionManager({ isOpen, onOpenSession, children }: PosSessionManagerProps) {
    const [floatAmount, setFloatAmount] = useState('0.00')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleOpen = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate API call
        setTimeout(() => {
            const amount = parseFloat(floatAmount)
            if (isNaN(amount) || amount < 0) {
                flash('Invalid float amount', 'error')
                setIsSubmitting(false)
                return
            }
            onOpenSession(amount)
            setIsSubmitting(false)
        }, 800)
    }

    if (isOpen) {
        return <>{children}</>
    }

    return (
        <div className="flex h-full w-full items-center justify-center bg-gray-50/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md shadow-lg border-2">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Store className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Open Register Session</CardTitle>
                    <CardDescription>
                        Enter the opening cash float to start selling.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleOpen}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="float">Opening Float</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                <Input
                                    id="float"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="pl-7 text-lg font-bold"
                                    value={floatAmount}
                                    onChange={(e) => setFloatAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full h-11 text-lg" disabled={isSubmitting}>
                            {isSubmitting ? 'Opening...' : 'Open Session'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
