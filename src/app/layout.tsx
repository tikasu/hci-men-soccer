import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HCI Soccer League",
  description: "A comprehensive soccer league management website",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientProviders>
          <div className="min-h-screen flex flex-col">
            <Logo />
            <Navbar />
            <main className="flex-grow w-full max-w-full overflow-x-hidden">
              {children}
            </main>
            <footer className="bg-gray-800 text-white py-6">
              <div className="container mx-auto px-4 text-center">
                <p>&copy; {new Date().getFullYear()} HCI Soccer. All rights reserved.</p>
              </div>
            </footer>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
