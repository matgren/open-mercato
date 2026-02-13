import { PosCart, PosCartLine, PosPayment } from '../data/entities'

/**
 * Maps a POS Cart to a Sales Order draft.
 * NO direct ORM relationships; returns a plain object.
 */
export function mapPosCartToSalesOrder(cart: PosCart) {
    return {
        organizationId: cart.organizationId,
        tenantId: cart.tenantId,
        currencyCode: cart.currencyCode,
        customerEntityId: cart.customerId ?? null,
        externalReference: `pos:${cart.id}`,
        subtotalNetAmount: cart.subtotalAmount,
        subtotalGrossAmount: cart.subtotalAmount, // In POS Phase 1, subtotal is gross
        taxTotalAmount: cart.taxAmount,
        grandTotalNetAmount: cart.subtotalAmount,
        grandTotalGrossAmount: cart.grandAmount,
        paidTotalAmount: (parseFloat(cart.grandAmount) - parseFloat(cart.amountReturn)).toFixed(4),
        metadata: {
            ...cart.metadata,
            posCartId: cart.id,
            posSessionId: cart.sessionId,
        },
    }
}

/**
 * Maps a POS Cart Line to a Sales Order Line draft.
 */
export function mapPosCartLineToSalesOrderLine(line: PosCartLine) {
    const quantity = parseFloat(line.quantity || '0')
    const unitPriceGross = parseFloat(line.unitPrice || '0')
    const taxAmount = parseFloat(line.taxAmount || '0')
    
    // In POS, unitPrice is gross. SalesOrderLine expects unitPriceNet + taxRate/taxAmount.
    // unitPriceNet = (unitPriceGross * quantity - taxAmount) / quantity
    const totalGross = unitPriceGross * quantity
    const totalNet = totalGross - taxAmount
    const unitPriceNet = quantity > 0 ? totalNet / quantity : 0

    return {
        organizationId: line.organizationId,
        tenantId: line.tenantId,
        productId: line.productId,
        productVariantId: line.productVariantId ?? null,
        name: line.name,
        description: line.description ?? null,
        quantity: line.quantity,
        unitPriceNet: unitPriceNet.toFixed(4),
        unitPriceGross: line.unitPrice,
        taxAmount: line.taxAmount,
        totalNetAmount: totalNet.toFixed(4),
        totalGrossAmount: totalGross.toFixed(4),
        metadata: {
            ...line.metadata,
            posCartLineId: line.id,
        },
    }
}

/**
 * Maps a POS Payment to a Sales Payment draft.
 */
export function mapPosPaymentToSalesPayment(payment: PosPayment) {
    return {
        organizationId: payment.organizationId,
        tenantId: payment.tenantId,
        amount: payment.amount,
        currencyCode: payment.currencyCode,
        paymentMethodCode: payment.method === 'cash' ? 'cash' : 'card', // Simple mapping for Phase 1
        externalReference: payment.providerReference,
        metadata: {
            ...payment.metadata,
            posPaymentId: payment.id,
            posSessionId: payment.sessionId,
            changeAmount: payment.changeAmount,
        },
    }
}
