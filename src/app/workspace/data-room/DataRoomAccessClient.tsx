'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    acceptDataRoomTerms,
    getDataRoomContents,
    listMyDataRoomAccessRequests,
    recordDataRoomDocumentView,
    requestDataRoomAccess,
    type DataRoomContentsView,
    type DataRoomDocumentView,
} from '@/modules/data-room/data-room.repository'

function groupByFolder(docs: DataRoomDocumentView[]) {
    const by: Record<string, DataRoomDocumentView[]> = {}
    for (const d of docs) {
        const key = d.folder_id ?? 'root'
        if (!by[key]) by[key] = []
        by[key].push(d)
    }
    return by
}

export default function DataRoomAccessClient() {
    const [startupOrgId, setStartupOrgId] = useState('')
    const [message, setMessage] = useState('')
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [selectedStartupOrgId, setSelectedStartupOrgId] = useState<string | null>(null)
    const [contents, setContents] = useState<DataRoomContentsView | null>(null)
    const [contentsLoading, setContentsLoading] = useState(false)

    const refresh = useCallback(() => {
        setLoading(true)
        listMyDataRoomAccessRequests()
            .then(setRequests)
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    const canView = useMemo(() => Boolean(contents && !('error' in (contents as any))), [contents])

    const handleRequest = useCallback(async () => {
        const id = startupOrgId.trim()
        if (!id) {
            toast.error('Startup org id is required')
            return
        }
        const res = await requestDataRoomAccess({ startupOrgId: id, message: message.trim() || null })
        if (res && typeof res === 'object' && 'error' in res) {
            toast.error(res.error)
            return
        }
        toast.success('Access requested', { description: 'The startup will be notified.' })
        setMessage('')
        refresh()
    }, [startupOrgId, message, refresh])

    const loadContents = useCallback(async (orgId: string) => {
        setSelectedStartupOrgId(orgId)
        setContents(null)
        setContentsLoading(true)
        const res = await getDataRoomContents({ startupOrgId: orgId })
        setContents(res as any)
        setContentsLoading(false)
        if (res && typeof res === 'object' && 'error' in res) {
            toast.error(res.error)
        }
    }, [])

    const handleAcceptTerms = useCallback(async () => {
        if (!selectedStartupOrgId) return
        const res = await acceptDataRoomTerms({ startupOrgId: selectedStartupOrgId })
        if (res && typeof res === 'object' && 'error' in res) {
            toast.error(res.error)
            return
        }
        toast.success('Terms accepted')
        await loadContents(selectedStartupOrgId)
    }, [selectedStartupOrgId, loadContents])

    const handleOpenDoc = useCallback(async (doc: DataRoomDocumentView) => {
        // For now, open file_url in new tab if provided.
        // Analytics: record view.
        await recordDataRoomDocumentView({ documentId: doc.id, seconds: 5 })
        if (doc.file_url) {
            window.open(doc.file_url, '_blank', 'noopener,noreferrer')
        } else {
            toast.message('No file URL available for this document yet.')
        }
    }, [])

    const panelClass = 'border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/40 dark:border-slate-800 dark:bg-slate-900/70'
    const textMainClass = 'text-slate-900 dark:text-slate-100'
    const textMutedClass = 'text-slate-500 dark:text-slate-400'

    return (
        <div className="space-y-6">
            <Card className={panelClass}>
                <CardHeader>
                    <CardTitle className={textMainClass}>Request access</CardTitle>
                    <CardDescription className={textMutedClass}>
                        Paste the startup organization id from the startup profile (we’ll add a button there next).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <div className={`text-xs font-black uppercase tracking-widest ${textMutedClass}`}>Startup org id</div>
                            <Input value={startupOrgId} onChange={(e) => setStartupOrgId(e.target.value)} placeholder="uuid" />
                        </div>
                        <div className="space-y-1.5">
                            <div className={`text-xs font-black uppercase tracking-widest ${textMutedClass}`}>Message (optional)</div>
                            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Intro + why you want access" />
                        </div>
                    </div>
                    <Button onClick={handleRequest} className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
                        Request access
                    </Button>
                </CardContent>
            </Card>

            <Card className={panelClass}>
                <CardHeader>
                    <CardTitle className={textMainClass}>My requests</CardTitle>
                    <CardDescription className={textMutedClass}>Track approvals and open granted data rooms.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className={textMutedClass}>Loading…</p>
                    ) : requests.length === 0 ? (
                        <p className={textMutedClass}>No requests yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {requests.map((r) => (
                                <li key={r.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-slate-950/40">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className={`font-bold ${textMainClass}`}>
                                                {r.startup_org_name ?? 'Startup'}{' '}
                                                <span className={`text-xs font-black uppercase tracking-widest ${textMutedClass}`}>({r.status})</span>
                                            </p>
                                            {r.message ? <p className={`text-sm ${textMutedClass}`}>{r.message}</p> : null}
                                            <p className={`text-xs ${textMutedClass}`}>{r.startup_org_id}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-lg"
                                                onClick={() => loadContents(r.startup_org_id)}
                                            >
                                                Open
                                            </Button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            {selectedStartupOrgId ? (
                <Card className={panelClass}>
                    <CardHeader>
                        <CardTitle className={textMainClass}>Data room contents</CardTitle>
                        <CardDescription className={textMutedClass}>
                            Startup: <span className="font-mono text-xs">{selectedStartupOrgId}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {contentsLoading ? (
                            <p className={textMutedClass}>Loading contents…</p>
                        ) : contents && typeof contents === 'object' && 'error' in (contents as any) ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <p className="font-bold text-amber-900">Access required</p>
                                <p className="text-sm text-amber-800">{(contents as any).error}</p>
                                <p className="mt-2 text-xs text-amber-800">
                                    If you already requested access, wait for approval. You can also check{' '}
                                    <Link className="underline" href="/workspace/notifications">
                                        Notifications
                                    </Link>
                                    .
                                </p>
                            </div>
                        ) : canView && contents ? (
                            <>
                                {contents.grant && !contents.grant.terms_accepted_at ? (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/40">
                                        <p className={`font-bold ${textMainClass}`}>Confidentiality terms</p>
                                        <p className={`mt-1 text-sm ${textMutedClass}`}>
                                            By proceeding you agree not to share, record, or misuse documents. Screenshotting may be possible on some devices.
                                        </p>
                                        <Button onClick={handleAcceptTerms} className="mt-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
                                            I agree, continue
                                        </Button>
                                    </div>
                                ) : null}

                                <div className="space-y-2">
                                    <p className={`text-xs font-black uppercase tracking-widest ${textMutedClass}`}>Documents</p>
                                    {contents.documents.length === 0 ? (
                                        <p className={textMutedClass}>No documents yet.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {contents.documents.map((d) => (
                                                <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/40">
                                                    <div className="min-w-0">
                                                        <p className={`font-bold ${textMainClass}`}>{d.title}</p>
                                                        <p className={`text-xs ${textMutedClass}`}>{d.document_type}</p>
                                                    </div>
                                                    <Button size="sm" className="rounded-lg" onClick={() => handleOpenDoc(d)}>
                                                        View
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </>
                        ) : null}
                    </CardContent>
                </Card>
            ) : null}
        </div>
    )
}

