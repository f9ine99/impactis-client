import type { SupabaseClient, User } from '@supabase/supabase-js'
import { apiRequest } from '@/lib/api/rest-client'
import type { UserProfile } from './types'

type PreferredContactMethod = NonNullable<UserProfile['preferred_contact_method']>

type ProfileRow = {
    id: string
    full_name: string | null
    location: string | null
    bio: string | null
    avatar_url: string | null
    phone: string | null
    headline: string | null
    website_url: string | null
    linkedin_url: string | null
    timezone_name: string | null
    preferred_contact_method: string | null
}

function normalizeText(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function normalizePreferredContactMethod(value: unknown): PreferredContactMethod | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    if (normalized === 'email' || normalized === 'phone' || normalized === 'linkedin') {
        return normalized
    }

    return null
}

function mapRowToUserProfile(row: ProfileRow): UserProfile {
    return {
        id: row.id,
        full_name: normalizeText(row.full_name),
        location: normalizeText(row.location),
        bio: normalizeText(row.bio),
        avatar_url: normalizeText(row.avatar_url),
        phone: normalizeText(row.phone),
        headline: normalizeText(row.headline),
        website_url: normalizeText(row.website_url),
        linkedin_url: normalizeText(row.linkedin_url),
        timezone_name: normalizeText(row.timezone_name),
        preferred_contact_method: normalizePreferredContactMethod(row.preferred_contact_method),
    }
}

function getEmptyProfileFallback(userId: string): UserProfile {
    return {
        id: userId,
        full_name: null,
        location: null,
        bio: null,
        avatar_url: null,
        phone: null,
        headline: null,
        website_url: null,
        linkedin_url: null,
        timezone_name: null,
        preferred_contact_method: null,
    }
}

type WorkspaceIdentityApiResponse = {
    profile: unknown
}

async function getAccessToken(supabase: SupabaseClient): Promise<string | null> {
    const {
        data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token ?? null
}

export async function getProfileByUserId(
    supabase: SupabaseClient,
    userId: string
): Promise<UserProfile | null> {
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        return null
    }

    const data = await apiRequest<WorkspaceIdentityApiResponse | null>({
        path: '/workspace/identity',
        method: 'GET',
        accessToken,
    })
    const profile = data?.profile
    if (!profile || typeof profile !== 'object') {
        console.warn(`[profiles] Unable to load profile for user ${userId}.`)
        return null
    }

    return mapRowToUserProfile(profile as ProfileRow)
}

export async function getResolvedProfileForUser(
    supabase: SupabaseClient,
    user: User
): Promise<UserProfile> {
    const profile = await getProfileByUserId(supabase, user.id)

    if (!profile) {
        return getEmptyProfileFallback(user.id)
    }

    return profile
}

export async function updateProfileForUser(
    supabase: SupabaseClient,
    user: User,
    input: {
        fullName?: string | null
        location?: string | null
        bio?: string | null
        avatarUrl?: string | null
        phone?: string | null
        headline?: string | null
        websiteUrl?: string | null
        linkedinUrl?: string | null
        timezoneName?: string | null
        preferredContactMethod?: PreferredContactMethod | null
    }
): Promise<UserProfile> {
    const fullName = normalizeText(input.fullName ?? null)
    const location = normalizeText(input.location ?? null)
    const bio = normalizeText(input.bio ?? null)
    const avatarUrl = normalizeText(input.avatarUrl ?? null)
    const phone = normalizeText(input.phone ?? null)
    const headline = normalizeText(input.headline ?? null)
    const websiteUrl = normalizeText(input.websiteUrl ?? null)
    const linkedinUrl = normalizeText(input.linkedinUrl ?? null)
    const timezoneName = normalizeText(input.timezoneName ?? null)
    const preferredContactMethod = normalizePreferredContactMethod(input.preferredContactMethod ?? null)

    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
        throw new Error('Your session has expired. Please log in again.')
    }

    const result = await apiRequest<{ success: boolean; message?: string | null } | null>({
        path: '/profiles/me',
        method: 'PATCH',
        accessToken,
        body: {
            fullName,
            location,
            bio,
            avatarUrl,
            phone,
            headline,
            websiteUrl,
            linkedinUrl,
            timezoneName,
            preferredContactMethod: preferredContactMethod,
        },
    })
    if (!result?.success) {
        throw new Error(result?.message ?? 'Unable to update profile right now.')
    }

    const refreshed = await getProfileByUserId(supabase, user.id)
    if (!refreshed) {
        return getEmptyProfileFallback(user.id)
    }

    return refreshed
}
