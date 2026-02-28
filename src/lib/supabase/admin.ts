import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { getSupabaseServiceRoleKeyOrNull, getSupabaseUrlOrThrow } from './env'

export function createAdminClientIfConfigured() {
    const serviceRoleKey = getSupabaseServiceRoleKeyOrNull()

    if (!serviceRoleKey) {
        return null
    }

    return createClient(getSupabaseUrlOrThrow(), serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
