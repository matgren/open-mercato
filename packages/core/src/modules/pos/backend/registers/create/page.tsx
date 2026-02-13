"use client"

import * as React from 'react'
import { Page, PageHeader, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudField, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { useRouter } from 'next/navigation'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@open-mercato/ui/primitives/button'

export default function PosRegisterCreatePage() {
    const t = useT()
    const router = useRouter()

    const handleSubmit = async (values: any) => {
        const result = await createCrud('pos/registers', values)
        if (result.ok) {
            flash(t('pos.register.created_success', 'Register created successfully'), 'success')
            router.push('/backend/pos/registers')
        }
        return result
    }

    const fields: CrudField[] = [
        {
            name: 'name',
            label: t('common.name'),
            type: 'text',
            required: true,
            placeholder: t('pos.register.name_placeholder', 'Main Checkout'),
        },
        {
            name: 'code',
            label: t('common.code'),
            type: 'text',
            required: true,
            placeholder: t('pos.register.code_placeholder', 'REG-01'),
            description: t('pos.register.code_description', 'Unique identifier for this terminal'),
        },
        {
            name: 'description',
            label: t('common.description'),
            type: 'textarea',
        },
        {
            name: 'isActive',
            label: t('common.active'),
            type: 'switch',
            defaultValue: true,
        },
    ]

    const groups: CrudFormGroup[] = [
        {
            id: 'general',
            title: t('common.general_info'),
            fields: ['name', 'code', 'description'],
        },
        {
            id: 'settings',
            title: t('common.settings'),
            fields: ['isActive'],
        },
    ]

    return (
        <Page>
            <PageHeader
                title={t('pos.register.create_title', 'Create Register')}
                backHref="/backend/pos/registers"
            />
            <PageBody>
                <div className="max-w-2xl mx-auto">
                    <CrudForm
                        fields={fields}
                        groups={groups}
                        onSubmit={handleSubmit}
                        submitLabel={t('common.create')}
                        cancelHref="/backend/pos/registers"
                    />
                </div>
            </PageBody>
        </Page>
    )
}
