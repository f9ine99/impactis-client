import type { SupabaseClient } from '@supabase/supabase-js'
import { apiRequest } from '@/lib/api/rest-client'
import type {
    StartupDataRoomDocument,
    StartupDataRoomDocumentType,
    StartupPitchDeckMediaKind,
    StartupPost,
    StartupPostStatus,
    StartupProfile,
    StartupReadiness,
    StartupReadinessSectionScore,
    StartupReadinessStep,
} from './types'

const STARTUP_READINESS_STEPS = new Set<StartupReadinessStep>([
    'upload_pitch_deck',
    'add_team_info',
    'upload_financial_doc',
    'upload_legal_doc',
    'complete_profile_70',
    'reach_score_60',
    'upload_required_docs',
])
const STARTUP_POST_STATUSES = new Set<StartupPostStatus>(['draft', 'published'])
const STARTUP_PITCH_DECK_MEDIA_KINDS = new Set<StartupPitchDeckMediaKind>(['document', 'video'])
const STARTUP_DATA_ROOM_DOCUMENT_TYPES = new Set<StartupDataRoomDocumentType>([
    'pitch_deck',
    'financial_model',
    'cap_table',
    'traction_metrics',
    'legal_company_docs',
    'incorporation_docs',
    'customer_contracts_summaries',
    'term_sheet_drafts',
])

type StartupReadinessRow = {
    startup_org_id: string
    has_startup_post: boolean | null
    has_pitch_deck: boolean | null
    has_team_info: boolean | null
    has_financial_doc: boolean | null
    has_legal_doc: boolean | null
    profile_completion_percent: number | null
    readiness_score: number | null
    required_docs_uploaded: boolean | null
    eligible_for_discovery_post: boolean | null
    is_ready: boolean | null
    missing_steps: string[] | null
    section_scores: unknown
}

type StartupProfileRow = {
    startup_org_id: string
    website_url: string | null
    pitch_deck_url: string | null
    pitch_deck_media_kind: string | null
    pitch_deck_file_name: string | null
    pitch_deck_file_size_bytes: number | null
    team_overview: string | null
    company_stage: string | null
    founding_year: number | null
    team_size: number | null
    target_market: string | null
    business_model: string | null
    traction_summary: string | null
    financial_summary: string | null
    legal_summary: string | null
    financial_doc_url: string | null
    financial_doc_file_name: string | null
    financial_doc_file_size_bytes: number | null
    legal_doc_url: string | null
    legal_doc_file_name: string | null
    legal_doc_file_size_bytes: number | null
    updated_at: string | null
}

type StartupPostRow = {
    id: string
    startup_org_id: string
    title: string
    summary: string
    stage: string | null
    location: string | null
    industry_tags: string[] | null
    status: string
    published_at: string | null
    updated_at: string
}

type StartupDataRoomDocumentRow = {
    id: string
    startup_org_id: string
    document_type: string
    title: string
    file_url: string
    file_name: string | null
    file_size_bytes: number | null
    content_type: string | null
    summary: string | null
    created_at: string
    updated_at: string
}

type StartupMutationResult = {
    success: boolean
    message: string | null
    postId?: string | null
}

async function getAccessToken(supabase: SupabaseClient): Promise<string | null> {
    const {
        data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token ?? null
}

function normalizeText(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function normalizeUuid(value: unknown): string | null {
    const normalized = normalizeText(value)
    if (!normalized) {
        return null
    }

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)
        ? normalized
        : null
}

function normalizeBoolean(value: unknown): boolean {
    return value === true
}

function normalizeNumber(value: unknown): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return 0
    }

    if (value < 0) {
        return 0
    }

    if (value > 100) {
        return 100
    }

    return Math.round(value)
}

function normalizeArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return []
    }

    return Array.from(
        new Set(
            value
                .filter((item): item is string => typeof item === 'string')
                .map((item) => item.trim())
                .filter((item) => item.length > 0)
        )
    )
}

function normalizeNullableNumber(value: unknown): number | null {
    if (typeof value === 'number' && !Number.isNaN(value)) {
        return Math.round(value)
    }

    if (typeof value === 'string') {
        const parsed = Number.parseInt(value.trim(), 10)
        if (Number.isFinite(parsed)) {
            return parsed
        }
    }

    return null
}

function normalizeMissingSteps(value: unknown): StartupReadinessStep[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim().toLowerCase())
        .filter((item): item is StartupReadinessStep => STARTUP_READINESS_STEPS.has(item as StartupReadinessStep))
}

function normalizeSectionScores(value: unknown): StartupReadinessSectionScore[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map((item): StartupReadinessSectionScore | null => {
            if (!item || typeof item !== 'object') {
                return null
            }

            const row = item as Record<string, unknown>
            const section = normalizeText(row.section)
            if (!section) {
                return null
            }

            return {
                section,
                weight: normalizeNumber(row.weight),
                completion_percent: normalizeNumber(row.completion_percent),
                score_contribution: normalizeNumber(row.score_contribution),
            }
        })
        .filter((item): item is StartupReadinessSectionScore => !!item)
}

function normalizeStartupPostStatus(value: unknown): StartupPostStatus | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return STARTUP_POST_STATUSES.has(normalized as StartupPostStatus)
        ? (normalized as StartupPostStatus)
        : null
}

function normalizeStartupPitchDeckMediaKind(value: unknown): StartupPitchDeckMediaKind | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return STARTUP_PITCH_DECK_MEDIA_KINDS.has(normalized as StartupPitchDeckMediaKind)
        ? (normalized as StartupPitchDeckMediaKind)
        : null
}

function normalizeStartupDataRoomDocumentType(value: unknown): StartupDataRoomDocumentType | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return STARTUP_DATA_ROOM_DOCUMENT_TYPES.has(normalized as StartupDataRoomDocumentType)
        ? (normalized as StartupDataRoomDocumentType)
        : null
}

function mapStartupReadiness(row: StartupReadinessRow): StartupReadiness | null {
    const startupOrgId = normalizeText(row.startup_org_id)
    if (!startupOrgId) {
        return null
    }

    return {
        startup_org_id: startupOrgId,
        has_startup_post: normalizeBoolean(row.has_startup_post),
        has_pitch_deck: normalizeBoolean(row.has_pitch_deck),
        has_team_info: normalizeBoolean(row.has_team_info),
        has_financial_doc: normalizeBoolean(row.has_financial_doc),
        has_legal_doc: normalizeBoolean(row.has_legal_doc),
        profile_completion_percent: normalizeNumber(row.profile_completion_percent),
        readiness_score: normalizeNumber(row.readiness_score),
        required_docs_uploaded: normalizeBoolean(row.required_docs_uploaded),
        eligible_for_discovery_post: normalizeBoolean(row.eligible_for_discovery_post),
        is_ready: normalizeBoolean(row.is_ready),
        missing_steps: normalizeMissingSteps(row.missing_steps),
        section_scores: normalizeSectionScores(row.section_scores),
    }
}

function mapStartupProfile(row: StartupProfileRow): StartupProfile | null {
    const startupOrgId = normalizeText(row.startup_org_id)
    if (!startupOrgId) {
        return null
    }

    return {
        startup_org_id: startupOrgId,
        website_url: normalizeText(row.website_url),
        pitch_deck_url: normalizeText(row.pitch_deck_url),
        pitch_deck_media_kind: normalizeStartupPitchDeckMediaKind(row.pitch_deck_media_kind),
        pitch_deck_file_name: normalizeText(row.pitch_deck_file_name),
        pitch_deck_file_size_bytes: normalizeNullableNumber(row.pitch_deck_file_size_bytes),
        team_overview: normalizeText(row.team_overview),
        company_stage: normalizeText(row.company_stage),
        founding_year: normalizeNullableNumber(row.founding_year),
        team_size: normalizeNullableNumber(row.team_size),
        target_market: normalizeText(row.target_market),
        business_model: normalizeText(row.business_model),
        traction_summary: normalizeText(row.traction_summary),
        financial_summary: normalizeText(row.financial_summary),
        legal_summary: normalizeText(row.legal_summary),
        financial_doc_url: normalizeText(row.financial_doc_url),
        financial_doc_file_name: normalizeText(row.financial_doc_file_name),
        financial_doc_file_size_bytes: normalizeNullableNumber(row.financial_doc_file_size_bytes),
        legal_doc_url: normalizeText(row.legal_doc_url),
        legal_doc_file_name: normalizeText(row.legal_doc_file_name),
        legal_doc_file_size_bytes: normalizeNullableNumber(row.legal_doc_file_size_bytes),
        updated_at: normalizeText(row.updated_at),
    }
}

function mapStartupPost(row: StartupPostRow): StartupPost | null {
    const startupOrgId = normalizeText(row.startup_org_id)
    const id = normalizeText(row.id)
    const title = normalizeText(row.title)
    const summary = normalizeText(row.summary)
    const status = normalizeStartupPostStatus(row.status)

    if (!startupOrgId || !id || !title || !summary || !status) {
        return null
    }

    return {
        id,
        startup_org_id: startupOrgId,
        title,
        summary,
        stage: normalizeText(row.stage),
        location: normalizeText(row.location),
        industry_tags: normalizeArray(row.industry_tags),
        status,
        published_at: normalizeText(row.published_at),
        updated_at: row.updated_at,
    }
}

function mapStartupDataRoomDocument(row: StartupDataRoomDocumentRow): StartupDataRoomDocument | null {
    const id = normalizeUuid(row.id)
    const startupOrgId = normalizeUuid(row.startup_org_id)
    const documentType = normalizeStartupDataRoomDocumentType(row.document_type)
    const title = normalizeText(row.title)
    const fileUrl = normalizeText(row.file_url)
    const createdAt = normalizeText(row.created_at)
    const updatedAt = normalizeText(row.updated_at)
    if (!id || !startupOrgId || !documentType || !title || !fileUrl || !createdAt || !updatedAt) {
        return null
    }

    return {
        id,
        startup_org_id: startupOrgId,
        document_type: documentType,
        title,
        file_url: fileUrl,
        file_name: normalizeText(row.file_name),
        file_size_bytes: normalizeNullableNumber(row.file_size_bytes),
        content_type: normalizeText(row.content_type),
        summary: normalizeText(row.summary),
        created_at: createdAt,
        updated_at: updatedAt,
    }
}

export async function getStartupReadinessForCurrentUser(
    supabase: SupabaseClient
): Promise<StartupReadiness | null> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        console.warn('[startups] Failed to load startup readiness: missing access token')
        return null
    }

    const row = await apiRequest<StartupReadinessRow | null>({
        path: '/startups/readiness',
        method: 'GET',
        accessToken,
    })
    if (!row) {
        console.warn('[startups] Failed to load startup readiness')
        return null
    }
    return mapStartupReadiness(row)
}

export async function getStartupProfileForCurrentUser(
    supabase: SupabaseClient
): Promise<StartupProfile | null> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        console.warn('[startups] Failed to load startup profile: missing access token')
        return null
    }

    const row = await apiRequest<StartupProfileRow | null>({
        path: '/startups/profile',
        method: 'GET',
        accessToken,
    })
    if (!row) {
        console.warn('[startups] Failed to load startup profile')
        return null
    }
    return mapStartupProfile(row)
}

export async function upsertStartupProfileForCurrentUser(
    supabase: SupabaseClient,
    input: {
        websiteUrl?: string | null
        pitchDeckUrl?: string | null
        pitchDeckMediaKind?: StartupPitchDeckMediaKind | null
        pitchDeckFileName?: string | null
        pitchDeckFileSizeBytes?: number | null
        teamOverview?: string | null
        companyStage?: string | null
        foundingYear?: number | null
        teamSize?: number | null
        targetMarket?: string | null
        businessModel?: string | null
        tractionSummary?: string | null
        financialSummary?: string | null
        legalSummary?: string | null
        financialDocUrl?: string | null
        financialDocFileName?: string | null
        financialDocFileSizeBytes?: number | null
        legalDocUrl?: string | null
        legalDocFileName?: string | null
        legalDocFileSizeBytes?: number | null
    }
): Promise<StartupProfile> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const result = await apiRequest<StartupMutationResult>({
        path: '/startups/profile',
        method: 'PATCH',
        accessToken,
        body: {
            websiteUrl: normalizeText(input.websiteUrl) ?? null,
            pitchDeckUrl: normalizeText(input.pitchDeckUrl) ?? null,
            pitchDeckMediaKind: normalizeStartupPitchDeckMediaKind(input.pitchDeckMediaKind) ?? null,
            pitchDeckFileName: normalizeText(input.pitchDeckFileName) ?? null,
            pitchDeckFileSizeBytes: normalizeNullableNumber(input.pitchDeckFileSizeBytes),
            teamOverview: normalizeText(input.teamOverview) ?? null,
            companyStage: normalizeText(input.companyStage) ?? null,
            foundingYear: normalizeNullableNumber(input.foundingYear),
            teamSize: normalizeNullableNumber(input.teamSize),
            targetMarket: normalizeText(input.targetMarket) ?? null,
            businessModel: normalizeText(input.businessModel) ?? null,
            tractionSummary: normalizeText(input.tractionSummary) ?? null,
            financialSummary: normalizeText(input.financialSummary) ?? null,
            legalSummary: normalizeText(input.legalSummary) ?? null,
            financialDocUrl: normalizeText(input.financialDocUrl) ?? null,
            financialDocFileName: normalizeText(input.financialDocFileName) ?? null,
            financialDocFileSizeBytes: normalizeNullableNumber(input.financialDocFileSizeBytes),
            legalDocUrl: normalizeText(input.legalDocUrl) ?? null,
            legalDocFileName: normalizeText(input.legalDocFileName) ?? null,
            legalDocFileSizeBytes: normalizeNullableNumber(input.legalDocFileSizeBytes),
        },
    })

    if (!result?.success) {
        throw new Error(result?.message ?? 'Unable to update startup profile right now.')
    }

    const row = await apiRequest<StartupProfileRow | null>({
        path: '/startups/profile',
        method: 'GET',
        accessToken,
    })
    const profile = row ? mapStartupProfile(row) : null
    if (!profile) {
        throw new Error('Unexpected response while updating startup profile.')
    }

    return profile
}

export async function getStartupPostForCurrentUser(
    supabase: SupabaseClient
): Promise<StartupPost | null> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        console.warn('[startups] Failed to load startup post: missing access token')
        return null
    }

    const row = await apiRequest<StartupPostRow | null>({
        path: '/startups/post',
        method: 'GET',
        accessToken,
    })
    if (!row) {
        console.warn('[startups] Failed to load startup post')
        return null
    }
    return mapStartupPost(row)
}

export async function upsertStartupPostForCurrentUser(
    supabase: SupabaseClient,
    input: {
        title: string
        summary: string
        stage?: string | null
        location?: string | null
        industryTags?: string[]
        status: StartupPostStatus
    }
): Promise<string> {
    const title = normalizeText(input.title)
    const summary = normalizeText(input.summary)
    const status = normalizeStartupPostStatus(input.status)
    if (!title || title.length < 3) {
        throw new Error('Startup post title must be at least 3 characters.')
    }

    if (!summary || summary.length < 20) {
        throw new Error('Startup post summary must be at least 20 characters.')
    }

    if (!status) {
        throw new Error('Startup post status is invalid.')
    }

    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const result = await apiRequest<StartupMutationResult>({
        path: '/startups/post',
        method: 'PATCH',
        accessToken,
        body: {
            title,
            summary,
            stage: normalizeText(input.stage) ?? null,
            location: normalizeText(input.location) ?? null,
            industryTags: normalizeArray(input.industryTags),
            status,
        },
    })

    if (!result?.success) {
        throw new Error(result?.message ?? 'Unable to update startup post right now.')
    }

    const mutationPostId = normalizeText(result.postId)
    if (mutationPostId) {
        return mutationPostId
    }

    const row = await apiRequest<StartupPostRow | null>({
        path: '/startups/post',
        method: 'GET',
        accessToken,
    })
    const post = row ? mapStartupPost(row) : null
    if (!post?.id) {
        throw new Error('Unexpected response while updating startup post.')
    }

    return post.id
}

export async function getStartupDataRoomDocumentsForCurrentUser(
    supabase: SupabaseClient
): Promise<StartupDataRoomDocument[]> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        console.warn('[startups] Failed to load startup data room documents: missing access token')
        return []
    }

    const rows = await apiRequest<StartupDataRoomDocumentRow[] | null>({
        path: '/startups/data-room/documents',
        method: 'GET',
        accessToken,
    })
    if (!rows || !Array.isArray(rows)) {
        return []
    }

    return rows
        .map((row) => mapStartupDataRoomDocument(row))
        .filter((row): row is StartupDataRoomDocument => !!row)
}

export async function upsertStartupDataRoomDocumentForCurrentUser(
    supabase: SupabaseClient,
    input: {
        documentType: StartupDataRoomDocumentType
        title: string
        fileUrl: string
        fileName?: string | null
        fileSizeBytes?: number | null
        contentType?: string | null
        summary?: string | null
    }
): Promise<void> {
    const documentType = normalizeStartupDataRoomDocumentType(input.documentType)
    const title = normalizeText(input.title)
    const fileUrl = normalizeText(input.fileUrl)
    if (!documentType) {
        throw new Error('Data room document type is invalid.')
    }
    if (!title || title.length < 2) {
        throw new Error('Data room document title must be at least 2 characters.')
    }
    if (!fileUrl) {
        throw new Error('Data room file URL is required.')
    }

    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const result = await apiRequest<StartupMutationResult>({
        path: '/startups/data-room/documents',
        method: 'POST',
        accessToken,
        body: {
            documentType,
            title,
            fileUrl,
            fileName: normalizeText(input.fileName),
            fileSizeBytes: normalizeNullableNumber(input.fileSizeBytes),
            contentType: normalizeText(input.contentType),
            summary: normalizeText(input.summary),
        },
    })
    if (!result?.success) {
        throw new Error(result?.message ?? 'Unable to save data room document right now.')
    }
}

export async function deleteStartupDataRoomDocumentForCurrentUser(
    supabase: SupabaseClient,
    documentId: string
): Promise<void> {
    const normalizedDocumentId = normalizeUuid(documentId)
    if (!normalizedDocumentId) {
        throw new Error('Data room document id is invalid.')
    }

    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const result = await apiRequest<StartupMutationResult>({
        path: `/startups/data-room/documents/${encodeURIComponent(normalizedDocumentId)}`,
        method: 'DELETE',
        accessToken,
    })
    if (!result?.success) {
        throw new Error(result?.message ?? 'Unable to remove data room document right now.')
    }
}
