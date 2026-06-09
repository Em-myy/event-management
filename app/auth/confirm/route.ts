import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { syncRoleFromInviteMetadata } from "@/utils/supabase/sync-role";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // This was an admin invite link — apply the pre-assigned role
      if (type === "invite" && data.user) {
        await syncRoleFromInviteMetadata(data.user);
      }
      redirect(next);
    } else {
      console.log(error.message);
    }
  }

  redirect("/auth/auth-code-error");
}