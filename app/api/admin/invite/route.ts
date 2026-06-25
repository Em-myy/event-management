import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { NextResponse, NextRequest } from 'next/server';

// 1. Define the expected shape of your request body
interface SendInviteBody {
  email: string;
  role_id: string | number;
  department?: string;
}

// 2. Type the request parameter using NextRequest
export async function POST(request: NextRequest) {
  try {
    // 1. Verify caller is a logged-in admin
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role_id < 3) {
      return NextResponse.json(
        { error: 'Forbidden: only Administrators can send invites' },
        { status: 403 }
      );
    }

    // 2. Validate body using our TypeScript interface
    const body = (await request.json()) as Partial<SendInviteBody>;
    const { email, role_id, department } = body;

    if (!email || !role_id) {
      return NextResponse.json(
        { error: 'email and role_id are required' },
        { status: 400 }
      );
    }

    const parsedRoleId = Number(role_id);
    if (![1, 2].includes(parsedRoleId)) {
      return NextResponse.json(
        { error: 'role_id must be 1 (Lecturer) or 2 (HOD)' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 3. Check for existing pending invite
    const { data: existing } = await adminClient
      .from('invites')
      .select('id, status')
      .eq('email', email.toLowerCase().trim())
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'A pending invite already exists for this email.' },
        { status: 409 }
      );
    }

    // 4. Send invite via Supabase Auth Admin API
    const { error: inviteErr } =
      await adminClient.auth.admin.inviteUserByEmail(
        email.toLowerCase().trim(),
        {
          data: { role_id: parsedRoleId, department: department ?? '' },
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
        }
      );

    if (inviteErr) {
      if (inviteErr.message?.includes('already been registered')) {
        return NextResponse.json(
          { error: 'This email already has an ESRMS account.' },
          { status: 409 }
        );
      }
      throw inviteErr;
    }

    // 5. Record in invites table
    const { error: dbErr } = await adminClient.from('invites').insert({
      email:      email.toLowerCase().trim(),
      role_id:    parsedRoleId,
      invited_by: user.id,
      status:     'pending',
    });
    
    if (dbErr) throw dbErr;

    return NextResponse.json({ message: `Invite sent to ${email}` });
  } catch (err) {
    console.error('[POST /api/admin/invite]', err);
    
    // 3. Safely handle TypeScript's strict 'unknown' error type
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong.';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}