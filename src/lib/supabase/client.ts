import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublishableOrAnonKeyOrThrow, getSupabaseUrlOrThrow } from './env'

export function createClient() {
  return createBrowserClient(
    getSupabaseUrlOrThrow(),
    getSupabasePublishableOrAnonKeyOrThrow()
  )
}
