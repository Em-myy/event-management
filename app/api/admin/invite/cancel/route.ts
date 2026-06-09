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
    const { error } = await adminClient
      .from('invites')
      .update({ status: 'cancelled' })
      .eq('id', invite_id)
      .eq('status', 'pending');
    if (error) throw error;

    return NextResponse.json({ message: 'Invite cancelled.' });
  } catch (err) {
    return NextResponse.json(
      { error: err.message ?? 'Something went wrong.' }, { status: 500 }
    );
  }
}