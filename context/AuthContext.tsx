"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>("");
  const [initial, setInitial] = useState<string>("?");
  const [displayName, setDisplayName] = useState<string>("");

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setLoading(false);

      const image =
        user?.user_metadata.avatar_url || user?.user_metadata.picture;

      setAvatarUrl(image || null);

      const displayName =
        user?.user_metadata.display_name ||
        user?.user_metadata.full_name ||
        user?.user_metadata.username ||
        user?.email ||
        "?";

      setDisplayName(displayName);
      setInitial(displayName.charAt(0).toUpperCase());
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.log(error.message);
      }

      router.push("/");

      router.refresh();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, avatarUrl, initial, displayName, loading, handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
