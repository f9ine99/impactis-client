'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, ExternalLink, FileText, Send, Loader2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getStartupPublicDiscoveryProfileClient, getUnifiedDiscoveryCardClient } from '@/lib/api/discovery-profile-client'
import {
    createConnectionRequest,
    listOutgoingConnectionRequests,
} from '@/modules/connections/connections.repository'
import { createDealRoomRequest } from '@/modules/deal-room/deal-room.repository'
import type { StartupPublicDiscoveryProfile } from '@/modules/startups/types'
import type { UnifiedDiscoveryCard } from '@/modules/workspace/types'

type ViewerOrgType = 'startup' | 'investor' | 'advisor'

function getConnectionButtonConfig(
    viewerType: ViewerOrgType | null,
    targetType: 'startup' | 'investor' | 'advisor'
): { show: boolean; label: 'Connect' | 'Invite' } | null {
    if (!viewerType || viewerType === targetType) return null
    if (viewerType === 'investor' && targetType === 'startup') return { show: true, label: 'Connect' }
    if (viewerType === 'investor' && targetType === 'advisor') return { show: true, label: 'Connect' }
    if (viewerType === 'startup' && targetType === 'investor') return { show: true, label: 'Invite' }
    if (viewerType === 'startup' && targetType === 'advisor') return { show: true, label: 'Connect' }
    if (viewerType === 'advisor' && (targetType === 'startup' || targetType === 'investor')) return { show: true, label: 'Connect' }
    return null
}

export default function DiscoveryProfilePage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const orgId = typeof params?.startupOrgId === 'string' ? params.startupOrgId.trim() : ''
    const typeParam = searchParams?.get('type') ?? 'startup'
    const viewerTypeParam = searchParams?.get('viewerType') as ViewerOrgType | null
    const orgType = typeParam === 'investor' || typeParam === 'advisor' ? typeParam : 'startup'

    const [startupProfile, setStartupProfile] = useState<StartupPublicDiscoveryProfile | null>(null)
    const [cardProfile, setCardProfile] = useState<UnifiedDiscoveryCard | null>(null)
    const [loading, setLoading] = useState(true)
    const [connectState, setConnectState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
    const [dealState, setDealState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
    const [outgoingToThis, setOutgoingToThis] = useState(false)

    const resolvedToOrgIdRaw =
        (orgType === 'startup' ? startupProfile?.startup_org_id : cardProfile?.org_id) ?? orgId
    const resolvedToOrgId = resolvedToOrgIdRaw?.trim() ?? ''

    useEffect(() => {
        if (!orgId) {
            setLoading(false)
            return
        }
        let cancelled = false
        setLoading(true)
        if (orgType === 'startup') {
            getStartupPublicDiscoveryProfileClient(orgId)
                .then((data) => {
                    if (!cancelled) {
                        setStartupProfile(data ?? null)
                        setCardProfile(null)
                    }
                })
                .finally(() => {
                    if (!cancelled) setLoading(false)
                })
        } else {
            getUnifiedDiscoveryCardClient(orgId)
                .then((data) => {
                    if (!cancelled) {
                        setCardProfile(data ?? null)
                        setStartupProfile(null)
                    }
                })
                .finally(() => {
                    if (!cancelled) setLoading(false)
                })
        }
        return () => { cancelled = true }
    }, [orgId, orgType])

    useEffect(() => {
        if (!orgId) return
        listOutgoingConnectionRequests().then((list) => {
            const has = list.some((r) => r.to_org_id === orgId && r.status === 'pending')
            setOutgoingToThis(has)
        })
    }, [orgId])

    const handleRequestConnect = useCallback(() => {
        if (!resolvedToOrgId || connectState !== 'idle') return
        setConnectState('sending')
        createConnectionRequest({ toOrgId: resolvedToOrgId })
            .then((result) => {
                if ('error' in result) {
                    setConnectState('error')
                    toast.error(result.error || 'Could not send request')
                } else {
                    setConnectState('sent')
                    setOutgoingToThis(true)
                    toast.success('Connection request sent', {
                        description: 'They’ll get a notification and email.',
                    })
                }
            })
            .catch(() => {
                setConnectState('error')
                toast.error('Could not send request')
            })
    }, [resolvedToOrgId, connectState])

    const handleStartDealDiscussion = useCallback(() => {
        if (!orgId || dealState !== 'idle') return
        setDealState('sending')
        createDealRoomRequest({ startupOrgId: orgId })
            .then((result) => {
                if (result && typeof result === 'object' && 'error' in result) {
                    setDealState('error')
                    toast.error(result.error || 'Could not start deal discussion')
                } else {
                    setDealState('sent')
                    toast.success('Deal discussion requested', {
                        description: 'The startup will be notified to accept or decline.',
                    })
                }
            })
            .catch(() => {
                setDealState('error')
                toast.error('Could not start deal discussion')
            })
    }, [orgId, dealState])

    const connectionButtonConfig = getConnectionButtonConfig(viewerTypeParam, orgType)
    const showConnectionButton = connectionButtonConfig?.show && !outgoingToThis && connectState !== 'sent'

    if (!orgId) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
                <p className="text-slate-500">Invalid profile</p>
                <Button asChild variant="outline">
                    <Link href="/workspace/discovery">Back to Discovery</Link>
                </Button>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <p className="text-slate-500">Loading profile…</p>
            </div>
        )
    }

    // Investor or Advisor: card-based detail view
    if (orgType === 'investor' || orgType === 'advisor') {
        if (!cardProfile) {
            return (
                <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
                    <p className="text-slate-500">Profile not found or not visible to you.</p>
                    <Button asChild variant="outline">
                        <Link href="/workspace/discovery">Back to Discovery</Link>
                    </Button>
                </div>
            )
        }
        const imageUrl =
            cardProfile.image_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(cardProfile.name)}&size=400&background=0D9488&color=fff&bold=true`
        return (
            <div className="mx-auto max-w-4xl space-y-8 p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-xl">
                        <Link href="/workspace/discovery">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                        {cardProfile.name}
                    </h1>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80">
                    <div className="relative h-56 w-full bg-slate-100 dark:bg-slate-950">
                        <img
                            src={imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                            <span className="rounded-lg bg-white/90 px-2 py-1 text-xs font-bold uppercase tracking-wide text-slate-700 dark:bg-slate-900/90 dark:text-slate-200">
                                {orgType === 'investor' ? 'Investor' : 'Advisor'}
                            </span>
                            {cardProfile.location && (
                                <span className="ml-2 inline-flex items-center gap-1 text-sm font-medium text-white">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {cardProfile.location}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="space-y-4 p-6">
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            About
                        </h2>
                        {cardProfile.description ? (
                            <p className="text-slate-700 dark:text-slate-300">{cardProfile.description}</p>
                        ) : (
                            <p className="text-slate-500 dark:text-slate-400">No description provided.</p>
                        )}
                        {cardProfile.industry_or_expertise.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {cardProfile.industry_or_expertise.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {outgoingToThis || connectState === 'sent' ? (
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                            Connection request sent. They will be notified.
                        </p>
                    ) : showConnectionButton ? (
                        <Button
                            onClick={handleRequestConnect}
                            disabled={connectState === 'sending'}
                            className="gap-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                        >
                            {connectState === 'sending' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            {connectionButtonConfig!.label}
                        </Button>
                    ) : null}
                    {connectState === 'error' && (
                        <p className="text-sm text-rose-500">Could not send request. Try again.</p>
                    )}
                    <Button variant="outline" asChild className="rounded-xl">
                        <Link href="/workspace/discovery">Back to Discovery</Link>
                    </Button>
                </div>
            </div>
        )
    }

    // Startup: full discovery profile (existing UI)
    if (!startupProfile) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
                <p className="text-slate-500">Startup not found or not published</p>
                <Button asChild variant="outline">
                    <Link href="/workspace/discovery">Back to Discovery</Link>
                </Button>
            </div>
        )
    }

    const { post, profile: bio, data_room_documents } = startupProfile
    const startupConnectionConfig = getConnectionButtonConfig(viewerTypeParam, 'startup')
    const canStartDealDiscussion = viewerTypeParam === 'investor'

    return (
        <div className="mx-auto max-w-4xl space-y-8 p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-xl">
                    <Link href="/workspace/discovery">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {startupProfile.startup_org_name}
                </h1>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white p-6 dark:bg-slate-900/80 space-y-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Discovery post
                </h2>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{post.title}</p>
                <p className="text-slate-600 dark:text-slate-300">{post.summary}</p>
                <div className="flex flex-wrap gap-2">
                    {post.stage && (
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {post.stage}
                        </span>
                    )}
                    {post.location && (
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {post.location}
                        </span>
                    )}
                    {post.industry_tags.slice(0, 5).map((tag) => (
                        <span
                            key={tag}
                            className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                        >
                            #{tag}
                        </span>
                    ))}
                    {post.need_advisor && (
                        <span className="rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                            Seeking advisor
                        </span>
                    )}
                </div>
            </div>

            {(bio.team_overview || bio.business_model || bio.traction_summary) && (
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white p-6 dark:bg-slate-900/80 space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Bio &amp; traction
                    </h2>
                    {bio.team_overview && (
                        <div>
                            <p className="mb-1 text-xs font-bold text-slate-500 dark:text-slate-400">Team</p>
                            <p className="text-slate-700 dark:text-slate-300">{bio.team_overview}</p>
                        </div>
                    )}
                    {bio.business_model && (
                        <div>
                            <p className="mb-1 text-xs font-bold text-slate-500 dark:text-slate-400">Business model</p>
                            <p className="text-slate-700 dark:text-slate-300">{bio.business_model}</p>
                        </div>
                    )}
                    {bio.traction_summary && (
                        <div>
                            <p className="mb-1 text-xs font-bold text-slate-500 dark:text-slate-400">Traction</p>
                            <p className="text-slate-700 dark:text-slate-300">{bio.traction_summary}</p>
                        </div>
                    )}
                </div>
            )}

            {data_room_documents.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white p-6 dark:bg-slate-900/80 space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Data room
                    </h2>
                    <ul className="space-y-2">
                        {data_room_documents.map((doc) => (
                            <li key={doc.id}>
                                {doc.file_url ? (
                                    <a
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-emerald-600 transition-colors hover:bg-emerald-500/10 dark:border-white/10 dark:text-emerald-400"
                                    >
                                        <FileText className="h-4 w-4" />
                                        {doc.title}
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                ) : (
                                    <span className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        <FileText className="h-4 w-4" />
                                        {doc.title} (no file)
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
                {outgoingToThis || connectState === 'sent' ? (
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                        Connection request sent. The startup will be notified.
                    </p>
                ) : startupConnectionConfig?.show ? (
                    <Button
                        onClick={handleRequestConnect}
                        disabled={connectState === 'sending'}
                        className="gap-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                    >
                        {connectState === 'sending' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        {startupConnectionConfig.label}
                    </Button>
                ) : null}
                {canStartDealDiscussion ? (
                    <Button
                        onClick={handleStartDealDiscussion}
                        disabled={dealState === 'sending' || dealState === 'sent'}
                        variant="outline"
                        className="gap-2 rounded-xl"
                        title="Start a Deal Room after the startup accepts"
                    >
                        {dealState === 'sending' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        {dealState === 'sent' ? 'Deal requested' : 'Start Deal Discussion'}
                    </Button>
                ) : null}
                {connectState === 'error' && (
                    <p className="text-sm text-rose-500">Could not send request. Try again.</p>
                )}
                {dealState === 'error' && (
                    <p className="text-sm text-rose-500">Could not start deal discussion. Try again.</p>
                )}
                <Button variant="outline" asChild className="rounded-xl">
                    <Link href="/workspace/discovery">Back to Discovery</Link>
                </Button>
            </div>
        </div>
    )
}
