import { Migration } from '@mikro-orm/migrations';

export class Migration20260213225146 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "pos_carts" ("id" uuid not null default gen_random_uuid(), "organization_id" uuid not null, "tenant_id" uuid not null, "session_id" uuid not null, "status" text not null default 'open', "customer_id" uuid null, "sales_order_id" uuid null, "currency_code" text not null, "subtotal_amount" numeric(18,4) not null default '0', "tax_amount" numeric(18,4) not null default '0', "grand_amount" numeric(18,4) not null default '0', "amount_return" numeric(18,4) not null default '0', "metadata" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, constraint "pos_carts_pkey" primary key ("id"));`);
    this.addSql(`create index "pos_carts_status_idx" on "pos_carts" ("status", "organization_id", "tenant_id");`);
    this.addSql(`create index "pos_carts_session_idx" on "pos_carts" ("session_id", "organization_id", "tenant_id");`);
    this.addSql(`create index "pos_carts_org_tenant_idx" on "pos_carts" ("organization_id", "tenant_id");`);

    this.addSql(`create table "pos_cart_lines" ("id" uuid not null default gen_random_uuid(), "organization_id" uuid not null, "tenant_id" uuid not null, "cart_id" uuid not null, "product_id" uuid not null, "product_variant_id" uuid null, "name" text not null, "description" text null, "quantity" numeric(18,4) not null default '1', "unit_price" numeric(18,4) not null default '0', "tax_amount" numeric(18,4) not null default '0', "total_amount" numeric(18,4) not null default '0', "metadata" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, constraint "pos_cart_lines_pkey" primary key ("id"));`);
    this.addSql(`create index "pos_cart_lines_product_idx" on "pos_cart_lines" ("product_id", "organization_id", "tenant_id");`);
    this.addSql(`create index "pos_cart_lines_cart_idx" on "pos_cart_lines" ("cart_id", "organization_id", "tenant_id");`);
    this.addSql(`create index "pos_cart_lines_org_tenant_idx" on "pos_cart_lines" ("organization_id", "tenant_id");`);

    this.addSql(`create table "pos_payments" ("id" uuid not null default gen_random_uuid(), "organization_id" uuid not null, "tenant_id" uuid not null, "session_id" uuid not null, "cart_id" uuid not null, "sales_payment_id" uuid null, "method" text not null, "amount" numeric(18,4) not null, "currency_code" text not null, "status" text not null default 'authorized', "provider_reference" text null, "change_amount" numeric(18,4) not null default '0', "metadata" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, constraint "pos_payments_pkey" primary key ("id"));`);
    this.addSql(`create index "pos_payments_status_idx" on "pos_payments" ("status", "organization_id", "tenant_id");`);
    this.addSql(`create index "pos_payments_method_idx" on "pos_payments" ("method", "organization_id", "tenant_id");`);
    this.addSql(`create index "pos_payments_cart_idx" on "pos_payments" ("cart_id", "organization_id", "tenant_id");`);
    this.addSql(`create index "pos_payments_session_idx" on "pos_payments" ("session_id", "organization_id", "tenant_id");`);
    this.addSql(`create index "pos_payments_org_tenant_idx" on "pos_payments" ("organization_id", "tenant_id");`);

    this.addSql(`create table "pos_receipts" ("id" uuid not null default gen_random_uuid(), "organization_id" uuid not null, "tenant_id" uuid not null, "cart_id" uuid not null, "receipt_number" text not null, "issued_at" timestamptz not null, "delivery_method" text not null, "recipient" text null, "payload_snapshot" jsonb not null, "metadata" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, constraint "pos_receipts_pkey" primary key ("id"));`);
    this.addSql(`create index "pos_receipts_number_idx" on "pos_receipts" ("receipt_number", "organization_id", "tenant_id");`);
    this.addSql(`create index "pos_receipts_cart_idx" on "pos_receipts" ("cart_id", "organization_id", "tenant_id");`);
    this.addSql(`create index "pos_receipts_org_tenant_idx" on "pos_receipts" ("organization_id", "tenant_id");`);
  }

}
