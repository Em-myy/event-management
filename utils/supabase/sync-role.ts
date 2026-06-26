import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "./admin";


export async function syncRoleFromInviteMetadata(user: User) {
  try {
    const metaRoleId = user.user_metadata?.role_id
      ? Number(user.user_metadata.role_id)
      : null;

    if (metaRoleId && [1, 2].includes(metaRoleId)) {
      const admin = createAdminClient();
      await admin
        .from("profiles")
        .update({
          role_id: metaRoleId
        })
        .eq("id", user.id);
    }
  } catch (err) {
    // Non-fatal — the DB trigger already set the role on insert;
    // this is just a safety net. Admin can fix manually if needed.
    console.error("[syncRoleFromInviteMetadata]", err);
  }
}