// app/auth/auth-code-error/page.tsx
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center animate-fade-in">
        
        {/* Icon Container */}
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6 border border-red-100">
          <AlertCircle className="w-8 h-8" strokeWidth={1.5} />
        </div>
        
        {/* Text Content */}
        <h1 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
          Link Expired or Invalid
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mb-8 leading-relaxed px-2">
          Your sign-in link has expired or has already been used. Please return to the login page and request a new one.
        </p>
        
        {/* Call to Action */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full px-5 py-3 text-sm sm:text-base font-semibold text-white rounded-xl transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
          style={{ background: "#0D1A38" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>

      </div>
    </div>
  );
}