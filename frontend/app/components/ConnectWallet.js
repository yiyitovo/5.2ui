"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

export default function ConnectWallet() {
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      }
    };
    checkConnection();
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
      localStorage.setItem("walletAddress", accounts[0]);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress("");
    localStorage.removeItem("walletAddress");
  };

  return (
    <div className="p-4 space-y-2">
      {walletAddress ? (
        <div>
          <p className="text-sm mb-1">Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
          <button
            onClick={disconnectWallet}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}