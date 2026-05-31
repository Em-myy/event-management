"use client";

import GoogleButton from "@/components/GoogleButton";
import SignInForm from "@/components/SignInForm";
import SignInText from "@/components/SignInText";
import SignUpForm from "@/components/SignUpForm";
import SignUpText from "@/components/SignUpText";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type formData = {
  username: string;
  email: string;
  password: string;
};

const MainPage = () => {
  const supabase = createClient();
  const router = useRouter();

  const [mode, setMode] = useState<string>("Sign In");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [form, setForm] = useState<formData>({
    username: "",
    email: "",
    password: "",
  });

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "Sign In") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
            data: {
              username: form.username,
            },
          },
        });
        if (error) throw error;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      setError(error.message ?? "Authentication Failed");
    } finally {
      setLoading(false);
    }
  };

  return <main className="grid grid-cols-2"></main>;
};

export default MainPage;
