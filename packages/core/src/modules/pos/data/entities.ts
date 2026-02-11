import {
  Entity,
  Index,
  PrimaryKey,
  Property,
} from '@mikro-orm/core'

@Entity({ tableName: 'pos_sessions' })
@Index({ name: 'pos_sessions_org_tenant_idx', properties: ['organizationId', 'tenantId'] })
@Index({ name: 'pos_sessions_register_idx', properties: ['registerId', 'organizationId', 'tenantId'] })
@Index({ name: 'pos_sessions_user_idx', properties: ['openedByUserId', 'organizationId', 'tenantId'] })
@Index({ name: 'pos_sessions_status_idx', properties: ['status', 'organizationId', 'tenantId'] })
export class PosSession {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'register_id', type: 'uuid' })
  registerId!: string

  @Property({ name: 'opened_by_user_id', type: 'uuid' })
  openedByUserId!: string

  @Property({ name: 'closed_by_user_id', type: 'uuid', nullable: true })
  closedByUserId?: string | null

  @Property({ name: 'status', type: 'text' })
  status: 'open' | 'closed' | 'suspended' = 'open'

  @Property({ name: 'opened_at', type: Date })
  openedAt!: Date

  @Property({ name: 'closed_at', type: Date, nullable: true })
  closedAt?: Date | null

  @Property({ name: 'opening_float_amount', type: 'numeric', precision: 18, scale: 4 })
  openingFloatAmount!: string

  @Property({ name: 'closing_cash_amount', type: 'numeric', precision: 18, scale: 4, nullable: true })
  closingCashAmount?: string | null

  @Property({ name: 'expected_cash_amount', type: 'numeric', precision: 18, scale: 4, nullable: true })
  expectedCashAmount?: string | null

  @Property({ name: 'variance_amount', type: 'numeric', precision: 18, scale: 4, nullable: true })
  varianceAmount?: string | null

  @Property({ name: 'currency_code', type: 'text' })
  currencyCode!: string

  @Property({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()

  @Property({ name: 'deleted_at', type: Date, nullable: true })
  deletedAt?: Date | null
}
