"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log(error.message);
    }
    router.push("/");
    router.refresh();
  };

  // 💡 DERIVED STATE: Calculate these dynamically based on the current user.
  // If the user changes (e.g. they log in), these instantly update!
  const avatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  const displayName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.username ||
    user?.email ||
    "Unknown User";

  const initials =
    displayName !== "Unknown User" ? displayName.charAt(0).toUpperCase() : "?";

  return (
    <AuthContext.Provider
      value={{
        user,
        avatarUrl,
        initials,
        displayName,
        loading,
        handleSignout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
