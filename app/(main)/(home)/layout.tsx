import NavBar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex justify-between p-4">
      <NavBar />
      {children}
    </div>
  );
}
