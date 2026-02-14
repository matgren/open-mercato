"use client"

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { useT } from '@open-mercato/shared/lib/i18n/context'

export default function PosCheckoutPage() {
    const t = useT()

    return (
        <Page>
            <PageBody>
                <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                    <h1 className="text-2xl font-bold mb-4">POS Checkout</h1>
                    <p>Initial checkout page scaffold.</p>
                </div>
            </PageBody>
        </Page>
    )
}
