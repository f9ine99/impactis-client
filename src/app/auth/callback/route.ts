import { createClient } from '@/lib/supabase/server'
import { resolveCallbackRedirectPath } from '@/modules/auth'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const nextPath = requestUrl.searchParams.get('next')

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const destination = await resolveCallbackRedirectPath(supabase, nextPath)
            return redirect(destination)
        }
    }

    // URL to redirect to after sign in process completes
    return redirect('/auth/auth-code-error')
}
