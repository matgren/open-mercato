/** @jest-environment jsdom */
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePosCategories, usePosProducts } from '../usePosCatalog'

// Mock global fetch
global.fetch = jest.fn()

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    })
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient} > {children} </QueryClientProvider>
    )
}

describe('usePosCatalog', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('usePosCategories', () => {
        it('fetches categories successfully', async () => {
            const mockCategories = [{ id: '1', name: 'Drinks' }]
                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ items: mockCategories }),
                })

            const { result } = renderHook(() => usePosCategories(), {
                wrapper: createWrapper(),
            })

            await waitFor(() => expect(result.current.isSuccess).toBe(true))

            expect(result.current.data).toEqual(mockCategories)
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/catalog/product-categories?parentId=null&isActive=true')
            )
        })
    })

    describe('usePosProducts', () => {
        it('fetches products successfully', async () => {
            const mockProducts = {
                items: [{ id: '1', title: 'Cola' }],
                total: 10,
            }
                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockProducts,
                })

            const { result } = renderHook(() => usePosProducts({}), {
                wrapper: createWrapper(),
            })

            await waitFor(() => expect(result.current.isSuccess).toBe(true))

            expect(result.current.data?.pages[0]).toEqual(mockProducts)
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/catalog/products')
            )
        })

        it('passes filters correctly', async () => {
            const mockProducts = { items: [], total: 0 }
                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockProducts,
                })

            const { result } = renderHook(
                () => usePosProducts({ categoryId: 'cat1', search: 'test' }),
                { wrapper: createWrapper() }
            )

            await waitFor(() => expect(result.current.isSuccess).toBe(true))

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringMatching(/categoryId=cat1/)
            )
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringMatching(/search=test/)
            )
        })
    })
})
