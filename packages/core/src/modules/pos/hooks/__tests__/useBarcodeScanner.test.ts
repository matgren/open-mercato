/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react'
import { useBarcodeScanner } from '../useBarcodeScanner'

describe('useBarcodeScanner', () => {
    let events: any = {}

    beforeEach(() => {
        events = {}
        jest.spyOn(window, 'addEventListener').mockImplementation((event, handle) => {
            events[event] = handle
        })
        jest.spyOn(window, 'removeEventListener').mockImplementation((event, handle) => {
            delete events[event]
        })
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
        jest.restoreAllMocks()
    })

    const triggerKey = (key: string) => {
        act(() => {
            const handler = events['keydown']
            if (handler) {
                handler(new KeyboardEvent('keydown', { key }))
            }
        })
    }

    it('detects scanner input (rapid typing)', () => {
        const onScan = jest.fn()
        renderHook(() => useBarcodeScanner(onScan))

        // Simulate rapid input
        '123456'.split('').forEach(char => {
            triggerKey(char)
            jest.advanceTimersByTime(10) // 10ms between keys
        })
        triggerKey('Enter')

        expect(onScan).toHaveBeenCalledWith('123456')
    })

    it('ignores slow typing (manual entry)', () => {
        const onScan = jest.fn()
        renderHook(() => useBarcodeScanner(onScan))

        // Simulate slow input
        triggerKey('1')
        jest.advanceTimersByTime(200) // 200ms pause
        triggerKey('2')
        jest.advanceTimersByTime(200)
        triggerKey('3')
        triggerKey('Enter')

        // Buffer resets on slow input, so it might capture just '3' if Enter is fast, 
        // or nothing if logic strictly resets.
        // Implementation: if (now - last > 100) buffer = ''
        // So 1 -> buffer='1' -> wait 200 -> 2 -> reset buffer, buffer='2' -> wait 200 -> 3 -> reset, buffer='3'
        // Enter -> buffer='3' (length 1 < 3 min length) -> no scan

        expect(onScan).not.toHaveBeenCalled()
    })

    it('ignores short inputs', () => {
        const onScan = jest.fn()
        renderHook(() => useBarcodeScanner(onScan))

        triggerKey('1')
        jest.advanceTimersByTime(10)
        triggerKey('2')
        triggerKey('Enter')

        expect(onScan).not.toHaveBeenCalled()
    })
})
