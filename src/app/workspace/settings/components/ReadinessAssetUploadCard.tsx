'use client'

import { UploadCloud } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatFileSize } from './utils'

type ReadinessAssetUploadCardProps = {
    id: string
    name: string
    label: string
    hint: string
    accept: string
    currentUrl: string
    currentFileName: string
    currentFileSizeBytes: number | null
    currentKindLabel?: string
    removeFieldName: string
    disabled: boolean
    isLight: boolean
    hideLabel?: boolean
}

export function ReadinessAssetUploadCard(input: ReadinessAssetUploadCardProps) {
    const { hideLabel = false } = input
    const shellClass = input.isLight
        ? 'border-slate-200 bg-white/70'
        : 'border-slate-700 bg-slate-950/40'
    const dropzoneClass = input.isLight
        ? 'border-slate-300 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/50'
        : 'border-slate-700 bg-slate-950 hover:border-emerald-500/40 hover:bg-emerald-500/5'
    const textMainClass = input.isLight ? 'text-slate-900' : 'text-slate-100'
    const textMutedClass = input.isLight ? 'text-slate-500' : 'text-slate-400'
    const removeLabelClass = input.isLight
        ? 'border-slate-300 bg-white text-slate-600'
        : 'border-slate-700 bg-slate-900 text-slate-300'

    return (
        <div className={`rounded-2xl border p-4 ${shellClass}`}>
            {!hideLabel && (
                <div className="mb-3 flex items-center justify-between gap-2">
                    <p className={`text-sm font-bold ${textMainClass}`}>{input.label}</p>
                    <Badge variant={input.currentUrl ? 'success' : 'secondary'}>
                        {input.currentUrl ? 'Uploaded' : 'Missing'}
                    </Badge>
                </div>
            )}
            {hideLabel && input.currentUrl && (
                <div className="mb-3 flex items-center justify-end">
                    <Badge variant="success">Uploaded</Badge>
                </div>
            )}
            <label htmlFor={input.id} className={`relative mt-3 block rounded-2xl border border-dashed p-4 transition-all ${dropzoneClass}`}>
                <input
                    id={input.id}
                    name={input.name}
                    type="file"
                    accept={input.accept}
                    disabled={input.disabled}
                    className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
                <div className="pointer-events-none flex items-center gap-3">
                    <div className={`rounded-xl border p-2 ${input.isLight ? 'border-emerald-200 bg-emerald-50' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
                        <UploadCloud className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-[0.12em] ${textMainClass}`}>
                            Drag and drop or click to upload
                        </p>
                        <p className={`mt-1 text-[11px] ${textMutedClass}`}>{input.hint}</p>
                    </div>
                </div>
            </label>

            {input.currentUrl ? (
                <div className={`mt-3 rounded-xl border p-3 ${shellClass}`}>
                    <div className="flex flex-wrap items-center gap-2">
                        {input.currentKindLabel ? <Badge variant="outline">{input.currentKindLabel}</Badge> : null}
                        <a
                            href={input.currentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-xs font-semibold text-emerald-500 hover:underline"
                        >
                            {input.currentFileName || 'Open current asset'}
                        </a>
                    </div>
                    <p className={`mt-1 text-xs ${textMutedClass}`}>{formatFileSize(input.currentFileSizeBytes)}</p>
                    <label className={`mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold ${removeLabelClass}`}>
                        <input
                            type="checkbox"
                            name={input.removeFieldName}
                            value="1"
                            disabled={input.disabled}
                            className="h-3.5 w-3.5 rounded border-slate-300"
                        />
                        Remove current file
                    </label>
                </div>
            ) : null}
        </div>
    )
}
