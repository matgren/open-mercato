/** @jest-environment node */
import { mapPosCartToSalesOrder, mapPosCartLineToSalesOrderLine, mapPosPaymentToSalesPayment } from '../salesBridge'
import { PosCart, PosCartLine, PosPayment } from '../../data/entities'

describe('salesBridge mapping functions', () => {
    describe('mapPosCartToSalesOrder', () => {
        it('maps a basic PosCart to Sales Order data', () => {
            const cart = new PosCart()
            Object.assign(cart, {
                id: 'cart-123',
                organizationId: 'org-1',
                tenantId: 'tenant-1',
                sessionId: 'session-1',
                currencyCode: 'USD',
                subtotalAmount: '100.0000',
                taxAmount: '10.0000',
                grandAmount: '110.0000',
                amountReturn: '0.0000',
                customerId: 'cust-1',
                metadata: { source: 'pos-terminal' }
            })

            const result = mapPosCartToSalesOrder(cart)

            expect(result).toEqual({
                organizationId: 'org-1',
                tenantId: 'tenant-1',
                currencyCode: 'USD',
                customerEntityId: 'cust-1',
                externalReference: 'pos:cart-123',
                subtotalNetAmount: '100.0000',
                subtotalGrossAmount: '100.0000',
                taxTotalAmount: '10.0000',
                grandTotalNetAmount: '100.0000',
                grandTotalGrossAmount: '110.0000',
                paidTotalAmount: '110.0000',
                metadata: {
                    source: 'pos-terminal',
                    posCartId: 'cart-123',
                    posSessionId: 'session-1',
                },
            })
        })

        it('calculates paidTotalAmount correctly when overpaid', () => {
            const cart = new PosCart()
            Object.assign(cart, {
                grandAmount: '110.0000',
                amountReturn: '90.0000'
            })
            const result = mapPosCartToSalesOrder(cart)
            expect(result.paidTotalAmount).toBe('20.0000')
        })
    })

    describe('mapPosCartLineToSalesOrderLine', () => {
        it('maps a PosCartLine correctly', () => {
            const line = new PosCartLine()
            Object.assign(line, {
                id: 'line-1',
                organizationId: 'org-1',
                tenantId: 'tenant-1',
                productId: 'prod-1',
                name: 'Test Product',
                quantity: '2.0000',
                unitPrice: '50.0000', // Gross by POS convention
                taxAmount: '10.0000',
                totalAmount: '110.0000',
                metadata: { sku: 'ABC' }
            })

            const result = mapPosCartLineToSalesOrderLine(line)

            // totalGross = 50 * 2 = 100
            // totalNet = 100 - 10 = 90
            // unitPriceNet = 90 / 2 = 45
            expect(result).toEqual({
                organizationId: 'org-1',
                tenantId: 'tenant-1',
                productId: 'prod-1',
                productVariantId: null,
                name: 'Test Product',
                description: null,
                quantity: '2.0000',
                unitPriceNet: '45.0000',
                unitPriceGross: '50.0000',
                taxAmount: '10.0000',
                totalNetAmount: '90.0000',
                totalGrossAmount: '100.0000',
                metadata: {
                    sku: 'ABC',
                    posCartLineId: 'line-1',
                },
            })
        })
    })

    describe('mapPosPaymentToSalesPayment', () => {
        it('maps a PosPayment correctly', () => {
            const payment = new PosPayment()
            Object.assign(payment, {
                id: 'pay-1',
                organizationId: 'org-1',
                tenantId: 'tenant-1',
                sessionId: 'session-1',
                method: 'cash',
                amount: '110.0000',
                currencyCode: 'USD',
                providerReference: 'REF-123',
                changeAmount: '10.0000',
                metadata: { note: 'tendered' }
            })

            const result = mapPosPaymentToSalesPayment(payment)

            expect(result).toEqual({
                organizationId: 'org-1',
                tenantId: 'tenant-1',
                amount: '110.0000',
                currencyCode: 'USD',
                paymentMethodCode: 'cash',
                externalReference: 'REF-123',
                metadata: {
                    note: 'tendered',
                    posPaymentId: 'pay-1',
                    posSessionId: 'session-1',
                    changeAmount: '10.0000',
                },
            })
        })
    })
})
