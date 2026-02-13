"use client"

import * as React from 'react'
import { Page, PageHeader, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudField, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { useRouter } from 'next/navigation'
import { updateCrud, useCrudItem } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { FormHeader, FormFooter, FormActionButtons } from '@open-mercato/ui/backend/forms'

export default function PosRegisterEditPage({ params }: { params: { id: string } }) {
    const t = useT()
    const router = useRouter()
    const { item, isLoading, error, mutate } = useCrudItem('pos/registers', params.id)

    const handleSubmit = async (values: any) => {
        const result = await updateCrud('pos/registers', params.id, values)
        if (result.ok) {
            flash(t('pos.register.updated_success', 'Register updated successfully'), 'success')
            mutate()
        }
        return result
    }

    if (isLoading) return <LoadingMessage />
    if (error) return <ErrorMessage error={error} />
    if (!item) return <ErrorMessage error="Register not found" />

    const fields: CrudField[] = [
        {
            name: 'name',
            label: t('common.name'),
            type: 'text',
            required: true,
            placeholder: t('pos.register.name_placeholder', 'Main Checkout'),
            defaultValue: item.name,
        },
        {
            name: 'code',
            label: t('common.code'),
            type: 'text',
            required: true,
            placeholder: t('pos.register.code_placeholder', 'REG-01'),
            defaultValue: item.code,
            description: t('pos.register.code_description', 'Unique identifier for this terminal'),
        },
        {
            name: 'description',
            label: t('common.description'),
            type: 'textarea',
            defaultValue: item.description,
        },
        {
            name: 'isActive',
            label: t('common.active'),
            type: 'switch',
            defaultValue: item.isActive,
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
                title={t('pos.register.edit_title', 'Edit Register')}
                backHref="/backend/pos/registers"
            />
            <PageBody>
                <div className="max-w-2xl mx-auto">
                    <CrudForm
                        fields={fields}
                        groups={groups}
                        onSubmit={handleSubmit}
                        submitLabel={t('common.save')}
                        cancelHref="/backend/pos/registers"
                        initialValues={item}
                    />
                </div>
            </PageBody>
        </Page>
    )
}
