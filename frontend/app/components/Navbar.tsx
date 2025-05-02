"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [wallet, setWallet] = useState<string | null>(null);

  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            setWallet(accounts[0]);
            localStorage.setItem("walletAddress", accounts[0]);
          } else {
            setWallet(null);
            localStorage.removeItem("walletAddress");
          }
        } catch (err) {
          console.error("Wallet detection failed", err);
        }
      }
    };

    checkWallet();

    // Optional: Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          setWallet(null);
          localStorage.removeItem("walletAddress");
        } else {
          setWallet(accounts[0]);
          localStorage.setItem("walletAddress", accounts[0]);
        }
      });
    }
  }, []);

  const signOut = () => {
    setWallet(null);
    localStorage.removeItem("walletAddress");
    toast.success("Signed out successfully");
    router.push("/login");
  };

  const isLoginPage = pathname === "/login";

  return (
    <nav className="bg-white shadow-md p-4 flex items-center justify-between">
      <div className="text-2xl font-bold text-blue-600">MakerDAO</div>

      {!isLoginPage && (
        <div className="flex space-x-4 items-center">
          {wallet ? (
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
            >
              Sign Out
            </button>
          ) : (
            <Link href="/login">
              <span className="text-gray-700 hover:text-blue-600 cursor-pointer">Login</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}