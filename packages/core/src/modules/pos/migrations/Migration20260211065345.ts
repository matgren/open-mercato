import { Migration } from '@mikro-orm/migrations';

export class Migration20260211065345 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "pos_registers" ("id" uuid not null default gen_random_uuid(), "organization_id" uuid not null, "tenant_id" uuid not null, "name" text not null, "code" text not null, "description" text null, "is_active" boolean not null default true, "metadata" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, constraint "pos_registers_pkey" primary key ("id"));`);
    this.addSql(`create index "pos_registers_org_tenant_idx" on "pos_registers" ("organization_id", "tenant_id");`);
    this.addSql(`alter table "pos_registers" add constraint "pos_registers_code_unique" unique ("organization_id", "tenant_id", "code");`);
  }

}
