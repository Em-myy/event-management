"use client";

import GoogleButton from "@/components/GoogleButton";
import SignInForm from "@/components/SignInForm";
import SignInText from "@/components/SignInText";
import SignUpForm from "@/components/SignUpForm";
import SignUpText from "@/components/SignUpText";
import { createClient } from "@/utils/supabase/client";
import { Calendar } from "lucide-react";
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

  return (
    <main className="min-h-screen flex">
      <div className="hidden lg:flex lg-w-[55%] sidebar flex-col justify-betweenp-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-0.04"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px) linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute top-1/3 -left-20 w-96 h-96 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #F59E0B 0%, transparent-70%",
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-xl font-family-display">
            ESRMS
          </span>
        </div>
      </div>
    </main>
  );
};

export default MainPage;
