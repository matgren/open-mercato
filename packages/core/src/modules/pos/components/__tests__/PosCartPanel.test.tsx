/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PosCartPanel } from '../PosCartPanel'
import { usePosCart } from '../../hooks/usePosCart'
import { usePosSession } from '../../hooks/usePosSession'

// Mock hooks
jest.mock('../../hooks/usePosCart')
jest.mock('../../hooks/usePosSession')

// Mock UI components that might cause issues in JSDOM or are not the focus
jest.mock('@open-mercato/ui/backend/EmptyState', () => ({
    EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>
}))

jest.mock('../NumPadDialog', () => ({
    NumPadDialog: ({ open, onConfirm, title }: any) => open ? (
        <div data-testid="numpad-dialog">
            <h1>{title}</h1>
            <button onClick={() => onConfirm(5)}>Confirm 5</button>
        </div>
    ) : null
}))

describe('PosCartPanel', () => {
    const mockUpdateLine = jest.fn()
    const mockRemoveLine = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
            ; (usePosSession as jest.Mock).mockReturnValue({
                session: { id: 'session-123' }
            })
    })

    it('renders empty state when cart is null or empty', () => {
        ; (usePosCart as jest.Mock).mockReturnValue({
            cart: null,
            isLoading: false
        })

        render(<PosCartPanel />)
        expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    it('renders cart lines and totals', () => {
        ; (usePosCart as jest.Mock).mockReturnValue({
            cart: {
                id: 'cart-1',
                lines: [
                    {
                        id: 'line-1',
                        productTitle: 'Test Product',
                        quantity: 2,
                        price: 10,
                        total: 20
                    }
                ],
                subTotalAmount: 20,
                taxAmount: 2,
                totalAmount: 22
            },
            isLoading: false,
            updateLine: mockUpdateLine,
            removeLine: mockRemoveLine
        })

        render(<PosCartPanel />)

        expect(screen.getByText('Test Product')).toBeInTheDocument()
        // $20.00 appears as line total and subtotal
        expect(screen.getAllByText('$20.00').length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText('$22.00')).toBeInTheDocument() // Cart total
    })

    it('opens numpad for quantity update', () => {
        ; (usePosCart as jest.Mock).mockReturnValue({
            cart: {
                id: 'cart-1',
                lines: [
                    {
                        id: 'line-1',
                        productTitle: 'Test Product',
                        quantity: 1,
                        price: 10,
                        total: 10
                    }
                ],
                totalAmount: 10
            },
            isLoading: false,
            updateLine: mockUpdateLine,
            removeLine: mockRemoveLine
        })

        render(<PosCartPanel />)

        // Click quantity button
        fireEvent.click(screen.getByTitle('Edit Quantity'))

        expect(screen.getByTestId('numpad-dialog')).toBeInTheDocument()
        expect(screen.getByText('Set Quantity')).toBeInTheDocument()

        // Confirm value 5
        fireEvent.click(screen.getByText('Confirm 5'))

        expect(mockUpdateLine).toHaveBeenCalledWith({
            lineId: 'line-1',
            quantity: 5
        })
    })

    it('opens numpad for price update', () => {
        ; (usePosCart as jest.Mock).mockReturnValue({
            cart: {
                id: 'cart-1',
                lines: [
                    {
                        id: 'line-1',
                        productTitle: 'Test Product',
                        quantity: 1,
                        price: 10,
                        total: 10
                    }
                ],
                totalAmount: 10
            },
            isLoading: false,
            updateLine: mockUpdateLine,
            removeLine: mockRemoveLine
        })

        render(<PosCartPanel />)

        // Click price button
        fireEvent.click(screen.getByTitle('Edit Price'))

        expect(screen.getByTestId('numpad-dialog')).toBeInTheDocument()
        expect(screen.getByText('Override Price')).toBeInTheDocument()

        // Confirm value 5
        fireEvent.click(screen.getByText('Confirm 5'))

        expect(mockUpdateLine).toHaveBeenCalledWith({
            lineId: 'line-1',
            price: 5
        })
    })

    it('calls removeLine when delete button is clicked', () => {
        ; (usePosCart as jest.Mock).mockReturnValue({
            cart: {
                id: 'cart-1',
                lines: [
                    {
                        id: 'line-1',
                        productTitle: 'Test Product',
                        quantity: 1,
                        price: 10,
                        total: 10
                    }
                ],
                totalAmount: 10
            },
            isLoading: false,
            updateLine: mockUpdateLine,
            removeLine: mockRemoveLine
        })

        render(<PosCartPanel />)

        fireEvent.click(screen.getByTitle('Remove Item'))

        expect(mockRemoveLine).toHaveBeenCalledWith('line-1')
    })
})
