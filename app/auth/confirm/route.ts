// File: src/app/auth/confirm/route.ts
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()
    
    // 1. Verify the single-use token securely
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // 2. Get the newly authenticated user's email
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email) {
        // 3. Create an Admin bypass client so we can update the invites table
        // without getting blocked by Row Level Security (RLS)
        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SECRET_KEY!
        );

        // 4. Update the invite status to 'accepted'
        await supabaseAdmin
          .from('invites')
          .update({ 
            status: 'accepted',
            accepted_at: new Date().toISOString()
          })
          .eq('email', user.email)
          .eq('status', 'pending');
      }

      // 5. Success! Redirect to the setup page
      redirect(next)
    }
  }

  // If token is missing, used, or expired, send to error page
  redirect('/auth/auth-code-error')
}