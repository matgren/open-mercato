import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedPosDefaults } from './lib/seeds'

export const setup: ModuleSetupConfig = {
    seedDefaults: async (ctx) => {
        const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
        await seedPosDefaults(ctx.em, scope)
    },

    defaultRoleFeatures: {
        admin: ['pos.*'],
        employee: [
            'pos.session.open',
            'pos.session.close',
            'pos.cart.manage',
            'pos.cart.complete',
            'pos.cash.movement',
        ],
    },
}

export default setup
