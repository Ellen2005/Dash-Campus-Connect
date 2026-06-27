import { createBrowserClient } from '@supabase/ssr'

const SESSION_MAX_AGE = 60 * 60 * 24 // 24 hours in seconds

export const supabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookieOptions: {
      name: 'sb-dash',
      maxAge: SESSION_MAX_AGE,
    },
  }
)
