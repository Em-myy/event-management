// app/auth/auth-code-error/page.tsx
import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl">⚠️</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Link expired or invalid
        </h1>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Your sign-in link has expired or already been used. 
          Please request a new one.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl"
          style={{ background: "#0D1A38" }}
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}