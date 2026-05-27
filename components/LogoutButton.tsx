"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const LogoutButton = () => {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.log(error.message);
      }

      router.push("/login");

      router.refresh();
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <main>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Sign Out
      </button>
    </main>
  );
};

export default LogoutButton;
