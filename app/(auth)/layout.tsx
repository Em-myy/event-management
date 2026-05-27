import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { DM_Sans, Syne } from "next/font/google";
import "../(main)/globals.css";
import Link from "next/link";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600"],
});
const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ESRMS — Event Scheduling & Resource Management",
  description: "Institutional event logistics platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${syne.variable}`}>
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        <Link href="/" className="flex gap-2 flex-center">
          <p>ESRMS</p>
        </Link>
        <main>{children}</main>
      </body>
    </html>
  );
}
