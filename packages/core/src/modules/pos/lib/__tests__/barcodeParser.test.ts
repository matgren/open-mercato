import { parseBarcode } from '../barcodeParser'

describe('barcodeParser', () => {
    it('parses standard EAN-13', () => {
        const input = '5012345678900'
        const result = parseBarcode(input)
        expect(result).toEqual({ // Expect specific structure
            type: 'EAN',
            code: '5012345678900',
            original: '5012345678900',
            quantity: 1
        })
    })

    it('parses standard UPC-A', () => {
        const input = '036000291452'
        const result = parseBarcode(input)
        expect(result).toEqual({
            type: 'UPC',
            code: '036000291452',
            original: '036000291452',
            quantity: 1
        })
    })

    it('parses weighted barcode (21 prefix)', () => {
        // 21 IIIII WWWWW C
        // Item: 10001
        // Weight: 00500 (0.500 kg)
        const input = '2110001005009'
        const result = parseBarcode(input)
        expect(result).toEqual({
            type: 'WEIGHTED',
            code: '2110001', // SKU usually includes prefix for lookup keys in some systems, or just 10001. 
            // My implementation uses 21 + ItemCode.
            original: '2110001005009',
            quantity: 0.5
        })
    })

    it('parses weighted barcode with different digits', () => {
        // Item: 99999
        // Weight: 12345 (12.345 kg)
        const input = '2199999123450'
        const result = parseBarcode(input)
        expect(result).toEqual({
            type: 'WEIGHTED',
            code: '2199999',
            original: '2199999123450',
            quantity: 12.345
        })
    })

    it('handles garbage input', () => {
        const input = 'abc-123'
        const result = parseBarcode(input)
        expect(result).toEqual({
            type: 'UNKNOWN',
            code: 'abc-123',
            original: 'abc-123'
        })
    })
})
