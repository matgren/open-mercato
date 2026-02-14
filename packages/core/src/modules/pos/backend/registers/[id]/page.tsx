"use client"

import * as React from 'react'
import { Page, PageHeader, PageBody, CrudForm, LoadingMessage, ErrorMessage, FormHeader, FormFooter, FormActionButtons } from '@open-mercato/ui'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { useRouter } from 'next/navigation'
import { updateCrud } from '@open-mercato/ui/backend/utils/crud'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'

export default function PosRegisterEditPage({ params }: { params: { id: string } }) {
    const t = useT()
    const router = useRouter()

    // Local hook implementation since it's missing in UI pkg
    const [item, setItem] = React.useState<any>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    const mutate = React.useCallback(async () => {
        setIsLoading(true)
        try {
            // Assuming generic entity get endpoint
            const res = await apiCall<any>(`/api/pos/registers?id=${params.id}`, { method: 'GET' })
            if (res.ok && res.result) {
                // Result might be list or item depending on API. 
                // If it's standard crud list, it's items[0] or we use specific GET /id
                // Attempting generic GET /api/pos/registers/ID pattern first or ?id=
                if (res.result.items && Array.isArray(res.result.items)) {
                    setItem(res.result.items.find((i: any) => i.id === params.id) || res.result.items[0])
                } else {
                    setItem(res.result)
                }
            } else {
                setError('Failed to load register')
            }
        } catch (e) {
            setError(String(e))
        } finally {
            setIsLoading(false)
        }
    }, [params.id])

    React.useEffect(() => {
        mutate()
    }, [mutate])


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
