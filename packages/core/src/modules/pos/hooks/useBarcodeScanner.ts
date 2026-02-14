'use client'

import { useEffect, useRef } from 'react'

export function useBarcodeScanner(onScan: (code: string) => void) {
    const buffer = useRef<string>('')
    const lastKeyTime = useRef<number>(0)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const now = Date.now()

            // If time between keys is long, reset buffer (it's manual typing)
            // Scanners usually send chars within 20-50ms
            // We use 100ms as a safe threshold for "human vs scanner"
            if (now - lastKeyTime.current > 100) {
                buffer.current = ''
            }

            lastKeyTime.current = now

            if (e.key === 'Enter') {
                if (buffer.current.length > 2) { // Min length check to avoid accidental Enters
                    onScan(buffer.current)
                    buffer.current = ''
                    // e.preventDefault() // preventDefault might block form submissions if used globally
                }
            } else if (e.key.length === 1) { // Only printable chars
                buffer.current += e.key
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onScan])
}
