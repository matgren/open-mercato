/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { PosProductGrid } from '../PosProductGrid'
import { usePosProducts } from '../../hooks/usePosCatalog'

// Mock the hook
jest.mock('../../hooks/usePosCatalog')
// Mock UI components
jest.mock('@open-mercato/ui/backend/EmptyState', () => ({
    EmptyState: ({ title }: any) => <div>{title}</div>
}), { virtual: true })
jest.mock('@open-mercato/ui/components/card', () => ({
    Card: ({ children, onClick }: any) => <div onClick={onClick} data-testid="card">{children}</div>,
    CardContent: ({ children }: any) => <div>{children}</div>,
    CardFooter: ({ children }: any) => <div>{children}</div>
}), { virtual: true })
jest.mock('@open-mercato/ui/components/badge', () => ({
    Badge: ({ children }: any) => <span>{children}</span>
}), { virtual: true })
jest.mock('@open-mercato/ui/components/button', () => ({
    Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>
}), { virtual: true })
jest.mock('lucide-react', () => ({
    Loader2: () => <div className="animate-spin" />
}), { virtual: true })

const mockUsePosProducts = usePosProducts as jest.MockedFunction<typeof usePosProducts>

describe('PosProductGrid', () => {
    const defaultProps = {
        organizationId: 'org1',
        tenantId: 'tenant1',
        onProductClick: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders loading state', () => {
        mockUsePosProducts.mockReturnValue({
            isLoading: true,
            isError: false,
            data: undefined,
            fetchNextPage: jest.fn(),
            hasNextPage: false,
            isFetchingNextPage: false,
        } as any)

        const { container } = render(<PosProductGrid {...defaultProps} />)
        // Check for loader icon presence by class or role if possible, or just snapshot/basic check
        // The loader uses lucide-react which renders an SVG.
        expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('renders error state', () => {
        mockUsePosProducts.mockReturnValue({
            isLoading: false,
            isError: true,
            data: undefined,
        } as any)

        render(<PosProductGrid {...defaultProps} />)
        expect(screen.getByText('Failed to load products.')).toBeInTheDocument()
    })

    it('renders empty state', () => {
        mockUsePosProducts.mockReturnValue({
            isLoading: false,
            isError: false,
            data: { pages: [{ items: [] }] },
        } as any)

        render(<PosProductGrid {...defaultProps} />)
        expect(screen.getByText('No products found')).toBeInTheDocument()
    })

    it('renders products and handles click', () => {
        const mockProduct = {
            id: '1',
            title: 'Test Product',
            defaultMediaUrl: 'http://example.com/image.jpg',
            variants: [{ isDefault: true, prices: [{ unitPriceGross: 10.5 }] }]
        }

        mockUsePosProducts.mockReturnValue({
            isLoading: false,
            isError: false,
            data: { pages: [{ items: [mockProduct] }] },
            fetchNextPage: jest.fn(),
            hasNextPage: false,
        } as any)

        render(<PosProductGrid {...defaultProps} />)

        expect(screen.getByText('Test Product')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Test Product').closest('div')!) // Click the card or near it

        // Wait, the card click handler is on the Card component.
        // Let's click the title to be safe as it bubbles up
        fireEvent.click(screen.getByText('Test Product'))

        expect(defaultProps.onProductClick).toHaveBeenCalledWith(mockProduct)
    })
})
