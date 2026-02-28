'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logServerTelemetry } from '@/lib/telemetry/server'
import {
    type BillingInterval,
    createStripeCheckoutSessionForCurrentUser,
    createStripePortalSessionForCurrentUser,
} from '@/modules/billing'
import {
    getPrimaryOrganizationMembershipForUser,
    parseIndustryTags,
} from '@/modules/organizations'
import {
    type StartupPitchDeckMediaKind,
    type StartupPostStatus,
} from '@/modules/startups'
import { WORKSPACE_IDENTITY_CACHE_TAG } from '@/modules/workspace'
import { apiRequest } from '@/lib/api/rest-client'

export type UpdateOrganizationSettingsActionState = {
    error: string | null
    success: string | null
}

export type SettingsSectionActionState = {
    error: string | null
    success: string | null
}

export type CreateOrganizationInviteActionState = {
    error: string | null
    success: string | null
    inviteToken: string | null
    inviteLink: string | null
}

const ORGANIZATION_LOGO_BUCKET = 'organization-logos'
const MAX_ORGANIZATION_LOGO_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_ORGANIZATION_LOGO_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
])
const STARTUP_READINESS_ASSET_BUCKET = 'startup-readiness-assets'
const MAX_STARTUP_READINESS_ASSET_SIZE_BYTES = 50 * 1024 * 1024
const ALLOWED_STARTUP_PITCH_DECK_ASSET_MIME_TYPES = new Set([
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4',
    'video/webm',
    'video/quicktime',
])
const ALLOWED_STARTUP_READINESS_DOCUMENT_ASSET_MIME_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
])

function normalizeText(value: FormDataEntryValue | null): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function normalizeUploadedFile(value: FormDataEntryValue | null): File | null {
    if (!value || typeof value === 'string') {
        return null
    }

    if (value.size <= 0) {
        return null
    }

    return value
}

function isChecked(value: FormDataEntryValue | null): boolean {
    return typeof value === 'string' && value === '1'
}

function normalizeInviteMemberRole(value: FormDataEntryValue | null): 'admin' | 'member' | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    if (normalized === 'admin' || normalized === 'member') {
        return normalized
    }

    return null
}

function normalizeInviteExpiryDays(value: FormDataEntryValue | null): number {
    if (typeof value !== 'string') {
        return 7
    }

    const parsed = Number.parseInt(value.trim(), 10)
    if (!Number.isFinite(parsed) || parsed < 1) {
        return 7
    }

    return Math.min(parsed, 30)
}

function normalizeInteger(value: FormDataEntryValue | null): number | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    if (!trimmed) {
        return null
    }

    const parsed = Number.parseInt(trimmed, 10)
    if (!Number.isFinite(parsed)) {
        return null
    }

    return parsed
}

function normalizeStartupPostStatus(value: FormDataEntryValue | null): StartupPostStatus | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    if (normalized === 'draft' || normalized === 'published') {
        return normalized
    }

    return null
}

function normalizeBillingInterval(value: FormDataEntryValue | null): BillingInterval | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    if (normalized === 'monthly' || normalized === 'annual') {
        return normalized
    }

    return null
}

function isNextRedirectError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
        return false
    }

    const digest = (error as { digest?: unknown }).digest
    if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
        return true
    }

    return error instanceof Error && error.message.includes('NEXT_REDIRECT')
}

function isValidHttpUrl(value: string): boolean {
    try {
        const parsed = new URL(value)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
        return false
    }
}

function resolveLogoFileExtension(file: File): string {
    if (file.type === 'image/jpeg') {
        return 'jpg'
    }

    if (file.type === 'image/png') {
        return 'png'
    }

    if (file.type === 'image/webp') {
        return 'webp'
    }

    if (file.type === 'image/gif') {
        return 'gif'
    }

    if (file.type === 'image/svg+xml') {
        return 'svg'
    }

    const parts = file.name.split('.')
    const extension = parts.length > 1 ? parts.pop()?.trim().toLowerCase() : null
    if (extension && /^[a-z0-9]+$/.test(extension)) {
        return extension
    }

    return 'png'
}

function resolveStartupReadinessAssetFileExtension(file: File): string {
    if (file.type === 'application/pdf') {
        return 'pdf'
    }

    if (file.type === 'application/vnd.ms-powerpoint') {
        return 'ppt'
    }

    if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        return 'pptx'
    }

    if (file.type === 'video/mp4') {
        return 'mp4'
    }

    if (file.type === 'video/webm') {
        return 'webm'
    }

    if (file.type === 'video/quicktime') {
        return 'mov'
    }

    if (file.type === 'application/msword') {
        return 'doc'
    }

    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return 'docx'
    }

    if (file.type === 'application/vnd.ms-excel') {
        return 'xls'
    }

    if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        return 'xlsx'
    }

    if (file.type === 'text/csv') {
        return 'csv'
    }

    const parts = file.name.split('.')
    const extension = parts.length > 1 ? parts.pop()?.trim().toLowerCase() : null
    if (extension && /^[a-z0-9]+$/.test(extension)) {
        return extension
    }

    return 'bin'
}

function buildOrganizationLogoObjectPath(orgId: string, file: File): string {
    const extension = resolveLogoFileExtension(file)
    return `${orgId}/logo-${crypto.randomUUID()}.${extension}`
}

function buildStartupReadinessAssetObjectPath(orgId: string, file: File): string {
    const extension = resolveStartupReadinessAssetFileExtension(file)
    return `${orgId}/pitch-deck-${crypto.randomUUID()}.${extension}`
}

function extractOrganizationLogoObjectPath(publicUrl: string): string | null {
    try {
        const url = new URL(publicUrl)
        const prefix = `/storage/v1/object/public/${ORGANIZATION_LOGO_BUCKET}/`
        if (!url.pathname.startsWith(prefix)) {
            return null
        }

        const path = decodeURIComponent(url.pathname.slice(prefix.length)).trim()
        return path.length > 0 ? path : null
    } catch {
        return null
    }
}

function extractStartupReadinessAssetObjectPath(publicUrl: string): string | null {
    try {
        const url = new URL(publicUrl)
        const prefix = `/storage/v1/object/public/${STARTUP_READINESS_ASSET_BUCKET}/`
        if (!url.pathname.startsWith(prefix)) {
            return null
        }

        const path = decodeURIComponent(url.pathname.slice(prefix.length)).trim()
        return path.length > 0 ? path : null
    } catch {
        return null
    }
}

async function removeOrganizationLogoObjectIfManaged(
    supabase: Awaited<ReturnType<typeof createClient>>,
    publicUrl: string | null
): Promise<void> {
    const normalizedUrl = normalizeText(publicUrl)
    if (!normalizedUrl) {
        return
    }

    const objectPath = extractOrganizationLogoObjectPath(normalizedUrl)
    if (!objectPath) {
        return
    }

    await supabase.storage.from(ORGANIZATION_LOGO_BUCKET).remove([objectPath])
}

function resolvePitchDeckMediaKindByMimeType(mimeType: string): StartupPitchDeckMediaKind {
    return mimeType.startsWith('video/') ? 'video' : 'document'
}

async function uploadStartupReadinessAsset(input: {
    accessToken: string
    orgId: string
    file: File
    assetType: 'pitch_deck' | 'financial_doc' | 'legal_doc'
}): Promise<{ publicUrl: string | null }> {
    const uploadConfig = await apiRequest<{
        success: boolean
        message: string | null
        uploadUrl: string | null
        publicUrl: string | null
    }>({
        path: '/files/startups/readiness/upload-url',
        method: 'POST',
        accessToken: input.accessToken,
        body: {
            orgId: input.orgId,
            assetType: input.assetType,
            fileName: input.file.name,
            contentType: input.file.type,
            contentLength: input.file.size,
        },
    })

    const payload = uploadConfig
    if (!payload?.success || !payload.uploadUrl) {
        throw new Error(payload?.message ?? 'Unable to prepare readiness asset upload right now.')
    }

    const uploadResponse = await fetch(payload.uploadUrl, {
        method: 'PUT',
        headers: {
            'content-type': input.file.type,
        },
        body: input.file,
    })
    if (!uploadResponse.ok) {
        throw new Error('Readiness asset upload failed. Please try again.')
    }

    return {
        publicUrl: payload.publicUrl ?? null,
    }
}

async function removeStartupReadinessAssetIfManaged(
    supabase: Awaited<ReturnType<typeof createClient>>,
    publicUrl: string | null
): Promise<void> {
    const normalizedUrl = normalizeText(publicUrl)
    if (!normalizedUrl) {
        return
    }

    const objectPath = extractStartupReadinessAssetObjectPath(normalizedUrl)
    if (!objectPath) {
        return
    }

    await supabase.storage.from(STARTUP_READINESS_ASSET_BUCKET).remove([objectPath])
}

function resolveInviteBaseUrl(): string {
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '')
    if (configuredSiteUrl) {
        return configuredSiteUrl
    }

    return ''
}

async function requireOwnerSettingsContext(): Promise<{
    supabase: Awaited<ReturnType<typeof createClient>>
    membership: NonNullable<Awaited<ReturnType<typeof getPrimaryOrganizationMembershipForUser>>>
    userId: string
}> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const membership = await getPrimaryOrganizationMembershipForUser(supabase, user)
    if (!membership) {
        throw new Error('Complete onboarding before updating organization settings.')
    }

    if (membership.member_role !== 'owner') {
        throw new Error('Only organization owner can update settings.')
    }

    return { supabase, membership, userId: user.id }
}

async function requireBillingEditorSettingsContext(): Promise<{
    supabase: Awaited<ReturnType<typeof createClient>>
    membership: NonNullable<Awaited<ReturnType<typeof getPrimaryOrganizationMembershipForUser>>>
}> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const membership = await getPrimaryOrganizationMembershipForUser(supabase, user)
    if (!membership) {
        throw new Error('Complete onboarding before updating billing settings.')
    }

    if (membership.member_role !== 'owner' && membership.member_role !== 'admin') {
        throw new Error('Only organization owner or admin can update billing settings.')
    }

    return { supabase, membership }
}

export async function updateOrganizationIdentitySectionAction(
    _previousState: SettingsSectionActionState,
    formData: FormData
): Promise<SettingsSectionActionState> {
    const telemetryContext: {
        orgType: string | null
        memberRole: string | null
    } = {
        orgType: null,
        memberRole: null,
    }

    try {
        const { supabase, membership, userId } = await requireOwnerSettingsContext()
        telemetryContext.orgType = membership.organization.type
        telemetryContext.memberRole = membership.member_role

        const organizationName = normalizeText(formData.get('organizationName'))
        const organizationLocation = normalizeText(formData.get('organizationLocation'))
        const organizationLogoCurrentUrl = normalizeText(formData.get('organizationLogoCurrentUrl'))
        const organizationLogoFile = normalizeUploadedFile(formData.get('organizationLogoFile'))
        const organizationLogoRemove = isChecked(formData.get('organizationLogoRemove'))
        const organizationIndustryTagsRaw = normalizeText(formData.get('organizationIndustryTags')) ?? ''
        const industryTags = parseIndustryTags(organizationIndustryTagsRaw)
        const investorThesis = normalizeText(formData.get('investorThesis'))
        const investorSectorTagsRaw = normalizeText(formData.get('investorSectorTags')) ?? ''
        const investorSectorTags = parseIndustryTags(investorSectorTagsRaw)
        const investorCheckSizeMinUsd = normalizeInteger(formData.get('investorCheckSizeMinUsd'))
        const investorCheckSizeMaxUsd = normalizeInteger(formData.get('investorCheckSizeMaxUsd'))

        if (!organizationName || organizationName.length < 2) {
            return { error: 'Organization name must be at least 2 characters.', success: null }
        }

        if (membership.organization.type === 'investor') {
            if (investorThesis && investorThesis.length > 2000) {
                return { error: 'Investment thesis must be 2000 characters or less.', success: null }
            }

            if (investorSectorTags.length > 20) {
                return { error: 'Sector tags must contain 20 items or fewer.', success: null }
            }

            if (investorCheckSizeMinUsd !== null && investorCheckSizeMinUsd < 0) {
                return { error: 'Minimum check size cannot be negative.', success: null }
            }

            if (investorCheckSizeMaxUsd !== null && investorCheckSizeMaxUsd < 0) {
                return { error: 'Maximum check size cannot be negative.', success: null }
            }

            if (
                investorCheckSizeMinUsd !== null
                && investorCheckSizeMaxUsd !== null
                && investorCheckSizeMaxUsd < investorCheckSizeMinUsd
            ) {
                return { error: 'Maximum check size must be greater than or equal to minimum.', success: null }
            }
        }

        if (organizationLogoCurrentUrl && !isValidHttpUrl(organizationLogoCurrentUrl)) {
            return { error: 'Current organization logo URL is invalid.', success: null }
        }

        if (organizationLogoFile) {
            if (organizationLogoFile.size > MAX_ORGANIZATION_LOGO_SIZE_BYTES) {
                return { error: 'Organization logo must be 2MB or smaller.', success: null }
            }

            if (!ALLOWED_ORGANIZATION_LOGO_MIME_TYPES.has(organizationLogoFile.type)) {
                return { error: 'Organization logo must be JPG, PNG, WEBP, GIF, or SVG.', success: null }
            }
        }

        let organizationLogoUrl = organizationLogoCurrentUrl
        if (organizationLogoRemove) {
            organizationLogoUrl = null
        }

        if (organizationLogoFile) {
            const objectPath = buildOrganizationLogoObjectPath(membership.org_id, organizationLogoFile)
            const { error: uploadError } = await supabase.storage
                .from(ORGANIZATION_LOGO_BUCKET)
                .upload(objectPath, organizationLogoFile, {
                    cacheControl: '3600',
                    contentType: organizationLogoFile.type,
                    upsert: false,
                })

            if (uploadError) {
                return { error: `Logo upload failed: ${uploadError.message}`, success: null }
            }

            const { data: publicUrlData } = supabase.storage
                .from(ORGANIZATION_LOGO_BUCKET)
                .getPublicUrl(objectPath)

            organizationLogoUrl = normalizeText(publicUrlData.publicUrl)
        }

        const {
            data: { session },
        } = await supabase.auth.getSession()
        const accessToken = session?.access_token ?? null
        if (!accessToken) {
            return { error: 'Your session has expired. Please log in again.', success: null }
        }

        const result = await apiRequest<{ success: boolean; message: string | null }>({
            path: '/organizations/identity',
            method: 'PATCH',
            accessToken,
            body: {
                name: organizationName,
                location: organizationLocation,
                logoUrl: organizationLogoUrl,
                industryTags: industryTags,
            },
        })

        if (!result?.success) {
            const message = result?.message ?? 'Unable to update organization identity right now.'
            return { error: message, success: null }
        }

        if (membership.organization.type === 'investor') {
            const { error: investorProfileError } = await supabase
                .from('investor_profiles')
                .upsert(
                    {
                        investor_org_id: membership.org_id,
                        thesis: investorThesis,
                        sector_tags: investorSectorTags,
                        check_size_min_usd: investorCheckSizeMinUsd,
                        check_size_max_usd: investorCheckSizeMaxUsd,
                        updated_by: userId,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'investor_org_id' }
                )

            if (investorProfileError) {
                return {
                    error: `Investor readiness fields update failed: ${investorProfileError.message}`,
                    success: null,
                }
            }
        }

        if (organizationLogoCurrentUrl && (organizationLogoRemove || organizationLogoFile)) {
            await removeOrganizationLogoObjectIfManaged(supabase, organizationLogoCurrentUrl)
        }

        revalidatePath('/workspace')
        revalidatePath('/workspace/settings')
        revalidateTag(WORKSPACE_IDENTITY_CACHE_TAG, 'max')

        return { error: null, success: 'Organization identity updated.' }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update organization identity right now.'
        logServerTelemetry({
            name: 'workspace_action_failed',
            route: '/workspace/settings',
            action: 'updateOrganizationIdentitySectionAction',
            level: 'error',
            message,
            orgType: telemetryContext.orgType,
            memberRole: telemetryContext.memberRole,
        })
        return { error: message, success: null }
    }
}

export async function updateStartupReadinessSectionAction(
    _previousState: SettingsSectionActionState,
    formData: FormData
): Promise<SettingsSectionActionState> {
    const telemetryContext: {
        orgType: string | null
        memberRole: string | null
    } = {
        orgType: null,
        memberRole: null,
    }

    try {
        const { supabase, membership } = await requireOwnerSettingsContext()
        telemetryContext.orgType = membership.organization.type
        telemetryContext.memberRole = membership.member_role

        if (membership.organization.type !== 'startup') {
            return { error: 'Startup readiness fields are available only for startup organizations.', success: null }
        }

        const startupWebsiteUrl = normalizeText(formData.get('startupWebsiteUrl'))
        const startupPitchDeckCurrentUrl = normalizeText(formData.get('startupPitchDeckCurrentUrl'))
        const startupPitchDeckCurrentMediaKindRaw = normalizeText(formData.get('startupPitchDeckCurrentMediaKind'))
        const startupPitchDeckCurrentFileName = normalizeText(formData.get('startupPitchDeckCurrentFileName'))
        const startupPitchDeckCurrentFileSizeBytes = normalizeInteger(formData.get('startupPitchDeckCurrentFileSizeBytes'))
        const startupPitchDeckFile = normalizeUploadedFile(formData.get('startupPitchDeckFile'))
        const startupPitchDeckRemove = isChecked(formData.get('startupPitchDeckRemove'))
        const startupTeamOverview = normalizeText(formData.get('startupTeamOverview'))
        const startupCompanyStage = normalizeText(formData.get('startupCompanyStage'))
        const startupFoundingYear = normalizeInteger(formData.get('startupFoundingYear'))
        const startupTeamSize = normalizeInteger(formData.get('startupTeamSize'))
        const startupTargetMarket = normalizeText(formData.get('startupTargetMarket'))
        const startupBusinessModel = normalizeText(formData.get('startupBusinessModel'))
        const startupTractionSummary = normalizeText(formData.get('startupTractionSummary'))
        const startupFinancialSummary = normalizeText(formData.get('startupFinancialSummary'))
        const startupLegalSummary = normalizeText(formData.get('startupLegalSummary'))

        const startupFinancialDocCurrentUrl = normalizeText(formData.get('startupFinancialDocCurrentUrl'))
        const startupFinancialDocCurrentFileName = normalizeText(formData.get('startupFinancialDocCurrentFileName'))
        const startupFinancialDocCurrentFileSizeBytes = normalizeInteger(formData.get('startupFinancialDocCurrentFileSizeBytes'))
        const startupFinancialDocFile = normalizeUploadedFile(formData.get('startupFinancialDocFile'))
        const startupFinancialDocRemove = isChecked(formData.get('startupFinancialDocRemove'))

        const startupLegalDocCurrentUrl = normalizeText(formData.get('startupLegalDocCurrentUrl'))
        const startupLegalDocCurrentFileName = normalizeText(formData.get('startupLegalDocCurrentFileName'))
        const startupLegalDocCurrentFileSizeBytes = normalizeInteger(formData.get('startupLegalDocCurrentFileSizeBytes'))
        const startupLegalDocFile = normalizeUploadedFile(formData.get('startupLegalDocFile'))
        const startupLegalDocRemove = isChecked(formData.get('startupLegalDocRemove'))

        if (startupWebsiteUrl && !isValidHttpUrl(startupWebsiteUrl)) {
            return { error: 'Website URL must be a valid http/https link.', success: null }
        }

        if (startupPitchDeckCurrentUrl && !isValidHttpUrl(startupPitchDeckCurrentUrl)) {
            return { error: 'Current pitch deck asset URL is invalid.', success: null }
        }

        if (startupFinancialDocCurrentUrl && !isValidHttpUrl(startupFinancialDocCurrentUrl)) {
            return { error: 'Current financial document URL is invalid.', success: null }
        }

        if (startupLegalDocCurrentUrl && !isValidHttpUrl(startupLegalDocCurrentUrl)) {
            return { error: 'Current legal document URL is invalid.', success: null }
        }

        if (startupPitchDeckFile) {
            if (startupPitchDeckFile.size > MAX_STARTUP_READINESS_ASSET_SIZE_BYTES) {
                return { error: 'Pitch deck asset must be 50MB or smaller.', success: null }
            }

            if (!ALLOWED_STARTUP_PITCH_DECK_ASSET_MIME_TYPES.has(startupPitchDeckFile.type)) {
                return { error: 'Pitch deck must be PDF/PPT/PPTX or MP4/WEBM/MOV.', success: null }
            }
        }

        if (startupFinancialDocFile) {
            if (startupFinancialDocFile.size > MAX_STARTUP_READINESS_ASSET_SIZE_BYTES) {
                return { error: 'Financial document must be 50MB or smaller.', success: null }
            }

            if (!ALLOWED_STARTUP_READINESS_DOCUMENT_ASSET_MIME_TYPES.has(startupFinancialDocFile.type)) {
                return { error: 'Financial document must be PDF, DOC/DOCX, XLS/XLSX, or CSV.', success: null }
            }
        }

        if (startupLegalDocFile) {
            if (startupLegalDocFile.size > MAX_STARTUP_READINESS_ASSET_SIZE_BYTES) {
                return { error: 'Legal document must be 50MB or smaller.', success: null }
            }

            if (!ALLOWED_STARTUP_READINESS_DOCUMENT_ASSET_MIME_TYPES.has(startupLegalDocFile.type)) {
                return { error: 'Legal document must be PDF, DOC/DOCX, XLS/XLSX, or CSV.', success: null }
            }
        }

        if (startupFoundingYear && (startupFoundingYear < 1900 || startupFoundingYear > 2100)) {
            return { error: 'Founding year must be between 1900 and 2100.', success: null }
        }

        if (startupTeamSize && startupTeamSize < 1) {
            return { error: 'Team size must be at least 1.', success: null }
        }

        let startupPitchDeckUrl = startupPitchDeckCurrentUrl
        let startupPitchDeckMediaKind: StartupPitchDeckMediaKind | null =
            startupPitchDeckCurrentMediaKindRaw === 'video'
                ? 'video'
                : startupPitchDeckCurrentMediaKindRaw === 'document'
                    ? 'document'
                    : null
        let startupPitchDeckFileName = startupPitchDeckCurrentFileName
        let startupPitchDeckFileSizeBytes = startupPitchDeckCurrentFileSizeBytes

        if (startupPitchDeckRemove) {
            startupPitchDeckUrl = null
            startupPitchDeckMediaKind = null
            startupPitchDeckFileName = null
            startupPitchDeckFileSizeBytes = null
        }

        let startupFinancialDocUrl = startupFinancialDocCurrentUrl
        let startupFinancialDocFileName = startupFinancialDocCurrentFileName
        let startupFinancialDocFileSizeBytes = startupFinancialDocCurrentFileSizeBytes
        if (startupFinancialDocRemove) {
            startupFinancialDocUrl = null
            startupFinancialDocFileName = null
            startupFinancialDocFileSizeBytes = null
        }

        let startupLegalDocUrl = startupLegalDocCurrentUrl
        let startupLegalDocFileName = startupLegalDocCurrentFileName
        let startupLegalDocFileSizeBytes = startupLegalDocCurrentFileSizeBytes
        if (startupLegalDocRemove) {
            startupLegalDocUrl = null
            startupLegalDocFileName = null
            startupLegalDocFileSizeBytes = null
        }

        const {
            data: { session },
        } = await supabase.auth.getSession()
        const accessToken = session?.access_token ?? null
        if (!accessToken) {
            return { error: 'Your session has expired. Please log in again.', success: null }
        }

        if (startupPitchDeckFile) {
            try {
                const payload = await uploadStartupReadinessAsset({
                    accessToken,
                    orgId: membership.org_id,
                    file: startupPitchDeckFile,
                    assetType: 'pitch_deck',
                })

                startupPitchDeckUrl = payload.publicUrl
                startupPitchDeckMediaKind = resolvePitchDeckMediaKindByMimeType(startupPitchDeckFile.type)
                startupPitchDeckFileName = normalizeText(startupPitchDeckFile.name)
                startupPitchDeckFileSizeBytes = startupPitchDeckFile.size
            } catch (uploadError) {
                const message = uploadError instanceof Error
                    ? uploadError.message
                    : 'Pitch deck upload failed. Please try again.'
                return { error: message, success: null }
            }
        }

        if (startupFinancialDocFile) {
            try {
                const payload = await uploadStartupReadinessAsset({
                    accessToken,
                    orgId: membership.org_id,
                    file: startupFinancialDocFile,
                    assetType: 'financial_doc',
                })
                startupFinancialDocUrl = payload.publicUrl
                startupFinancialDocFileName = normalizeText(startupFinancialDocFile.name)
                startupFinancialDocFileSizeBytes = startupFinancialDocFile.size
            } catch (uploadError) {
                const message = uploadError instanceof Error
                    ? uploadError.message
                    : 'Financial document upload failed. Please try again.'
                return { error: message, success: null }
            }
        }

        if (startupLegalDocFile) {
            try {
                const payload = await uploadStartupReadinessAsset({
                    accessToken,
                    orgId: membership.org_id,
                    file: startupLegalDocFile,
                    assetType: 'legal_doc',
                })
                startupLegalDocUrl = payload.publicUrl
                startupLegalDocFileName = normalizeText(startupLegalDocFile.name)
                startupLegalDocFileSizeBytes = startupLegalDocFile.size
            } catch (uploadError) {
                const message = uploadError instanceof Error
                    ? uploadError.message
                    : 'Legal document upload failed. Please try again.'
                return { error: message, success: null }
            }
        }

        const profileResult = await apiRequest<{ success: boolean; message: string | null }>({
            path: '/startups/profile',
            method: 'PATCH',
            accessToken,
            body: {
                websiteUrl: startupWebsiteUrl,
                pitchDeckUrl: startupPitchDeckUrl,
                pitchDeckMediaKind: startupPitchDeckMediaKind,
                pitchDeckFileName: startupPitchDeckFileName,
                pitchDeckFileSizeBytes: startupPitchDeckFileSizeBytes,
                teamOverview: startupTeamOverview,
                companyStage: startupCompanyStage,
                foundingYear: startupFoundingYear,
                teamSize: startupTeamSize,
                targetMarket: startupTargetMarket,
                businessModel: startupBusinessModel,
                tractionSummary: startupTractionSummary,
                financialSummary: startupFinancialSummary,
                legalSummary: startupLegalSummary,
                financialDocUrl: startupFinancialDocUrl,
                financialDocFileName: startupFinancialDocFileName,
                financialDocFileSizeBytes: startupFinancialDocFileSizeBytes,
                legalDocUrl: startupLegalDocUrl,
                legalDocFileName: startupLegalDocFileName,
                legalDocFileSizeBytes: startupLegalDocFileSizeBytes,
            },
        })

        if (!profileResult?.success) {
            const message = profileResult?.message ?? 'Unable to update startup readiness right now.'
            return { error: message, success: null }
        }

        if (startupPitchDeckCurrentUrl && (startupPitchDeckRemove || startupPitchDeckFile)) {
            await removeStartupReadinessAssetIfManaged(supabase, startupPitchDeckCurrentUrl)
        }

        if (startupFinancialDocCurrentUrl && (startupFinancialDocRemove || startupFinancialDocFile)) {
            await removeStartupReadinessAssetIfManaged(supabase, startupFinancialDocCurrentUrl)
        }

        if (startupLegalDocCurrentUrl && (startupLegalDocRemove || startupLegalDocFile)) {
            await removeStartupReadinessAssetIfManaged(supabase, startupLegalDocCurrentUrl)
        }

        revalidatePath('/workspace')
        revalidatePath('/workspace/settings')
        revalidateTag(WORKSPACE_IDENTITY_CACHE_TAG, 'max')

        return { error: null, success: 'Startup readiness fields updated.' }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update startup readiness right now.'
        logServerTelemetry({
            name: 'workspace_action_failed',
            route: '/workspace/settings',
            action: 'updateStartupReadinessSectionAction',
            level: 'error',
            message,
            orgType: telemetryContext.orgType,
            memberRole: telemetryContext.memberRole,
        })
        return { error: message, success: null }
    }
}

export async function updateStartupDiscoverySectionAction(
    _previousState: SettingsSectionActionState,
    formData: FormData
): Promise<SettingsSectionActionState> {
    const telemetryContext: {
        orgType: string | null
        memberRole: string | null
    } = {
        orgType: null,
        memberRole: null,
    }

    try {
        const { supabase, membership } = await requireOwnerSettingsContext()
        telemetryContext.orgType = membership.organization.type
        telemetryContext.memberRole = membership.member_role

        if (membership.organization.type !== 'startup') {
            return { error: 'Discovery post is available only for startup organizations.', success: null }
        }

        const startupPostTitle = normalizeText(formData.get('startupPostTitle'))
        const startupPostSummary = normalizeText(formData.get('startupPostSummary'))
        const startupPostStage = normalizeText(formData.get('startupPostStage'))
        const startupPostLocation = normalizeText(formData.get('startupPostLocation'))
        const startupPostIndustryTagsRaw = normalizeText(formData.get('startupPostIndustryTags')) ?? ''
        const startupPostStatus = normalizeStartupPostStatus(formData.get('startupPostStatus')) ?? 'draft'
        const startupPostIndustryTags = parseIndustryTags(startupPostIndustryTagsRaw)

        if (!startupPostTitle || !startupPostSummary) {
            return { error: 'Startup discovery post requires both title and summary.', success: null }
        }

        const {
            data: { session },
        } = await supabase.auth.getSession()
        const accessToken = session?.access_token ?? null
        if (!accessToken) {
            return { error: 'Your session has expired. Please log in again.', success: null }
        }

        const postResult = await apiRequest<{ success: boolean; message: string | null }>({
            path: '/startups/post',
            method: 'PATCH',
            accessToken,
            body: {
                title: startupPostTitle,
                summary: startupPostSummary,
                stage: startupPostStage,
                location: startupPostLocation,
                industryTags: startupPostIndustryTags,
                status: startupPostStatus,
            },
        })

        if (!postResult?.success) {
            const message = postResult?.message ?? 'Unable to update startup discovery post right now.'
            return { error: message, success: null }
        }

        revalidatePath('/workspace')
        revalidatePath('/workspace/settings')
        revalidateTag(WORKSPACE_IDENTITY_CACHE_TAG, 'max')

        return { error: null, success: 'Startup discovery post updated.' }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update startup discovery post right now.'
        logServerTelemetry({
            name: 'workspace_action_failed',
            route: '/workspace/settings',
            action: 'updateStartupDiscoverySectionAction',
            level: 'error',
            message,
            orgType: telemetryContext.orgType,
            memberRole: telemetryContext.memberRole,
        })
        return { error: message, success: null }
    }
}

export async function updateBillingSubscriptionSectionAction(
    _previousState: SettingsSectionActionState,
    formData: FormData
): Promise<SettingsSectionActionState> {
    const telemetryContext: {
        orgType: string | null
        memberRole: string | null
    } = {
        orgType: null,
        memberRole: null,
    }

    try {
        const { supabase, membership } = await requireBillingEditorSettingsContext()
        telemetryContext.orgType = membership.organization.type
        telemetryContext.memberRole = membership.member_role

        const planCode = normalizeText(formData.get('planCode'))?.toLowerCase() ?? null
        const billingInterval = normalizeBillingInterval(formData.get('billingInterval'))
        if (!planCode) {
            return { error: 'Select a plan before updating subscription.', success: null }
        }

        const baseUrl = resolveInviteBaseUrl()
        const checkout = await createStripeCheckoutSessionForCurrentUser(supabase, {
            planCode,
            billingInterval,
            successUrl: baseUrl
                ? `${baseUrl}/workspace/settings?section=settings-billing&stripe=success`
                : null,
            cancelUrl: baseUrl
                ? `${baseUrl}/workspace/settings?section=settings-billing&stripe=cancel`
                : null,
        })
        if (!checkout.success) {
            return {
                error: checkout.message ?? 'Unable to update billing subscription right now.',
                success: null,
            }
        }

        if (checkout.mode === 'manual_applied') {
            revalidatePath('/workspace')
            revalidatePath('/workspace/settings')
            revalidateTag(WORKSPACE_IDENTITY_CACHE_TAG, 'max')

            return {
                error: null,
                success: checkout.message ?? 'Billing subscription updated.',
            }
        }

        if (checkout.redirectUrl) {
            redirect(checkout.redirectUrl)
        }

        return {
            error: null,
            success: checkout.message ?? 'Checkout is ready.',
        }
    } catch (error) {
        if (isNextRedirectError(error)) {
            throw error
        }

        const message = error instanceof Error ? error.message : 'Unable to update billing subscription right now.'
        logServerTelemetry({
            name: 'workspace_action_failed',
            route: '/workspace/settings',
            action: 'updateBillingSubscriptionSectionAction',
            level: 'error',
            message,
            orgType: telemetryContext.orgType,
            memberRole: telemetryContext.memberRole,
        })
        return { error: message, success: null }
    }
}

export async function openBillingPortalSectionAction(
    _previousState: SettingsSectionActionState,
    _formData: FormData
): Promise<SettingsSectionActionState> {
    const telemetryContext: {
        orgType: string | null
        memberRole: string | null
    } = {
        orgType: null,
        memberRole: null,
    }

    try {
        const { supabase, membership } = await requireBillingEditorSettingsContext()
        telemetryContext.orgType = membership.organization.type
        telemetryContext.memberRole = membership.member_role

        const baseUrl = resolveInviteBaseUrl()
        const portal = await createStripePortalSessionForCurrentUser(supabase, {
            returnUrl: baseUrl
                ? `${baseUrl}/workspace/settings?section=settings-billing`
                : null,
        })
        if (!portal.success) {
            return {
                error: portal.message ?? 'Unable to open billing portal right now.',
                success: null,
            }
        }

        if (portal.redirectUrl) {
            redirect(portal.redirectUrl)
        }

        revalidatePath('/workspace')
        revalidatePath('/workspace/settings')
        revalidateTag(WORKSPACE_IDENTITY_CACHE_TAG, 'max')

        return {
            error: null,
            success: portal.message ?? 'Billing portal ready.',
        }
    } catch (error) {
        if (isNextRedirectError(error)) {
            throw error
        }

        const message = error instanceof Error ? error.message : 'Unable to open billing portal right now.'
        logServerTelemetry({
            name: 'workspace_action_failed',
            route: '/workspace/settings',
            action: 'openBillingPortalSectionAction',
            level: 'error',
            message,
            orgType: telemetryContext.orgType,
            memberRole: telemetryContext.memberRole,
        })
        return { error: message, success: null }
    }
}

export async function updateOrganizationSettingsAction(
    _previousState: UpdateOrganizationSettingsActionState,
    formData: FormData
): Promise<UpdateOrganizationSettingsActionState> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Your session has expired. Please log in again.', success: null }
    }

    const membership = await getPrimaryOrganizationMembershipForUser(supabase, user)
    if (!membership) {
        return { error: 'Complete onboarding before updating organization settings.', success: null }
    }

    if (membership.member_role !== 'owner') {
        return { error: 'Only organization owner can update settings.', success: null }
    }

    const organizationName = normalizeText(formData.get('organizationName'))
    const organizationLocation = normalizeText(formData.get('organizationLocation'))
    const organizationLogoCurrentUrl = normalizeText(formData.get('organizationLogoCurrentUrl'))
    const organizationLogoFile = normalizeUploadedFile(formData.get('organizationLogoFile'))
    const organizationLogoRemove = isChecked(formData.get('organizationLogoRemove'))
    const organizationIndustryTagsRaw = normalizeText(formData.get('organizationIndustryTags')) ?? ''
    const industryTags = parseIndustryTags(organizationIndustryTagsRaw)
    const startupWebsiteUrl = normalizeText(formData.get('startupWebsiteUrl'))
    const startupPitchDeckUrl = normalizeText(formData.get('startupPitchDeckUrl'))
    const startupTeamOverview = normalizeText(formData.get('startupTeamOverview'))
    const startupPostTitle = normalizeText(formData.get('startupPostTitle'))
    const startupPostSummary = normalizeText(formData.get('startupPostSummary'))
    const startupPostStage = normalizeText(formData.get('startupPostStage'))
    const startupPostLocation = normalizeText(formData.get('startupPostLocation'))
    const startupPostIndustryTagsRaw = normalizeText(formData.get('startupPostIndustryTags')) ?? ''
    const startupPostStatus = normalizeStartupPostStatus(formData.get('startupPostStatus')) ?? 'draft'
    const startupPostIndustryTags = parseIndustryTags(startupPostIndustryTagsRaw)

    if (!organizationName || organizationName.length < 2) {
        return { error: 'Organization name must be at least 2 characters.', success: null }
    }

    if (organizationLogoCurrentUrl && !isValidHttpUrl(organizationLogoCurrentUrl)) {
        return { error: 'Current organization logo URL is invalid.', success: null }
    }

    if (organizationLogoFile) {
        if (organizationLogoFile.size > MAX_ORGANIZATION_LOGO_SIZE_BYTES) {
            return { error: 'Organization logo must be 2MB or smaller.', success: null }
        }

        if (!ALLOWED_ORGANIZATION_LOGO_MIME_TYPES.has(organizationLogoFile.type)) {
            return { error: 'Organization logo must be JPG, PNG, WEBP, GIF, or SVG.', success: null }
        }
    }

    const hasAnyStartupPostInput = [
        startupPostTitle,
        startupPostSummary,
        startupPostStage,
        startupPostLocation,
        startupPostIndustryTagsRaw,
    ].some((value) => !!value) || startupPostStatus === 'published'

    if (membership.organization.type === 'startup' && hasAnyStartupPostInput) {
        if (!startupPostTitle || !startupPostSummary) {
            return {
                error: 'Startup discovery post requires both title and summary.',
                success: null,
            }
        }
    }

    try {
        let organizationLogoUrl = organizationLogoCurrentUrl
        if (organizationLogoRemove) {
            organizationLogoUrl = null
        }

        if (organizationLogoFile) {
            const objectPath = buildOrganizationLogoObjectPath(membership.org_id, organizationLogoFile)
            const { error: uploadError } = await supabase.storage
                .from(ORGANIZATION_LOGO_BUCKET)
                .upload(objectPath, organizationLogoFile, {
                    cacheControl: '3600',
                    contentType: organizationLogoFile.type,
                    upsert: false,
                })

            if (uploadError) {
                return { error: `Logo upload failed: ${uploadError.message}`, success: null }
            }

            const { data: publicUrlData } = supabase.storage
                .from(ORGANIZATION_LOGO_BUCKET)
                .getPublicUrl(objectPath)

            organizationLogoUrl = normalizeText(publicUrlData.publicUrl)
        }

        const {
            data: { session },
        } = await supabase.auth.getSession()
        const accessToken = session?.access_token ?? null
        if (!accessToken) {
            return { error: 'Your session has expired. Please log in again.', success: null }
        }

        const result = await apiRequest<{ success: boolean; message: string | null }>({
            path: '/organizations/identity',
            method: 'PATCH',
            accessToken,
            body: {
                name: organizationName,
                location: organizationLocation,
                logoUrl: organizationLogoUrl,
                industryTags: industryTags,
            },
        })

        if (!result?.success) {
            const message = result?.message ?? 'Unable to update organization settings right now.'
            return { error: message, success: null }
        }

        if (organizationLogoCurrentUrl && (organizationLogoRemove || organizationLogoFile)) {
            await removeOrganizationLogoObjectIfManaged(supabase, organizationLogoCurrentUrl)
        }

        if (membership.organization.type === 'startup') {
            const {
                data: { session },
            } = await supabase.auth.getSession()
            const accessToken = session?.access_token ?? null
            if (!accessToken) {
                return { error: 'Your session has expired. Please log in again.', success: null }
            }

            const profileResult = await apiRequest<{ success: boolean; message: string | null }>({
                path: '/startups/profile',
                method: 'PATCH',
                accessToken,
                body: {
                    websiteUrl: startupWebsiteUrl,
                    pitchDeckUrl: startupPitchDeckUrl,
                    teamOverview: startupTeamOverview,
                },
            })

            if (!profileResult?.success) {
                const message = profileResult?.message ?? 'Unable to update organization settings right now.'
                return { error: message, success: null }
            }

            if (hasAnyStartupPostInput && startupPostTitle && startupPostSummary) {
                const postResult = await apiRequest<{ success: boolean; message: string | null }>({
                    path: '/startups/post',
                    method: 'PATCH',
                    accessToken,
                    body: {
                        title: startupPostTitle,
                        summary: startupPostSummary,
                        stage: startupPostStage,
                        location: startupPostLocation,
                        industryTags: startupPostIndustryTags,
                        status: startupPostStatus,
                    },
                })

                if (!postResult?.success) {
                    const message = postResult?.message ?? 'Unable to update organization settings right now.'
                    return { error: message, success: null }
                }
            }
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update organization settings right now.'
        logServerTelemetry({
            name: 'workspace_action_failed',
            route: '/workspace/settings',
            action: 'updateOrganizationSettingsAction',
            level: 'error',
            message,
            userId: user.id,
            orgType: membership.organization.type,
            memberRole: membership.member_role,
        })
        return { error: message, success: null }
    }

    revalidatePath('/workspace')
    revalidatePath('/workspace/settings')
    revalidateTag(WORKSPACE_IDENTITY_CACHE_TAG, 'max')

    return { error: null, success: 'Organization settings updated successfully.' }
}

export async function createOrganizationInviteAction(
    _previousState: CreateOrganizationInviteActionState,
    formData: FormData
): Promise<CreateOrganizationInviteActionState> {
    void _previousState

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return {
            error: 'Your session has expired. Please log in again.',
            success: null,
            inviteToken: null,
            inviteLink: null,
        }
    }

    const membership = await getPrimaryOrganizationMembershipForUser(supabase, user)
    if (!membership) {
        return {
            error: 'Complete onboarding before inviting members.',
            success: null,
            inviteToken: null,
            inviteLink: null,
        }
    }

    if (membership.member_role !== 'owner') {
        return {
            error: 'Only organization owner can invite members.',
            success: null,
            inviteToken: null,
            inviteLink: null,
        }
    }

    const invitedEmail = normalizeText(formData.get('invitedEmail'))
    const memberRole = normalizeInviteMemberRole(formData.get('memberRole')) ?? 'member'
    const expiresInDays = normalizeInviteExpiryDays(formData.get('expiresInDays'))

    if (!invitedEmail) {
        return {
            error: 'Invite email is required.',
            success: null,
            inviteToken: null,
            inviteLink: null,
        }
    }

    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    try {
        const {
            data: { session },
        } = await supabase.auth.getSession()
        const accessToken = session?.access_token ?? null
        if (!accessToken) {
            return {
                error: 'Your session has expired. Please log in again.',
                success: null,
                inviteToken: null,
                inviteLink: null,
            }
        }

        const result = await apiRequest<{
            success: boolean
            message: string | null
            inviteId: string | null
            inviteToken: string | null
        }>({
            path: '/organizations/invites',
            method: 'POST',
            accessToken,
            body: {
                invitedEmail,
                memberRole,
                expiresAt,
            },
        })

        const payload = result
        if (!payload?.success || !payload.inviteToken) {
            const message = payload?.message ?? 'Unable to create invite right now.'
            return {
                error: message,
                success: null,
                inviteToken: null,
                inviteLink: null,
            }
        }

        const invitePath = `/invite?token=${encodeURIComponent(payload.inviteToken)}`
        const inviteBaseUrl = resolveInviteBaseUrl()
        const inviteLink = inviteBaseUrl ? `${inviteBaseUrl}${invitePath}` : invitePath

        revalidatePath('/workspace/settings')

        return {
            error: null,
            success: `Invite created for ${invitedEmail}. Share the link below.`,
            inviteToken: payload.inviteToken,
            inviteLink,
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to create invite right now.'
        logServerTelemetry({
            name: 'workspace_action_failed',
            route: '/workspace/settings',
            action: 'createOrganizationInviteAction',
            level: 'error',
            message,
            userId: user.id,
            orgType: membership.organization.type,
            memberRole: membership.member_role,
        })
        return {
            error: message,
            success: null,
            inviteToken: null,
            inviteLink: null,
        }
    }
}

export async function revokeOrganizationInviteAction(formData: FormData): Promise<void> {
    const telemetryContext: {
        userId: string | null
        orgType: string | null
        memberRole: string | null
    } = {
        userId: null,
        orgType: null,
        memberRole: null,
    }

    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            throw new Error('Unauthorized')
        }
        telemetryContext.userId = user.id

        const membership = await getPrimaryOrganizationMembershipForUser(supabase, user)
        if (!membership) {
            throw new Error('Organization membership is required.')
        }
        telemetryContext.orgType = membership.organization.type
        telemetryContext.memberRole = membership.member_role

        if (membership.member_role !== 'owner') {
            throw new Error('Only organization owner can revoke invites.')
        }

        const inviteId = normalizeText(formData.get('inviteId'))
        if (!inviteId) {
            throw new Error('Invite id is required.')
        }

        const {
            data: { session },
        } = await supabase.auth.getSession()
        const accessToken = session?.access_token ?? null
        if (!accessToken) {
            throw new Error('Your session has expired. Please log in again.')
        }

        const result = await apiRequest<{ success: boolean; message: string | null }>({
            path: `/organizations/invites/${encodeURIComponent(inviteId)}`,
            method: 'DELETE',
            accessToken,
        })

        if (!result?.success) {
            const message = result?.message ?? 'Unable to revoke invite right now.'
            throw new Error(message)
        }
        revalidatePath('/workspace/settings')
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to revoke invite right now.'
        logServerTelemetry({
            name: 'workspace_action_failed',
            route: '/workspace/settings',
            action: 'revokeOrganizationInviteAction',
            level: 'error',
            message,
            userId: telemetryContext.userId,
            orgType: telemetryContext.orgType,
            memberRole: telemetryContext.memberRole,
        })
        throw error
    }
}
