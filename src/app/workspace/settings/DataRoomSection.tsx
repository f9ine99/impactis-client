'use client'

import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { ArrowUpRight, FolderLock, UploadCloud } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ActionFeedback } from '@/components/ui/action-feedback'
import type { BillingMeteredFeatureGateResult } from '@/modules/billing'
import type { StartupDataRoomDocument, StartupDataRoomDocumentType } from '@/modules/startups'
import {
    deleteStartupDataRoomDocumentSectionAction,
    upsertStartupDataRoomDocumentSectionAction,
    type SettingsSectionActionState,
} from './actions'

const initialState: SettingsSectionActionState = {
    error: null,
    success: null,
}

const DATA_ROOM_DOCUMENT_TYPE_OPTIONS: Array<{
    value: StartupDataRoomDocumentType
    label: string
}> = [
        { value: 'pitch_deck', label: 'Pitch Deck (Investor Version)' },
        { value: 'financial_model', label: 'Financial Model' },
        { value: 'cap_table', label: 'Cap Table' },
        { value: 'traction_metrics', label: 'Traction Metrics' },
        { value: 'legal_company_docs', label: 'Legal and Company Docs' },
        { value: 'incorporation_docs', label: 'Incorporation Docs' },
        { value: 'customer_contracts_summaries', label: 'Customer and Contracts Summaries' },
        { value: 'term_sheet_drafts', label: 'Term Sheet Drafts' },
    ]

function formatFileSize(value: number | null): string {
    if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
        return 'Unknown size'
    }

    if (value < 1024 * 1024) {
        return `${Math.max(1, Math.round(value / 1024))} KB`
    }

    return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function getDocumentTypeLabel(value: StartupDataRoomDocumentType): string {
    const entry = DATA_ROOM_DOCUMENT_TYPE_OPTIONS.find((item) => item.value === value)
    return entry?.label ?? value
}

type DataRoomSectionProps = {
    documents: StartupDataRoomDocument[]
    featureGate: BillingMeteredFeatureGateResult | null
    canEdit: boolean
    isLight: boolean
    panelClass: string
    mutedPanelClass: string
    labelClass: string
    textMainClass: string
    textMutedClass: string
    titleMutedClass: string
}

export default function DataRoomSection(input: DataRoomSectionProps) {
    const [uploadState, uploadAction, isUploadPending] = useActionState(
        upsertStartupDataRoomDocumentSectionAction,
        initialState
    )
    const [deleteState, deleteAction, isDeletePending] = useActionState(
        deleteStartupDataRoomDocumentSectionAction,
        initialState
    )

    useEffect(() => {
        if (!uploadState.success) {
            return
        }

        toast.success('Data room document saved', {
            description: uploadState.success,
            duration: 3200,
            id: 'settings-data-room-upload-success',
        })
    }, [uploadState.success])

    useEffect(() => {
        if (!uploadState.error) {
            return
        }

        toast.error('Data room upload failed', {
            description: uploadState.error,
            duration: 4200,
            id: 'settings-data-room-upload-error',
        })
    }, [uploadState.error])

    useEffect(() => {
        if (!deleteState.success) {
            return
        }

        toast.success('Data room document removed', {
            description: deleteState.success,
            duration: 3200,
            id: 'settings-data-room-delete-success',
        })
    }, [deleteState.success])

    useEffect(() => {
        if (!deleteState.error) {
            return
        }

        toast.error('Data room remove failed', {
            description: deleteState.error,
            duration: 4200,
            id: 'settings-data-room-delete-error',
        })
    }, [deleteState.error])

    const uploadedCount = input.documents.length
    const gateBlocked = input.featureGate ? !input.featureGate.allowed : false
    const planLimitLabel = input.featureGate
        ? input.featureGate.unlimited
            ? 'Unlimited'
            : typeof input.featureGate.limit === 'number'
                ? `${input.featureGate.limit} documents`
                : 'Not enabled'
        : 'Not loaded'
    const remainingLabel = input.featureGate
        ? input.featureGate.unlimited
            ? 'Unlimited'
            : `${input.featureGate.remaining ?? 0} documents`
        : 'Not loaded'
    const uploadDisabled = !input.canEdit || isUploadPending || gateBlocked

    return (
        <div className="divide-y divide-slate-200/5">
            {/* Statistics Row */}
            <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8 first:pt-0">
                <div className="md:col-span-1">
                    <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${input.labelClass}`}>
                        Data Room Capacity
                    </label>
                    <p className={`text-sm font-medium leading-relaxed ${input.textMutedClass}`}>
                        Monitor your current usage against plan-based document limits.
                    </p>
                </div>
                <div className="md:col-span-2">
                    <div className="grid gap-3 sm:grid-cols-3 max-w-xl">
                        <div className={`rounded-2xl border p-4 ${input.mutedPanelClass}`}>
                            <p className={`text-[11px] font-black uppercase tracking-widest ${input.titleMutedClass}`}>Diligence Files</p>
                            <p className={`mt-1 text-base font-black ${input.textMainClass}`}>{uploadedCount}</p>
                        </div>
                        <div className={`rounded-2xl border p-4 ${input.mutedPanelClass}`}>
                            <p className={`text-[11px] font-black uppercase tracking-widest ${input.titleMutedClass}`}>Plan Limit</p>
                            <p className={`mt-1 text-base font-black ${input.textMainClass}`}>{input.featureGate?.unlimited ? '∞' : input.featureGate?.limit ?? 0}</p>
                        </div>
                        <div className={`rounded-2xl border p-4 ${input.mutedPanelClass}`}>
                            <p className={`text-[11px] font-black uppercase tracking-widest ${input.titleMutedClass}`}>Remaining</p>
                            <p className={`mt-1 text-base font-black ${input.textMainClass}`}>{input.featureGate?.unlimited ? '∞' : input.featureGate?.remaining ?? 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Information Row */}
            <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                <div className="md:col-span-1">
                    <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${input.labelClass}`}>
                        System Context
                    </label>
                    <p className={`text-sm font-medium leading-relaxed ${input.textMutedClass}`}>
                        Understand the difference between diligence files and readiness inputs.
                    </p>
                </div>
                <div className="md:col-span-2">
                    <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
                        <div className={`rounded-2xl border p-4 ${input.mutedPanelClass}`}>
                            <p className={`text-[11px] font-black uppercase tracking-widest ${input.titleMutedClass}`}>Purpose</p>
                            <p className={`mt-1 text-sm font-black ${input.textMainClass}`}>Investor Diligence</p>
                            <p className={`mt-1 text-[11px] font-bold leading-relaxed ${input.textMutedClass}`}>
                                Store detailed fundraising files for secure external review.
                            </p>
                        </div>
                        <div className={`rounded-2xl border p-4 ${input.mutedPanelClass}`}>
                            <p className={`text-[11px] font-black uppercase tracking-widest ${input.titleMutedClass}`}>Boundary</p>
                            <p className={`mt-1 text-sm font-black ${input.textMainClass}`}>Isolated from Engine</p>
                            <p className={`mt-1 text-[11px] font-bold leading-relaxed ${input.textMutedClass}`}>
                                These files do not influence your Startup Readiness score.
                            </p>
                            <Link
                                href="/workspace/settings?section=settings-startup-readiness"
                                className="mt-2 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-tighter text-emerald-500 hover:underline"
                            >
                                Manage Score Assets <ArrowUpRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {gateBlocked && (
                <div className="py-8">
                    <div className={`rounded-2xl border p-4 max-w-xl ml-auto ${input.isLight ? 'border-rose-200 bg-rose-50' : 'border-rose-500/40 bg-rose-500/10'}`}>
                        <p className={`text-sm font-bold ${input.isLight ? 'text-rose-700' : 'text-rose-300'}`}>
                            Data room upload capacity is currently blocked.
                        </p>
                        <p className={`mt-1 text-sm ${input.isLight ? 'text-rose-700/80' : 'text-rose-300/80'}`}>
                            {input.featureGate?.message}
                        </p>
                        <Link
                            href="/workspace/settings?section=settings-billing"
                            className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${input.isLight
                                ? 'border-rose-200 bg-white text-rose-700 hover:bg-rose-100'
                                : 'border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                                }`}
                        >
                            Upgrade Plan <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            )}

            {/* Upload Row */}
            <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                <div className="md:col-span-1">
                    <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${input.labelClass}`}>
                        Upload Document
                    </label>
                    <p className={`text-sm font-medium leading-relaxed ${input.textMutedClass}`}>
                        Add new files to the data room. New uploads replace old versions of the same type.
                    </p>
                </div>
                <div className="md:col-span-2">
                    <form action={uploadAction} className={`p-5 rounded-2xl border max-w-xl ${input.mutedPanelClass}`}>
                        <div className="grid gap-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={`mb-1.5 block text-[10px] font-black uppercase tracking-widest ${input.titleMutedClass}`}>Document Type</label>
                                    <select
                                        name="dataRoomDocumentType"
                                        defaultValue="pitch_deck"
                                        disabled={uploadDisabled}
                                        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none shadow-sm transition-all focus:border-emerald-500/50 ${input.isLight ? 'border-slate-200 bg-white text-slate-900' : 'border-slate-700 bg-slate-950 text-slate-100'}`}
                                    >
                                        {DATA_ROOM_DOCUMENT_TYPE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={`mb-1.5 block text-[10px] font-black uppercase tracking-widest ${input.titleMutedClass}`}>Internal Title</label>
                                    <input
                                        name="dataRoomDocumentTitle"
                                        defaultValue=""
                                        disabled={uploadDisabled}
                                        placeholder="e.g. Q1 2026 Pitch Deck"
                                        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none shadow-sm transition-all focus:border-emerald-500/50 ${input.isLight ? 'border-slate-200 bg-white text-slate-900' : 'border-slate-700 bg-slate-950 text-slate-100'}`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={`mb-1.5 block text-[10px] font-black uppercase tracking-widest ${input.titleMutedClass}`}>Context or Summary (Optional)</label>
                                <textarea
                                    name="dataRoomDocumentSummary"
                                    defaultValue=""
                                    rows={2}
                                    disabled={uploadDisabled}
                                    placeholder="Add version context for reviewers..."
                                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none shadow-sm transition-all focus:border-emerald-500/50 ${input.isLight ? 'border-slate-200 bg-white text-slate-900' : 'border-slate-700 bg-slate-950 text-slate-100'}`}
                                />
                            </div>
                            <div>
                                <label className={`mb-1.5 block text-[10px] font-black uppercase tracking-widest ${input.titleMutedClass}`}>File Selection (Max 100MB)</label>
                                <input
                                    name="dataRoomDocumentFile"
                                    type="file"
                                    disabled={uploadDisabled}
                                    className={`w-full rounded-xl border px-3 py-2 text-xs font-bold file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-3 file:py-1.5 file:text-[11px] file:font-black file:uppercase file:tracking-widest file:text-white transition-all hover:file:bg-emerald-600 ${input.isLight ? 'border-slate-200 bg-white text-slate-900' : 'border-slate-700 bg-slate-950 text-slate-100'}`}
                                />
                            </div>
                            <div className="flex flex-col gap-4 mt-2">
                                <Button
                                    type="submit"
                                    disabled={uploadDisabled}
                                    className="w-fit h-10 px-8 font-black uppercase tracking-widest shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95"
                                >
                                    {isUploadPending ? 'Synchronizing...' : 'Upload Document'}
                                </Button>
                                {!input.canEdit ? (
                                    <p className={`text-[10px] font-bold text-amber-600/80 uppercase tracking-tighter`}>Requires administrator privileges.</p>
                                ) : null}
                                {uploadState.error ? (
                                    <ActionFeedback tone="error" title="Upload failed" message={uploadState.error} isLight={input.isLight} />
                                ) : null}
                                {uploadState.success ? (
                                    <ActionFeedback tone="success" title="Upload completed" message={uploadState.success} isLight={input.isLight} />
                                ) : null}
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Library Row */}
            <div className="grid gap-4 py-8 md:grid-cols-3 md:gap-8">
                <div className="md:col-span-1">
                    <label className={`mb-1.5 block text-xs font-black uppercase tracking-[0.14em] ${input.labelClass}`}>
                        Document Library
                    </label>
                    <p className={`text-sm font-medium leading-relaxed ${input.textMutedClass}`}>
                        Manage your securely stored diligence files.
                    </p>
                </div>
                <div className="md:col-span-2">
                    {input.documents.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
                            {input.documents.map((document) => (
                                <div key={document.id} className={`rounded-2xl border p-4 transition-all hover:shadow-md ${input.mutedPanelClass}`}>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-[12px] font-black uppercase tracking-tight truncate ${input.textMainClass}`}>{document.title}</p>
                                            <Badge variant="outline" className="h-4 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tighter border-slate-200 text-slate-500">
                                                {document.document_type.split('_').pop()}
                                            </Badge>
                                        </div>
                                        <a
                                            href={document.file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block truncate text-xs font-bold text-emerald-500 hover:underline"
                                        >
                                            {document.file_name || 'Open resource'}
                                        </a>
                                        <p className={`text-[11px] font-bold ${input.textMutedClass}`}>
                                            {formatFileSize(document.file_size_bytes)}
                                            {document.content_type ? ` · ${document.content_type.split('/').pop()?.toUpperCase()}` : ''}
                                        </p>
                                        {document.summary ? (
                                            <p className={`mt-1 text-[11px] font-medium leading-relaxed line-clamp-2 ${input.textMutedClass}`}>{document.summary}</p>
                                        ) : null}
                                        <div className="mt-2 pt-2 border-t border-slate-200/5 flex items-center justify-between gap-2">
                                            <p className={`text-[10px] font-bold text-slate-400 capitalize`}>Updated {new Date(document.updated_at).toLocaleDateString()}</p>
                                            {input.canEdit ? (
                                                <form action={deleteAction}>
                                                    <input type="hidden" name="dataRoomDocumentId" value={document.id} />
                                                    <Button
                                                        type="submit"
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={isDeletePending}
                                                        className="h-6 px-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                                    >
                                                        {isDeletePending ? '...' : 'Remove'}
                                                    </Button>
                                                </form>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`rounded-2xl border border-dashed p-10 text-center max-w-xl ${input.textMutedClass}`}>
                            <p className="text-sm font-bold italic">No documents currently archived in the Data Room.</p>
                        </div>
                    )}
                </div>
            </div>

            {deleteState.error ? (
                <div className="py-4">
                    <ActionFeedback tone="error" title="Remove failed" message={deleteState.error} isLight={input.isLight} />
                </div>
            ) : null}
            {deleteState.success ? (
                <div className="py-4">
                    <ActionFeedback tone="success" title="Document removed" message={deleteState.success} isLight={input.isLight} />
                </div>
            ) : null}
        </div>
    )
}
