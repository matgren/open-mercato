"use client"

import * as React from 'react'
import { Page, PageHeader, PageBody, DataTable, RowActions, TruncatedCell, BooleanIcon, FilterBar } from '@open-mercato/ui'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { Button } from '@open-mercato/ui/primitives/button'
import { Plus, Edit, Trash } from 'lucide-react'
import Link from 'next/link'
import { deleteCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'

export default function PosRegisterListPage() {
    const t = useT()

    const filters: FilterDef[] = [
        {
            id: 'search',
            type: 'text',
            label: t('common.search'),
            placeholder: t('pos.register.search_placeholder', 'Search by name or code...'),
        },
        {
            id: 'isActive',
            type: 'select',
            label: t('common.status'),
            options: [
                { value: 'true', label: t('common.active') },
                { value: 'false', label: t('common.inactive') },
            ],
        },
    ]

    const columns = [
        {
            accessorKey: 'name',
            header: t('common.name'),
            cell: ({ row }: any) => (
                <Link href={`/backend/pos/registers/${row.original.id}`} className="hover:underline font-medium">
                    {row.original.name}
                </Link>
            ),
        },
        {
            accessorKey: 'code',
            header: t('common.code'),
        },
        {
            accessorKey: 'isActive',
            header: t('common.active'),
            cell: ({ getValue }: any) => <BooleanIcon value={getValue()} />,
            meta: { align: 'center' as const, width: 80 },
        },
        {
            accessorKey: 'description',
            header: t('common.description'),
            cell: ({ getValue }: any) => <TruncatedCell value={getValue()} />,
            meta: { maxWidth: 300, truncate: true },
        },
        {
            accessorKey: 'createdAt',
            header: t('common.created_at'),
            // TODO: Check if DateCell exists or use simple formatter
            cell: ({ getValue }: any) => getValue() ? new Date(getValue()).toLocaleDateString() : '-',
        },
        {
            id: 'actions',
            cell: ({ row, table }: any) => (
                <RowActions
                    actions={[
                        {
                            id: 'edit',
                            label: t('common.edit'),
                            icon: Edit,
                            href: `/backend/pos/registers/${row.original.id}`,
                        },
                        {
                            id: 'delete',
                            label: t('common.delete'),
                            icon: Trash,
                            variant: 'destructive',
                            onSelect: async () => {
                                if (!confirm(t('common.confirm_delete'))) return
                                const result = await deleteCrud('pos/registers', { id: row.original.id })
                                if (result.ok) {
                                    flash(t('common.deleted_successfully'), 'success')
                                    table.options.meta?.refresh?.()
                                } else {
                                    flash(t('common.delete_failed'), 'error')
                                }
                            }
                        }
                    ]}
                />
            ),
        }
    ]

    return (
        <Page>
            <PageHeader
                title={t('pos.register.list_title', 'Registers')}
                description={t('pos.register.list_description', 'Manage point of sale terminals')}
            >
                <Link href="/backend/pos/registers/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('common.create')}
                    </Button>
                </Link>
            </PageHeader>
            <PageBody>
                <FilterBar filters={filters} />
                <DataTable
                    endpoint="pos/registers"
                    columns={columns}
                    storageKey="pos-registers-list"
                />
            </PageBody>
        </Page>
    )
}
