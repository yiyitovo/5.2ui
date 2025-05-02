"use client";

import React, { useState } from 'react';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import { X } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } else {
        setError("Please install MetaMask or another Ethereum wallet");
      }
    } catch (err) {
      setError("Failed to connect wallet");
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const username = (form.elements.namedItem("username") as HTMLInputElement)?.value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value;

    if (username === "demo" && password === "maker123") {
      router.push("/user");
    } else {
      setError("Incorrect username or password.");
    }
  };

  const handleCloseForm = () => {
    setShowLogin(false);
    setShowSignup(false);
    setError(null);
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Decentralized Finance.<br />
          No borders, no intermediaries, no waiting.
        </h1>

        <p className={styles.subtitle}>
          MakerDAO - The future of borrowing and lending.
          A new way to manage your crypto assets globally and freely.
        </p>

        <div className={styles.buttons}>
          {!account && !showLogin && !showSignup && (
            <>
              <button onClick={() => setShowLogin(true)} className={styles.primaryButton}>Log In</button>
              <button onClick={() => setShowSignup(true)} className={styles.secondaryButton}>Sign Up</button>
            </>
          )}
        </div>

        {showLogin && (
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={handleCloseForm}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              <X className="w-6 h-6" />
            </button>

            <form className={styles.connected} onSubmit={handleLogin}>
              <input type="text" name="username" placeholder="Username" className="block w-full p-2 mb-2 rounded" required />
              <input type="password" name="password" placeholder="Password" className="block w-full p-2 mb-2 rounded" required />
              <button type="submit" className={styles.primaryButton}>Submit</button>
            </form>
          </div>
        )}

        {showSignup && (
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={handleCloseForm}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              <X className="w-6 h-6" />
            </button>

            <form className={styles.connected} onSubmit={(e) => { e.preventDefault(); router.push("/user"); }}>
              <input type="text" placeholder="Name" className="block w-full p-2 mb-2 rounded" required />
              <input type="email" placeholder="Email" className="block w-full p-2 mb-2 rounded" required />
              <input type="password" placeholder="Password" className="block w-full p-2 mb-2 rounded" required />
              <input type="password" placeholder="Confirm Password" className="block w-full p-2 mb-2 rounded" required />
              <button type="submit" className={styles.primaryButton}>Submit</button>
            </form>
          </div>
        )}

        {account && !showLogin && !showSignup && (
          <div className={styles.connected}>
            <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
            <button onClick={() => setAccount(null)} className={styles.secondaryButton}>Disconnect</button>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}
      </main>
    </div>
  );
}