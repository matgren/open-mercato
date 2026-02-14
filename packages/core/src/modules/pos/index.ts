import type { ModuleInfo } from '@open-mercato/shared/modules/registry'
import './commands'

export const metadata: ModuleInfo = {
    name: 'pos',
    title: 'Point of Sale',
    version: '0.1.0',
    description: 'Retail terminal for sales, session management, and receipts.',
    author: 'Open Mercato Team',
    license: 'Proprietary',
    requires: ['sales', 'catalog'],
}

export { features } from './acl'
export { eventsConfig as events } from './events'
export { setup } from './setup'

export * as api from './api'

export const backendRoutes = [
    {
        title: 'Registers',
        pattern: '/backend/pos/registers',
        group: 'Point of Sale',
        requireFeatures: ['pos.register.view'],
    },
    {
        title: 'Terminal',
        pattern: '/backend/pos/checkout',
        group: 'Point of Sale',
        requireFeatures: ['pos.session.view'],
    },
]
