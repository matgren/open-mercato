import { EntityManager } from '@mikro-orm/postgresql'
import { SalesChannel, SalesPaymentMethod } from '@open-mercato/core/modules/sales/data/entities'

export async function seedPosDefaults(em: EntityManager, scope: { tenantId: string, organizationId: string }) {
    // Seed POS Sales Channel
    const channel = await em.findOne(SalesChannel, {
        code: 'pos',
        organizationId: scope.organizationId,
        tenantId: scope.tenantId
    })

    if (!channel) {
        em.create(SalesChannel, {
            ...scope,
            name: 'POS Terminal',
            code: 'pos',
            isActive: true,
        } as any)
    }

    // Seed Payment Methods
    const paymentMethods = [
        { code: 'cash', name: 'Cash' },
        { code: 'card', name: 'Card' },
    ]

    for (const pm of paymentMethods) {
        const existing = await em.findOne(SalesPaymentMethod, {
            code: pm.code,
            organizationId: scope.organizationId,
            tenantId: scope.tenantId
        })

        if (!existing) {
            em.create(SalesPaymentMethod, {
                ...scope,
                name: pm.name,
                code: pm.code,
                isActive: true,
            } as any)
        }
    }
}
