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
    <div>
      {walletAddress ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm">Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
          <button
            onClick={disconnectWallet}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}