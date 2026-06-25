import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 1. Define the expected shape of your request body
interface CancelInviteBody {
  invite_id: string | number; // Change to just 'number' or 'string' depending on your DB schema
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
    const body = (await request.json()) as Partial<CancelInviteBody>;
    const { invite_id } = body;

    if (!invite_id) {
      return NextResponse.json({ error: 'invite_id required' }, { status: 400 });
    }

    // Process the cancellation
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('invites')
      .update({ status: 'cancelled' })
      .eq('id', invite_id)
      .eq('status', 'pending');

    if (error) throw error;

    return NextResponse.json({ message: 'Invite cancelled.' });
  } catch (err) {
    // 3. Handle TypeScript's strict 'unknown' error type
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong.';
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}