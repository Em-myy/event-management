import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { NextResponse, NextRequest } from 'next/server';


// 1. Define the expected shape of your request body
interface ResendInviteBody {
  invite_id: string | number; 
}

// 2. Type the request parameter using NextRequest
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Authorization (Admin only)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', user.id)
      .single();
      
    if (!profile || profile.role_id < 3) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Safely type the parsed JSON body
    const body = (await request.json()) as Partial<ResendInviteBody>;
    const { invite_id } = body;

    if (!invite_id) {
      return NextResponse.json({ error: 'invite_id required' }, { status: 400 });
    }

    // Fetch the existing invite
    const adminClient = createAdminClient();
    const { data: invite } = await adminClient
      .from('invites')
      .select('*')
      .eq('id', invite_id)
      .single();

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }
    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending invites can be resent' }, { status: 400 }
      );
    }

    // Resend the invite email via Supabase Admin Auth
    const { error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
      invite.email,
      {
        data: { role_id: invite.role_id },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
      }
    );
    
    if (inviteErr) throw inviteErr;

    // Update the created_at timestamp to reflect the new send time
    await adminClient.from('invites')
      .update({ created_at: new Date().toISOString() })
      .eq('id', invite_id);

    return NextResponse.json({ message: `Invite resent to ${invite.email}` });
  } catch (err) {
    // 3. Safely handle TypeScript's strict 'unknown' error type
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong.';
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}