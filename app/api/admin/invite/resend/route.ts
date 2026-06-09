import { NextResponse }      from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient }      from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles').select('role_id').eq('id', user.id).single();
    if (!profile || profile.role_id < 3)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { invite_id } = await request.json();
    if (!invite_id)
      return NextResponse.json({ error: 'invite_id required' }, { status: 400 });

    const adminClient = createAdminClient();
    const { data: invite } = await adminClient
      .from('invites').select('*').eq('id', invite_id).single();

    if (!invite)
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    if (invite.status !== 'pending')
      return NextResponse.json(
        { error: 'Only pending invites can be resent' }, { status: 400 }
      );

    const { error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
      invite.email,
      {
        data: { role_id: invite.role_id },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
      }
    );
    if (inviteErr) throw inviteErr;

    await adminClient.from('invites')
      .update({ created_at: new Date().toISOString() })
      .eq('id', invite_id);

    return NextResponse.json({ message: `Invite resent to ${invite.email}` });
  } catch (err) {
    return NextResponse.json(
      { error: err.message ?? 'Something went wrong.' }, { status: 500 }
    );
  }
}