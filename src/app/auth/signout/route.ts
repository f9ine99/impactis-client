import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { getSupabasePublishableOrAnonKeyOrThrow, getSupabaseUrlOrThrow } from '@/lib/supabase/env'

export async function POST(request: NextRequest) {
    const response = NextResponse.redirect(new URL('/', request.url), { status: 303 })

    const supabase = createServerClient(
        getSupabaseUrlOrThrow(),
        getSupabasePublishableOrAnonKeyOrThrow(),
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    await supabase.auth.signOut()
    return response
}
