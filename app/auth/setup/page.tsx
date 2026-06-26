"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Lock, Loader2, CheckCircle2, AlertCircle, EyeOff, Eye } from "lucide-react";

export default function SetupPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  async function handleSetPassword(e: React.ChangeEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      // Wait 2 seconds so they see the success message, then send them to the app
      setTimeout(() => {
        router.push("/dashboard"); 
      }, 2000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 w-full">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 animate-slide-up border border-slate-100">
        
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-5 sm:mb-6">
          <Lock className="w-6 h-6" />
        </div>
        
        <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 mb-2">
          Welcome aboard!
        </h1>
        <p className="text-sm text-slate-500 mb-6 sm:mb-8">
          Your account has been verified. Please set a secure password to use for future logins.
        </p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-sm mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1 break-words">{error}</span>
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
            <p className="font-bold text-slate-900">Password Set!</p>
            <p className="text-sm text-slate-500 mt-1">Taking you to your dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSetPassword} className="space-y-5 sm:space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Create a Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer flex items-center justify-center transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || password.length < 6}
              className="w-full cursor-pointer flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Password & Enter"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}