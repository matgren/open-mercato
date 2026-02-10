import {
    Entity,
    Index,
    PrimaryKey,
    Property,
    Unique,
} from '@mikro-orm/core'

@Entity({ tableName: 'pos_registers' })
@Index({ name: 'pos_registers_org_tenant_idx', properties: ['organizationId', 'tenantId'] })
@Unique({ name: 'pos_registers_code_unique', properties: ['organizationId', 'tenantId', 'code'] })
export class PosRegister {
    @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
    id!: string

    @Property({ name: 'organization_id', type: 'uuid' })
    organizationId!: string

    @Property({ name: 'tenant_id', type: 'uuid' })
    tenantId!: string

    @Property({ type: 'text' })
    name!: string

    @Property({ type: 'text' })
    code!: string

    @Property({ type: 'text', nullable: true })
    description?: string | null

    @Property({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean = true

    @Property({ name: 'metadata', type: 'jsonb', nullable: true })
    metadata?: Record<string, unknown> | null

    @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
    createdAt: Date = new Date()

    @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
    updatedAt: Date = new Date()

    @Property({ name: 'deleted_at', type: Date, nullable: true })
    deletedAt?: Date | null
}
