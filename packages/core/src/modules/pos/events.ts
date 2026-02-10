import { createModuleEvents } from '@open-mercato/shared/modules/events'
import { KnownModuleId } from '#generated/entities.ids.generated'

const events = [
    {
        id: 'pos.session.opened',
        label: 'POS Session Opened',
        description: 'A new terminal session has started.',
        category: 'lifecycle'
    },
    {
        id: 'pos.session.closed',
        label: 'POS Session Closed',
        description: 'A terminal session has ended.',
        category: 'lifecycle'
    },
    {
        id: 'pos.cart.created',
        label: 'POS Cart Created',
        description: 'A new shopping cart has been initialized.',
        category: 'lifecycle'
    },
    {
        id: 'pos.cart.item_added',
        label: 'Item Added to Cart',
        description: 'An item has been added to the POS cart.',
        category: 'lifecycle'
    },
    {
        id: 'pos.cart.completed',
        label: 'POS Transaction Completed',
        description: 'A POS transaction has been finished and an order created.',
        category: 'lifecycle'
    },
    {
        id: 'pos.cash_movement.recorded',
        label: 'Cash Movement Recorded',
        description: 'A cash-in or cash-out event has been logged.',
        category: 'lifecycle'
    },
] as const

export const eventsConfig = createModuleEvents({
    moduleId: 'pos' as KnownModuleId,
    events,
})

export default eventsConfig
