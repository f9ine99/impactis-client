'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getBetterAuthToken } from '@/lib/better-auth-token'
import { logServerTelemetry } from '@/lib/telemetry/server'
import {
    type BillingInterval,
    createStripeCheckoutSessionForCurrentUser,
    createStripePortalSessionForCurrentUser,
    updateBillingSubscriptionForCurrentUser,
} from '@/modules/billing'
import {
    getPrimaryOrganizationMembershipForUser,
    parseIndustryTags,
} from '@/modules/organizations'
import {
    type StartupDataRoomDocumentType,
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
const STARTUP_DATA_ROOM_ASSET_BUCKET = 'startup-data-room-assets'
const MAX_STARTUP_DATA_ROOM_ASSET_SIZE_BYTES = 100 * 1024 * 1024
const ALLOWED_STARTUP_PITCH_DECK_ASSET_MIME_TYPES = new Set([
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4',
    'video/webm',
    'video/quicktime',
])
const ALLOWED_STARTUP_DATA_ROOM_DOCUMENT_ASSET_MIME_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
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

function normalizeStartupDataRoomDocumentType(value: FormDataEntryValue | null): StartupDataRoomDocumentType | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    if (normalized === 'financial_doc') {
        return 'financial_model'
    }

    if (normalized === 'legal_doc') {
        return 'legal_company_docs'
    }

    if (
        normalized === 'pitch_deck'
        || normalized === 'financial_model'
        || normalized === 'cap_table'
        || normalized === 'traction_metrics'
        || normalized === 'legal_company_docs'
        || normalized === 'incorporation_docs'
        || normalized === 'customer_contracts_summaries'
        || normalized === 'term_sheet_drafts'
    ) {
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

function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
    if (typeof value !== 'string') {
        return fallback
    }

    const normalized = value.trim().toLowerCase()
    if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
        return true
    }

    if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
        return false
    }

    return fallback
}

function isStripeBillingRedirectEnabled(): boolean {
    return parseBooleanEnv(
        process.env.BILLING_STRIPE_REDIRECTS_ENABLED
            ?? process.env.NEXT_PUBLIC_BILLING_STRIPE_REDIRECTS_ENABLED,
        true
    )
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

function buildStartupDataRoomAssetObjectPath(
    orgId: string,
    file: File,
    documentType: StartupDataRoomDocumentType
): string {
    const extension = resolveStartupReadinessAssetFileExtension(file)
    return `${orgId}/data-room/${documentType}-${crypto.randomUUID()}.${extension}`
}

import { saveLocalFile, deleteLocalFile, buildPublicUrlForObject } from '@/lib/storage/local-storage'

async function removeOrganizationLogoObjectIfManaged(
    _supabase: unknown,
    publicUrl: string | null
): Promise<void> {
    const normalizedUrl = normalizeText(publicUrl)
    if (!normalizedUrl) {
        return
    }

    try {
        const url = new URL(normalizedUrl)
        const prefix = '/api/uploads/'
        if (!url.pathname.startsWith(prefix)) {
            return
        }
        const objectPath = decodeURIComponent(url.pathname.slice(prefix.length)).trim()
        if (!objectPath) {
            return
        }
        await deleteLocalFile(objectPath)
    } catch {
        return
    }
}

async function uploadStartupDataRoomAsset(input: {
    orgId: string
    documentType: StartupDataRoomDocumentType
    file: File
}): Promise<{ publicUrl: string | null; storageBucket: string; storageObjectPath: string }> {
    const accessToken = await getBetterAuthToken()
    if (!accessToken) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const uploadPayload = await apiRequest<{
        success: boolean
        message: string | null
        uploadUrl: string | null
        publicUrl: string | null
        objectKey: string | null
    }>({
        path: '/files/startups/data-room/upload-url',
        method: 'POST',
        accessToken,
        body: {
            orgId: input.orgId,
            documentType: input.documentType,
            fileName: input.file.name,
            contentType: input.file.type,
            contentLength: input.file.size,
        },
        throwOnError: true,
    })

    if (!uploadPayload?.success || !uploadPayload.uploadUrl || !uploadPayload.objectKey) {
        throw new Error(uploadPayload?.message || 'Unable to create upload URL for data room document.')
    }

    const putResponse = await fetch(uploadPayload.uploadUrl, {
        method: 'PUT',
        headers: {
            'content-type': input.file.type,
        },
        body: input.file,
    })

    if (!putResponse.ok) {
        throw new Error('Upload to storage failed.')
    }

    const publicUrl = normalizeText(uploadPayload.publicUrl ?? null)
    const objectKey = uploadPayload.objectKey
    const logicalBucket = STARTUP_DATA_ROOM_ASSET_BUCKET
    const storageObjectPath = objectKey.startsWith(`${logicalBucket}/`)
        ? objectKey.slice(logicalBucket.length + 1)
        : objectKey

    return {
        publicUrl,
        storageBucket: logicalBucket,
        storageObjectPath,
    }
}

async function removeStartupDataRoomAssetIfManaged(
    _supabase: unknown,
    input: {
        publicUrl: string | null
        storageBucket?: string | null
        storageObjectPath?: string | null
    }
): Promise<void> {
    const storageBucket = typeof input.storageBucket === 'string' ? input.storageBucket.trim() : null
    const storageObjectPath = typeof input.storageObjectPath === 'string' ? input.storageObjectPath.trim() : null

    if (storageBucket === 'local' && storageObjectPath) {
        await deleteLocalFile(storageObjectPath)
        return
    }

    const normalizedUrl = normalizeText(input.publicUrl)
    if (!normalizedUrl) {
        return
    }

    try {
        const url = new URL(normalizedUrl)
        const prefix = '/api/uploads/'
        if (!url.pathname.startsWith(prefix)) {
            return
        }
        const objectPath = decodeURIComponent(url.pathname.slice(prefix.length)).trim()
        if (!objectPath) {
            return
        }
        await deleteLocalFile(objectPath)
    } catch {
        return
    }
}

function resolveInviteBaseUrl(): string {
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '')
    if (configuredSiteUrl) {
        return configuredSiteUrl
    }

    return ''
}

async function requireOwnerSettingsContext(): Promise<{
    membership: NonNullable<Awaited<ReturnType<typeof getPrimaryOrganizationMembershipForUser>>>
    userId: string
}> {
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    const user = session?.user as any

    if (!user) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const membership = await getPrimaryOrganizationMembershipForUser(null as any, user)
    if (!membership) {
        throw new Error('Complete onboarding before updating organization settings.')
    }

    if (membership.member_role !== 'owner') {
        throw new Error('Only organization owner can update settings.')
    }

    return { membership, userId: user.id }
}

async function requireBillingEditorSettingsContext(): Promise<{
    membership: NonNullable<Awaited<ReturnType<typeof getPrimaryOrganizationMembershipForUser>>>
}> {
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    const user = session?.user as any

    if (!user) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const membership = await getPrimaryOrganizationMembershipForUser(null as any, user)
    if (!membership) {
        throw new Error('Complete onboarding before updating billing settings.')
    }

    if (membership.member_role !== 'owner' && membership.member_role !== 'admin') {
        throw new Error('Only organization owner or admin can update billing settings.')
    }

    return { membership }
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
        const { membership, userId } = await requireOwnerSettingsContext()
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
            const accessToken = await getBetterAuthToken()
            if (!accessToken) {
                return { error: 'Your session has expired. Please log in again.', success: null }
            }

            const uploadPayload = await apiRequest<{
                success: boolean
                message: string | null
                uploadUrl: string | null
                publicUrl: string | null
                objectKey: string | null
            }>({
                path: '/files/organizations/logo/upload-url',
                method: 'POST',
                accessToken,
                body: {
                    orgId: membership.org_id,
                    fileName: organizationLogoFile.name,
                    contentType: organizationLogoFile.type,
                    contentLength: organizationLogoFile.size,
                },
                throwOnError: true,
            })

            if (!uploadPayload?.success || !uploadPayload.uploadUrl) {
                const message = uploadPayload?.message ?? 'Unable to create organization logo upload URL.'
                return { error: message, success: null }
            }

            const putResponse = await fetch(uploadPayload.uploadUrl, {
                method: 'PUT',
                headers: {
                    'content-type': organizationLogoFile.type,
                },
                body: organizationLogoFile,
            })

            if (!putResponse.ok) {
                return { error: 'Unable to upload organization logo right now.', success: null }
            }

            organizationLogoUrl = uploadPayload.publicUrl ?? null
        }

        const accessToken = await getBetterAuthToken()
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
            const profilePatch = await apiRequest<{
                thesis: string | null
                sector_tags: string[]
                check_size_min_usd: number | null
                check_size_max_usd: number | null
            }>({
                path: 'organizations/me/investor-profile',
                method: 'PATCH',
                accessToken,
                body: {
                    thesis: investorThesis,
                    sectorTags: investorSectorTags,
                    checkSizeMinUsd: investorCheckSizeMinUsd,
                    checkSizeMaxUsd: investorCheckSizeMaxUsd,
                },
            })
            if (!profilePatch) {
                return { error: 'Organization identity updated but investor profile could not be saved.', success: null }
            }
        }

        if (organizationLogoCurrentUrl && (organizationLogoRemove || organizationLogoFile)) {
            await removeOrganizationLogoObjectIfManaged(null as any, organizationLogoCurrentUrl)
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
        const { membership } = await requireOwnerSettingsContext()
        telemetryContext.orgType = membership.organization.type
        telemetryContext.memberRole = membership.member_role

        if (membership.organization.type !== 'startup') {
            return { error: 'Startup readiness fields are available only for startup organizations.', success: null }
        }

        const startupWebsiteUrl = normalizeText(formData.get('startupWebsiteUrl'))
        const startupTeamOverview = normalizeText(formData.get('startupTeamOverview'))
        const startupCompanyStage = normalizeText(formData.get('startupCompanyStage'))
        const startupFoundingYear = normalizeInteger(formData.get('startupFoundingYear'))
        const startupTeamSize = normalizeInteger(formData.get('startupTeamSize'))
        const startupTargetMarket = normalizeText(formData.get('startupTargetMarket'))
        const startupBusinessModel = normalizeText(formData.get('startupBusinessModel'))
        const startupTractionSummary = normalizeText(formData.get('startupTractionSummary'))
        const startupFinancialSummary = normalizeText(formData.get('startupFinancialSummary'))
        const startupLegalSummary = normalizeText(formData.get('startupLegalSummary'))

        if (startupWebsiteUrl && !isValidHttpUrl(startupWebsiteUrl)) {
            return { error: 'Website URL must be a valid http/https link.', success: null }
        }

        if (startupFoundingYear && (startupFoundingYear < 1900 || startupFoundingYear > 2100)) {
            return { error: 'Founding year must be between 1900 and 2100.', success: null }
        }

        if (startupTeamSize && startupTeamSize < 1) {
            return { error: 'Team size must be at least 1.', success: null }
        }

        const accessToken = await getBetterAuthToken()
        if (!accessToken) {
            return { error: 'Your session has expired. Please log in again.', success: null }
        }

        const profileResult = await apiRequest<{ success: boolean; message: string | null }>({
            path: '/startups/profile',
            method: 'PATCH',
            accessToken,
            body: {
                websiteUrl: startupWebsiteUrl,
                teamOverview: startupTeamOverview,
                companyStage: startupCompanyStage,
                foundingYear: startupFoundingYear,
                teamSize: startupTeamSize,
                targetMarket: startupTargetMarket,
                businessModel: startupBusinessModel,
                tractionSummary: startupTractionSummary,
                financialSummary: startupFinancialSummary,
                legalSummary: startupLegalSummary,
            },
        })

        if (!profileResult?.success) {
            const message = profileResult?.message ?? 'Unable to update startup readiness right now.'
            return { error: message, success: null }
        }

        revalidatePath('/workspace')
        revalidatePath('/workspace/settings')
        revalidateTag(WORKSPACE_IDENTITY_CACHE_TAG, 'max')

        return { error: null, success: 'Startup readiness profile updated.' }
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
        const { membership } = await requireOwnerSettingsContext()
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
        const startupPostNeedAdvisor = formData.get('startupPostNeedAdvisor') === 'on'

        if (!startupPostTitle || !startupPostSummary) {
            return { error: 'Startup discovery post requires both title and summary.', success: null }
        }

        const accessToken = await getBetterAuthToken()
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
                needAdvisor: startupPostNeedAdvisor,
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

export async function upsertStartupDataRoomDocumentSectionAction(
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
        const { membership } = await requireOwnerSettingsContext()
        telemetryContext.orgType = membership.organization.type
        telemetryContext.memberRole = membership.member_role

        if (membership.organization.type !== 'startup') {
            return { error: 'Data room is available only for startup organizations.', success: null }
        }

        const documentType = normalizeStartupDataRoomDocumentType(formData.get('dataRoomDocumentType'))
        const folderPath = normalizeText(formData.get('dataRoomFolderPath'))
        const title = normalizeText(formData.get('dataRoomDocumentTitle'))
        const summary = normalizeText(formData.get('dataRoomDocumentSummary'))
        const file = normalizeUploadedFile(formData.get('dataRoomDocumentFile'))

        if (!documentType) {
            return { error: 'Data room document type is required.', success: null }
        }

        if (!title || title.length < 2) {
            return { error: 'Data room document title must be at least 2 characters.', success: null }
        }

        if (!file) {
            return { error: 'Select a file to upload.', success: null }
        }

        if (file.size > MAX_STARTUP_DATA_ROOM_ASSET_SIZE_BYTES) {
            return { error: 'Data room file must be 100MB or smaller.', success: null }
        }

        const isPitchDeck = documentType === 'pitch_deck'
        const allowedMimeTypes = isPitchDeck
            ? ALLOWED_STARTUP_PITCH_DECK_ASSET_MIME_TYPES
            : ALLOWED_STARTUP_DATA_ROOM_DOCUMENT_ASSET_MIME_TYPES
        if (!allowedMimeTypes.has(file.type)) {
            return {
                error: isPitchDeck
                    ? 'Pitch deck must be PDF/PPT/PPTX or MP4/WEBM/MOV.'
                    : 'Data room document must be PDF, DOC/DOCX, XLS/XLSX, TXT, or CSV.',
                success: null,
            }
        }

        const accessToken = await getBetterAuthToken()
        if (!accessToken) {
            return { error: 'Your session has expired. Please log in again.', success: null }
        }

        const uploadPayload = await uploadStartupDataRoomAsset({
            orgId: membership.org_id,
            documentType,
            file,
        })
        const publicUrl = normalizeText(uploadPayload.publicUrl)
        if (!publicUrl) {
            return { error: 'Data room upload did not return a valid public URL.', success: null }
        }

        const mutation = await apiRequest<{ success: boolean; message: string | null }>({
            path: '/startups/data-room/documents',
            method: 'POST',
            accessToken,
            body: {
                documentType,
                folderPath,
                title,
                summary,
                fileUrl: publicUrl,
                storageBucket: uploadPayload.storageBucket,
                storageObjectPath: uploadPayload.storageObjectPath,
                fileName: normalizeText(file.name),
                fileSizeBytes: file.size,
                contentType: normalizeText(file.type),
            },
        })
        if (!mutation?.success) {
            return { error: mutation?.message ?? 'Unable to save data room document right now.', success: null }
        }

        revalidatePath('/workspace')
        revalidatePath('/workspace/settings')
        revalidateTag(WORKSPACE_IDENTITY_CACHE_TAG, 'max')

        return { error: null, success: 'Data room document uploaded.' }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to upload data room document right now.'
        logServerTelemetry({
            name: 'workspace_action_failed',
            route: '/workspace/settings',
            action: 'upsertStartupDataRoomDocumentSectionAction',
            level: 'error',
            message,
            orgType: telemetryContext.orgType,
            memberRole: telemetryContext.memberRole,
        })
        return { error: message, success: null }
    }
}

export async function deleteStartupDataRoomDocumentSectionAction(
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
        const { membership } = await requireOwnerSettingsContext()
        telemetryContext.orgType = membership.organization.type
        telemetryContext.memberRole = membership.member_role

        if (membership.organization.type !== 'startup') {
            return { error: 'Data room is available only for startup organizations.', success: null }
        }

        const documentId = normalizeText(formData.get('dataRoomDocumentId'))
        const documentUrl = normalizeText(formData.get('dataRoomDocumentUrl'))
        const documentStorageBucket = normalizeText(formData.get('dataRoomDocumentStorageBucket'))
        const documentStorageObjectPath = normalizeText(formData.get('dataRoomDocumentStorageObjectPath'))
        if (!documentId) {
            return { error: 'Data room document id is required.', success: null }
        }

        const accessToken = await getBetterAuthToken()
        if (!accessToken) {
            return { error: 'Your session has expired. Please log in again.', success: null }
        }

        const mutation = await apiRequest<{ success: boolean; message: string | null }>({
            path: `/startups/data-room/documents/${encodeURIComponent(documentId)}`,
            method: 'DELETE',
            accessToken,
        })
        if (!mutation?.success) {
            return { error: mutation?.message ?? 'Unable to remove data room document right now.', success: null }
        }

        await removeStartupDataRoomAssetIfManaged(null as any, {
            publicUrl: documentUrl,
            storageBucket: documentStorageBucket,
            storageObjectPath: documentStorageObjectPath,
        })

        revalidatePath('/workspace')
        revalidatePath('/workspace/settings')
        revalidateTag(WORKSPACE_IDENTITY_CACHE_TAG, 'max')

        return { error: null, success: 'Data room document removed.' }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to remove data room document right now.'
        logServerTelemetry({
            name: 'workspace_action_failed',
            route: '/workspace/settings',
            action: 'deleteStartupDataRoomDocumentSectionAction',
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
        const { membership } = await requireBillingEditorSettingsContext()
        telemetryContext.orgType = membership.organization.type
        telemetryContext.memberRole = membership.member_role

        const planCode = normalizeText(formData.get('planCode'))?.toLowerCase() ?? null
        const billingInterval = normalizeBillingInterval(formData.get('billingInterval'))
        if (!planCode) {
            return { error: 'Select a plan before updating subscription.', success: null }
        }

        const stripeRedirectEnabled = isStripeBillingRedirectEnabled()
        if (!stripeRedirectEnabled) {
            const mutation = await updateBillingSubscriptionForCurrentUser(null as any, {
                planCode,
                billingInterval,
            })

            if (!mutation.success) {
                const normalizedMessage = mutation.message?.toLowerCase() ?? ''
                const requiresStripeCheckout = normalizedMessage.includes('paid plans require stripe checkout')
                return {
                    error: requiresStripeCheckout
                        ? 'Paid plan checkout is currently disabled until Stripe-hosted billing is enabled.'
                        : (mutation.message ?? 'Unable to update billing subscription right now.'),
                    success: null,
                }
            }

            revalidatePath('/workspace')
            revalidatePath('/workspace/settings')
            revalidateTag(WORKSPACE_IDENTITY_CACHE_TAG, 'max')

            return {
                error: null,
                success: mutation.message ?? 'Billing subscription updated.',
            }
        }

        const baseUrl = resolveInviteBaseUrl()
        const checkout = await createStripeCheckoutSessionForCurrentUser(null as any, {
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
        const { membership } = await requireBillingEditorSettingsContext()
        telemetryContext.orgType = membership.organization.type
        telemetryContext.memberRole = membership.member_role

        if (!isStripeBillingRedirectEnabled()) {
            return {
                error: 'Stripe billing portal is disabled in this environment.',
                success: null,
            }
        }

        const baseUrl = resolveInviteBaseUrl()
        const portal = await createStripePortalSessionForCurrentUser(null as any, {
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
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    const user = session?.user as any

    if (!user) {
        return { error: 'Your session has expired. Please log in again.', success: null }
    }

    const membership = await getPrimaryOrganizationMembershipForUser(null as any, user)
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
            const storagePath = `${ORGANIZATION_LOGO_BUCKET}/${objectPath}`
            await saveLocalFile(storagePath, organizationLogoFile)
            organizationLogoUrl = buildPublicUrlForObject(storagePath)
        }

        const accessToken = await getBetterAuthToken()
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
            await removeOrganizationLogoObjectIfManaged(null as any, organizationLogoCurrentUrl)
        }

        if (membership.organization.type === 'startup') {
            const accessToken = await getBetterAuthToken()
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

    const session = await auth.api.getSession({
        headers: await headers(),
    })
    const user = session?.user as any

    if (!user) {
        return {
            error: 'Your session has expired. Please log in again.',
            success: null,
            inviteToken: null,
            inviteLink: null,
        }
    }

    const membership = await getPrimaryOrganizationMembershipForUser(null as any, user)
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
        const accessToken = await getBetterAuthToken()
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
        const session = await auth.api.getSession({
            headers: await headers(),
        })
        const user = session?.user as any

        if (!user) {
            throw new Error('Unauthorized')
        }
        telemetryContext.userId = user.id

        const membership = await getPrimaryOrganizationMembershipForUser(null as any, user)
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

        const accessToken = await getBetterAuthToken()
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
