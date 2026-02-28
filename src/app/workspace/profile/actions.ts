'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logServerTelemetry } from '@/lib/telemetry/server'
import { getPrimaryOrganizationMembershipForUser } from '@/modules/organizations'
import { WORKSPACE_IDENTITY_CACHE_TAG } from '@/modules/workspace'
import { apiRequest } from '@/lib/api/rest-client'

export type UpdateProfileActionState = {
    error: string | null
    success: string | null
}

const PROFILE_AVATAR_BUCKET = 'profile-avatars'
const MAX_PROFILE_AVATAR_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_PROFILE_AVATAR_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
])
const ALLOWED_PREFERRED_CONTACT_METHODS = new Set(['email', 'phone', 'linkedin'] as const)

type PreferredContactMethod = 'email' | 'phone' | 'linkedin'

function normalizeText(value: FormDataEntryValue | null): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function normalizePhone(value: string | null): string | null {
    if (!value) {
        return null
    }

    const normalized = value.replace(/[\s().-]/g, '')
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
        return null
    }

    return normalized
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

function normalizePreferredContactMethod(value: string | null): PreferredContactMethod | null {
    if (!value) {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return ALLOWED_PREFERRED_CONTACT_METHODS.has(normalized as PreferredContactMethod)
        ? (normalized as PreferredContactMethod)
        : null
}

function isChecked(value: FormDataEntryValue | null): boolean {
    return typeof value === 'string' && value === '1'
}

function isValidHttpUrl(value: string): boolean {
    try {
        const parsed = new URL(value)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
        return false
    }
}

function isLinkedInUrl(value: string): boolean {
    try {
        const parsed = new URL(value)
        const host = parsed.hostname.toLowerCase()
        return (
            (parsed.protocol === 'http:' || parsed.protocol === 'https:')
            && (host === 'linkedin.com' || host.endsWith('.linkedin.com'))
        )
    } catch {
        return false
    }
}

function isValidTimeZone(value: string): boolean {
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: value })
        return true
    } catch {
        return false
    }
}

function resolveAvatarFileExtension(file: File): string {
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

function buildProfileAvatarObjectPath(userId: string, file: File): string {
    const extension = resolveAvatarFileExtension(file)
    return `${userId}/avatar-${crypto.randomUUID()}.${extension}`
}

function extractProfileAvatarObjectPath(publicUrl: string): string | null {
    try {
        const url = new URL(publicUrl)
        const prefix = `/storage/v1/object/public/${PROFILE_AVATAR_BUCKET}/`
        if (!url.pathname.startsWith(prefix)) {
            return null
        }

        const path = decodeURIComponent(url.pathname.slice(prefix.length)).trim()
        return path.length > 0 ? path : null
    } catch {
        return null
    }
}

async function removeProfileAvatarObjectIfManaged(
    supabase: Awaited<ReturnType<typeof createClient>>,
    publicUrl: string | null
): Promise<void> {
    const normalizedUrl = normalizeText(publicUrl)
    if (!normalizedUrl) {
        return
    }

    const objectPath = extractProfileAvatarObjectPath(normalizedUrl)
    if (!objectPath) {
        return
    }

    await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([objectPath])
}

export async function updateProfileAction(
    _previousState: UpdateProfileActionState,
    formData: FormData
): Promise<UpdateProfileActionState> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Your session has expired. Please log in again.', success: null }
    }

    const membership = await getPrimaryOrganizationMembershipForUser(supabase, user)
    if (!membership) {
        return { error: 'Complete onboarding before editing your profile.', success: null }
    }

    const fullName = normalizeText(formData.get('fullName'))
    const location = normalizeText(formData.get('location'))
    const bio = normalizeText(formData.get('bio'))
    const phoneRaw = normalizeText(formData.get('phone'))
    const phone = normalizePhone(phoneRaw)
    const headline = normalizeText(formData.get('headline'))
    const websiteUrl = normalizeText(formData.get('websiteUrl'))
    const linkedinUrl = normalizeText(formData.get('linkedinUrl'))
    const timezoneName = normalizeText(formData.get('timezoneName'))
    const preferredContactMethodRaw = normalizeText(formData.get('preferredContactMethod'))
    const preferredContactMethod = normalizePreferredContactMethod(preferredContactMethodRaw)
    const avatarCurrentUrl = normalizeText(formData.get('avatarCurrentUrl'))
    const avatarFile = normalizeUploadedFile(formData.get('avatarFile'))
    const avatarRemove = isChecked(formData.get('avatarRemove'))

    if (fullName && fullName.length < 2) {
        return { error: 'Full name must be at least 2 characters.', success: null }
    }

    if (bio && bio.length > 500) {
        return { error: 'Bio cannot be longer than 500 characters.', success: null }
    }

    if (headline && headline.length > 120) {
        return { error: 'Headline cannot be longer than 120 characters.', success: null }
    }

    if (phoneRaw && !phone) {
        return { error: 'Phone must use international format like +14155552671.', success: null }
    }

    if (websiteUrl && !isValidHttpUrl(websiteUrl)) {
        return { error: 'Website URL must be a valid http/https link.', success: null }
    }

    if (linkedinUrl && !isValidHttpUrl(linkedinUrl)) {
        return { error: 'LinkedIn URL must be a valid http/https link.', success: null }
    }

    if (linkedinUrl && !isLinkedInUrl(linkedinUrl)) {
        return { error: 'LinkedIn URL must point to linkedin.com.', success: null }
    }

    if (!timezoneName) {
        return { error: 'Timezone is required.', success: null }
    }

    if (!isValidTimeZone(timezoneName)) {
        return { error: 'Timezone must be a valid IANA timezone (e.g. America/New_York).', success: null }
    }

    if (preferredContactMethodRaw && !preferredContactMethod) {
        return { error: 'Preferred contact method is invalid.', success: null }
    }

    if (preferredContactMethod === 'phone' && !phone) {
        return { error: 'Add a phone number before selecting phone as preferred contact.', success: null }
    }

    if (preferredContactMethod === 'linkedin' && !linkedinUrl) {
        return { error: 'Add a LinkedIn URL before selecting LinkedIn as preferred contact.', success: null }
    }

    if (avatarCurrentUrl && !isValidHttpUrl(avatarCurrentUrl)) {
        return { error: 'Current avatar URL is invalid.', success: null }
    }

    if (avatarFile) {
        if (avatarFile.size > MAX_PROFILE_AVATAR_SIZE_BYTES) {
            return { error: 'Profile avatar must be 2MB or smaller.', success: null }
        }

        if (!ALLOWED_PROFILE_AVATAR_MIME_TYPES.has(avatarFile.type)) {
            return { error: 'Profile avatar must be JPG, PNG, WEBP, GIF, or SVG.', success: null }
        }
    }

    try {
        let avatarUrl = avatarCurrentUrl
        if (avatarRemove) {
            avatarUrl = null
        }

        if (avatarFile) {
            const objectPath = buildProfileAvatarObjectPath(user.id, avatarFile)
            const { error: uploadError } = await supabase.storage
                .from(PROFILE_AVATAR_BUCKET)
                .upload(objectPath, avatarFile, {
                    cacheControl: '3600',
                    contentType: avatarFile.type,
                    upsert: false,
                })

            if (uploadError) {
                return { error: `Avatar upload failed: ${uploadError.message}`, success: null }
            }

            const { data: publicUrlData } = supabase.storage
                .from(PROFILE_AVATAR_BUCKET)
                .getPublicUrl(objectPath)

            avatarUrl = normalizeText(publicUrlData.publicUrl)
        }

        const {
            data: { session },
        } = await supabase.auth.getSession()
        const accessToken = session?.access_token ?? null
        if (!accessToken) {
            return { error: 'Your session has expired. Please log in again.', success: null }
        }

        const result = await apiRequest<{ success: boolean; message: string | null }>({
            path: '/profiles/me',
            method: 'PATCH',
            accessToken,
            body: {
                fullName,
                location,
                bio,
                phone,
                headline,
                websiteUrl,
                linkedinUrl,
                timezoneName,
                preferredContactMethod,
                avatarUrl,
            },
        })

        if (!result?.success) {
            const message = result?.message ?? 'Unable to update profile right now.'
            return { error: message, success: null }
        }

        if (avatarCurrentUrl && (avatarRemove || avatarFile)) {
            await removeProfileAvatarObjectIfManaged(supabase, avatarCurrentUrl)
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update profile right now.'
        logServerTelemetry({
            name: 'workspace_action_failed',
            route: '/workspace/profile',
            action: 'updateProfileAction',
            level: 'error',
            message,
            userId: user.id,
            orgType: membership.organization.type,
            memberRole: membership.member_role,
        })
        return { error: message, success: null }
    }

    revalidatePath('/workspace')
    revalidatePath('/workspace/profile')
    revalidateTag(WORKSPACE_IDENTITY_CACHE_TAG, 'max')

    return { error: null, success: 'Profile updated successfully.' }
}
