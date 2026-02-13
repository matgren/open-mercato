import { PosCart, PosCartLine } from '../data/entities'

/**
 * Recalculates line-level totals.
 * Note: POS Phase 1 operates with gross prices.
 */
export function recalculateCartLine(line: PosCartLine): void {
    const quantity = parseFloat(line.quantity || '0')
    const unitPrice = parseFloat(line.unitPrice || '0')
    const taxAmount = parseFloat(line.taxAmount || '0')

    // totalAmount = (unitPrice * quantity) + taxAmount
    // Since unitPrice is gross by convention in POS, we still follow the formula:
    // (unitPrice * quantity) is the subtotal, and taxAmount is explicitly passed or calculated.
    // In POS, if unitPrice is gross, taxAmount is often part of it, but our entity 
    // separates them for Sales integration later.

    const totalAmount = (unitPrice * quantity) + taxAmount
    line.totalAmount = totalAmount.toFixed(4)
}

/**
 * Recalculates cart-level totals based on its lines.
 */
export function recalculateCartTotals(cart: PosCart, lines: PosCartLine[]): void {
    let subtotal = 0
    let totalTax = 0

    for (const line of lines) {
        if (line.deletedAt) continue

        const quantity = parseFloat(line.quantity || '0')
        const unitPrice = parseFloat(line.unitPrice || '0')
        const taxAmount = parseFloat(line.taxAmount || '0')

        subtotal += unitPrice * quantity
        totalTax += taxAmount
    }

    const grandTotal = subtotal + totalTax

    cart.subtotalAmount = subtotal.toFixed(4)
    cart.taxAmount = totalTax.toFixed(4)
    cart.grandAmount = grandTotal.toFixed(4)
}
