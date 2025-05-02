import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";


const makerSans = Inter({
  variable: "--font-maker-sans",
  subsets: ["latin"],
});

const makerMono = Source_Code_Pro({
  variable: "--font-maker-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MakerDAO Frontend",
  description: "A MakerDAO-specific front-end built with Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${makerSans.variable} ${makerMono.variable} antialiased`}>
        <Navbar /> {/* ✅ Add the Navbar here */}
        <main className="min-h-screen w-full px-4 py-10 bg-white text-gray-900 shadow-md rounded-none">{children}</main>

        <footer className="bg-gray-100 text-gray-600 text-center py-4 mt-10 text-sm">
          © {new Date().getFullYear()} MakerDAO Vault DApp | Built with ❤️ using React, Ethers.js & Chainlink
        </footer>

        <Toaster position="top-center" />
      </body>
    </html>
  );
}