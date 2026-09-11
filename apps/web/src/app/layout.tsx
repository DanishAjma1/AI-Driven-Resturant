import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { CartProvider } from "@/components/CartProvider";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { getCurrentUser } from "@/lib/session";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz"],
});
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Ember & Grain",
  description:
    "Live-fire cooking, honest ingredients — order ahead, track your food from smoker to door.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="grain-texture min-h-screen antialiased">
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar user={user} />
            <main className="flex-1">{children}</main>
            <Footer role={user?.role ?? "ANONYMOUS"} />
          </div>
        </CartProvider>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#201a15",
              color: "#f3ede2",
              border: "1px solid #3a3128",
            },
          }}
        />
      </body>
    </html>
  );
}
