import { createScopedApiHelpers } from '@open-mercato/shared/lib/api/scoped'

const { withScopedPayload, parseScopedCommandInput } = createScopedApiHelpers({
  messages: {
    tenantRequired: { key: 'pos.errors.tenant_required', fallback: 'Tenant context is required' },
    organizationRequired: { key: 'pos.errors.organization_required', fallback: 'Organization context is required' },
  },
})

export { withScopedPayload, parseScopedCommandInput }
