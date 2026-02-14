export interface ParsedBarcode {
    type: 'EAN' | 'UPC' | 'WEIGHTED' | 'UNKNOWN'
    code: string
    quantity?: number // For weighted (e.g. 1.250 kg)
    original: string
}

export function parseBarcode(input: string): ParsedBarcode {
    const code = input.trim()

    // Basic EAN-13 / UPC-A
    if (/^\d{12,13}$/.test(code)) {
        // Check for weighted barcode prefix (starts with 21-29 typically)
        // Standard variable weight prefix is usually 21-29 in many systems
        // Format: PP IIIII WWWWW C
        // P: Prefix (2 digits)
        // I: Item Code (5 digits)
        // W: Weight/Price (5 digits)
        // C: Checksum (1 digit)

        if (code.startsWith('21') && code.length === 13) {
            const itemCode = code.substring(2, 7)
            const weightPart = code.substring(7, 12)
            const weight = parseInt(weightPart, 10) / 1000 // Assumes 3 decimals (grams to kg) or similar. 
            // SPEC-022 doesn't strictly define the weight format, but standard is usually 5 digits.
            // Let's assume standard kilogram format: 01250 = 1.250kg

            return {
                type: 'WEIGHTED',
                code: `21${itemCode}`, // The product SKU usually matches the prefix + item code without weight
                quantity: weight,
                original: code
            }
        }

        return {
            type: code.length === 13 ? 'EAN' : 'UPC',
            code,
            quantity: 1,
            original: code
        }
    }

    return {
        type: 'UNKNOWN',
        code,
        original: code
    }
}
