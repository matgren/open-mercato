import { Migration } from '@mikro-orm/migrations';

export class Migration20260212085331 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "pos_cash_movements" ("id" uuid not null default gen_random_uuid(), "organization_id" uuid not null, "tenant_id" uuid not null, "session_id" uuid not null, "type" text not null, "amount" numeric(18,4) not null, "reason" text not null, "reference" text null, "created_by_user_id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, constraint "pos_cash_movements_pkey" primary key ("id"));`);
    this.addSql(`create index "pos_cash_movements_user_idx" on "pos_cash_movements" ("created_by_user_id", "organization_id", "tenant_id");`);
    this.addSql(`create index "pos_cash_movements_type_idx" on "pos_cash_movements" ("type", "organization_id", "tenant_id");`);
    this.addSql(`create index "pos_cash_movements_session_idx" on "pos_cash_movements" ("session_id", "organization_id", "tenant_id");`);
    this.addSql(`create index "pos_cash_movements_org_tenant_idx" on "pos_cash_movements" ("organization_id", "tenant_id");`);

    this.addSql(`create table "pos_registers" ("id" uuid not null default gen_random_uuid(), "organization_id" uuid not null, "tenant_id" uuid not null, "name" text not null, "code" text not null, "description" text null, "is_active" boolean not null default true, "metadata" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, constraint "pos_registers_pkey" primary key ("id"));`);
    this.addSql(`create index "pos_registers_org_tenant_idx" on "pos_registers" ("organization_id", "tenant_id");`);
    this.addSql(`alter table "pos_registers" add constraint "pos_registers_code_unique" unique ("organization_id", "tenant_id", "code");`);

    this.addSql(`create table "pos_sessions" ("id" uuid not null default gen_random_uuid(), "organization_id" uuid not null, "tenant_id" uuid not null, "register_id" uuid not null, "opened_by_user_id" uuid not null, "closed_by_user_id" uuid null, "status" text not null default 'open', "opened_at" timestamptz not null, "closed_at" timestamptz null, "opening_float_amount" numeric(18,4) not null, "closing_cash_amount" numeric(18,4) null, "expected_cash_amount" numeric(18,4) null, "variance_amount" numeric(18,4) null, "currency_code" text not null, "metadata" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, constraint "pos_sessions_pkey" primary key ("id"));`);
    this.addSql(`create index "pos_sessions_status_idx" on "pos_sessions" ("status", "organization_id", "tenant_id");`);
    this.addSql(`create index "pos_sessions_user_idx" on "pos_sessions" ("opened_by_user_id", "organization_id", "tenant_id");`);
    this.addSql(`create index "pos_sessions_register_idx" on "pos_sessions" ("register_id", "organization_id", "tenant_id");`);
    this.addSql(`create index "pos_sessions_org_tenant_idx" on "pos_sessions" ("organization_id", "tenant_id");`);
  }

}
