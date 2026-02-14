'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@open-mercato/ui/primitives/dialog'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { Delete } from 'lucide-react'

interface NumPadDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    initialValue?: number
    onConfirm: (value: number) => void
    allowDecimals?: boolean
}

export function NumPadDialog({
    open,
    onOpenChange,
    title,
    initialValue = 0,
    onConfirm,
    allowDecimals = false
}: NumPadDialogProps) {
    const [value, setValue] = useState(initialValue.toString())

    useEffect(() => {
        if (open) {
            setValue(initialValue.toString())
        }
    }, [open, initialValue])

    const handleNumberClick = (num: string) => {
        if (value === '0' && num !== '.') {
            setValue(num)
        } else {
            setValue(prev => prev + num)
        }
    }

    const handleBackspace = () => {
        setValue(prev => {
            if (prev.length <= 1) return '0'
            return prev.slice(0, -1)
        })
    }

    const handleClear = () => {
        setValue('0')
    }

    const handleConfirm = () => {
        const num = parseFloat(value)
        if (!isNaN(num)) {
            onConfirm(num)
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="text-3xl font-mono text-right border rounded p-2 bg-muted">
                        {value}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <Button
                                key={num}
                                variant="outline"
                                className="h-16 text-xl"
                                onClick={() => handleNumberClick(num.toString())}
                            >
                                {num}
                            </Button>
                        ))}
                        {allowDecimals && (
                            <Button
                                variant="outline"
                                className="h-16 text-xl"
                                onClick={() => !value.includes('.') && handleNumberClick('.')}
                            >
                                .
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className={allowDecimals ? "h-16 text-xl" : "h-16 text-xl col-span-2"}
                            onClick={() => handleNumberClick('0')}
                        >
                            0
                        </Button>
                        <Button
                            variant="outline"
                            className="h-16 text-xl"
                            onClick={handleBackspace}
                        >
                            <Delete className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClear} className="w-full mr-2">Clear</Button>
                    <Button onClick={handleConfirm} className="w-full">Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
