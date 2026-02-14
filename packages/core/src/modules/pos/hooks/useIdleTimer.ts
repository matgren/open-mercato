'use client'

import { useEffect, useState } from 'react'

interface UseIdleTimerProps {
    timeout: number
    onIdle: () => void
}

export function useIdleTimer({ timeout, onIdle }: UseIdleTimerProps) {
    useEffect(() => {
        let timer: NodeJS.Timeout

        const handleActivity = () => {
            clearTimeout(timer)
            timer = setTimeout(onIdle, timeout)
        }

        // Set initial timer
        timer = setTimeout(onIdle, timeout)

        // Add event listeners
        window.addEventListener('mousemove', handleActivity)
        window.addEventListener('keydown', handleActivity)
        window.addEventListener('click', handleActivity)
        window.addEventListener('scroll', handleActivity)

        return () => {
            clearTimeout(timer)
            window.removeEventListener('mousemove', handleActivity)
            window.removeEventListener('keydown', handleActivity)
            window.removeEventListener('click', handleActivity)
            window.removeEventListener('scroll', handleActivity)
        }
    }, [timeout, onIdle])
}
