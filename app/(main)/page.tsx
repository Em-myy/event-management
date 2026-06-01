"use client";

import Field from "@/components/Field";
import GoogleButton from "@/components/GoogleButton";
import SignInForm from "@/components/SignInForm";
import SignInText from "@/components/SignInText";
import SignUpForm from "@/components/SignUpForm";
import SignUpText from "@/components/SignUpText";
import { createClient } from "@/utils/supabase/client";
import {
  AlertCircle,
  Calendar,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
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
        if (error) {
          setError(error.message);
          return;
        }
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
        if (error) {
          setError(error.message);
          return;
        }
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
      <div className="hidden lg:flex lg:w-[45%] sidebar flex-col justify-between p-16 relative overflow-hidden">
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

        <div className="relative z-10 max-w-sm">
          <h1 className="font-family-display text-5xl font-bold text-white leading-tight mb-6">
            {mode === "Sign In" ? "Manage events" : "Your events,"}
            <span className="text-amber-400">
              {mode === "Sign In" ? "without the chaos" : "perfectly organized"}
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            {mode === "Sign In"
              ? "Book Venues, Allocate Resources and get approvals - all from one central platform"
              : "Create your account to start submitting booking requests and tracking approvals in real time."}
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 w-full">
            {mode === "Sign In" ? (
              [
                { text: "100%", label: "Conflict-free bookings" },
                { text: "3", label: "Permission Levels" },
                { text: "∞", label: "Scalable events" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="font-family-display text-2xl font-bold text-amber-400">
                    {s.text}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                </div>
              ))
            ) : (
              <ul className="flex flex-col gap-5 p-6 bg-[#0B0F19]">
                {[
                  "No double booking, ever",
                  "Real-time availability",
                  "Instant approval notifications",
                ].map((features, index) => (
                  <li key={index} className="flex items-center">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D9852B]/20">
                      <Check
                        className="h-5 w-5 text-[#D9852B]"
                        strokeWidth={2.5}
                      />
                    </div>
                    <span className="text-[17px] tracking-tight font-medium text-slate-300">
                      {features}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-600">
          &copy; {new Date().getFullYear()} ESRMS · Institutional Resource
          Platform
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8 text-slate-50">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8">
            <h2 className="font-family-display text-3xl font-bold text-slate-900">
              {mode === "Sign In" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-slate-500 mt-2 text-sm">
              {mode === "Sign In"
                ? "Sign in to access your dashboard."
                : "Sign up to start booking venues."}
            </p>
          </div>

          <div className="flex bg-slate-200 p-1 rounded-xl mb-7">
            {["Sign In", "Sign Up"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg cursor-pointer transition-all ${mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                {m === "Sign In" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "Sign Up" ? (
              <>
                <Field icon={<User className="w-4 h-4" />} label="Username">
                  <input
                    required
                    value={form.username}
                    onChange={handleFormChange}
                    placeholder="Dr. Folarin Balogun"
                    className="auth-input"
                    type="text"
                    name="username"
                  />
                </Field>
                <Field
                  icon={<Mail className="h-4 w-4" />}
                  label="Email Address"
                >
                  <input
                    required
                    value={form.email}
                    placeholder="folarinbalogun@gmail.com"
                    className="auth-input"
                    onChange={handleFormChange}
                    type="mail"
                    name="email"
                  />
                </Field>

                <Field
                  icon={<Lock className="w-4 h-4" />}
                  label="Password"
                  action={
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                >
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleFormChange}
                    placeholder="••••••••"
                    minLength={6}
                    className="auth-input"
                    name="password"
                  />
                </Field>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3 px-4 cursor-pointer text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm bg-[#0D1A38] hover:bg-[#152754]"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === "Sign Up" ? "Sign up" : "Sign in"}
                </button>

                <div className="flex items-center my-4">
                  <div className="grow border-t border-slate-200"></div>
                  <span className="px-3 text-sm text-slate-400 font-medium">
                    or
                  </span>
                  <div className="grow border-t border-slate-200"></div>
                </div>
                <div className="w-full">
                  {" "}
                  <GoogleButton />
                </div>
              </>
            ) : (
              <>
                {" "}
                <Field
                  icon={<Mail className="h-4 w-4" />}
                  label="Email Address"
                >
                  <input
                    required
                    value={form.email}
                    placeholder="folarinbalogun@gmail.com"
                    className="auth-input"
                    onChange={handleFormChange}
                    type="mail"
                    name="email"
                  />
                </Field>
                <Field
                  icon={<Lock className="w-4 h-4" />}
                  label="Password"
                  action={
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                >
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleFormChange}
                    placeholder="••••••••"
                    minLength={6}
                    className="auth-input"
                    name="password"
                  />
                </Field>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3 px-4 cursor-pointer text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm bg-[#0D1A38] hover:bg-[#152754]"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === "Sign Up" ? "Sign up" : "Sign in"}
                </button>
                <div className="flex items-center my-4">
                  <div className="grow border-t border-slate-200"></div>
                  <span className="px-3 text-sm text-slate-400 font-medium">
                    or
                  </span>
                  <div className="grow border-t border-slate-200"></div>
                </div>
                <div className="w-full">
                  {" "}
                  <GoogleButton />
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </main>
  );
};

export default MainPage;
