"use client";

import React, { useState, useEffect } from "react";
import { Coins, ArrowDownCircle, X, Shield, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import ConnectWallet from "../components/ConnectWallet";
import { getVaultContract } from "../../utils/contract";
import { formatEther, parseEther } from "ethers";
import { ethers } from "ethers";

// Extend window.ethereum for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function UserPage() {
  const [collateral, setCollateral] = useState<string | null>(null);
  const [debt, setDebt] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [borrowAmount, setBorrowAmount] = useState<string>("");
  const [repayAmount, setRepayAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [showVaultInfo, setShowVaultInfo] = useState(false);

  // Vault analysis states
  const [interestRate, setInterestRate] = useState<string | null>(null);
  const [healthFactor, setHealthFactor] = useState<string | null>(null);
  const [collateralValue, setCollateralValue] = useState<string | null>(null);
  const [debtValue, setDebtValue] = useState<string | null>(null);
  const [isUndercollateralized, setIsUndercollateralized] = useState<boolean | null>(null);

  useEffect(() => {
    handleGetCurrentInterestRate();
  }, []);

  const handleGetCurrentInterestRate = async () => {
    try {
      const contract = await getVaultContract();
      const rate = await contract.getCurrentInterestRate();
      const percent = parseFloat(formatEther(rate)) * 100;
      setInterestRate(percent.toFixed(2));
    } catch (err) {
      console.error("Error fetching current interest rate:", err);
    }
  };

  const handleRead = async () => {
    try {
      const contract = await getVaultContract();
      const [account] = await window.ethereum.request({ method: "eth_requestAccounts" });

      const info = await contract.getVaultInfo(account);
      setCollateral(formatEther(info[0]));
      setDebt(formatEther(info[1]));

      await handleVaultAnalysis(account);
      setShowVaultInfo(true);
    } catch (err) {
      console.error("Error reading vault info:", err);
    }
  };

  const handleVaultAnalysis = async (account: string) => {
    try {
      const contract = await getVaultContract();
      const health = await contract.calculateHealthFactor(account);
      const collateralVal = await contract.getCollateralValue(account);
      const debtVal = await contract.getDebtValue(account);
      const undercollateralized = await contract.isUndercollateralized(account);

      setHealthFactor(formatEther(health));
      setCollateralValue(formatEther(collateralVal));
      setDebtValue(formatEther(debtVal));
      setIsUndercollateralized(undercollateralized);
    } catch (err) {
      console.error("Error fetching vault analysis:", err);
    }
  };

  const handleDeposit = async () => {
    try {
      const contract = await getVaultContract();
      const valueInWei = parseEther(depositAmount);
      const tx = await contract.deposit({ value: valueInWei });
      await tx.wait();
      setDepositAmount("");
      toast.success("Deposit successful!");
    } catch (err) {
      console.error("Deposit failed:", err);
      toast.error("Deposit failed. Check console.");
    }
  };

  const handleBorrow = async () => {
    try {
      const contract = await getVaultContract();
      const daiAmount = parseEther(borrowAmount);
      const tx = await contract.borrow(daiAmount);
      await tx.wait();
      setBorrowAmount("");
      toast.success("Borrow successful!");
    } catch (err) {
      console.error("Borrow failed:", err);
      toast.error("Borrow failed. Check console.");
    }
  };

  const handleRepay = async () => {
    try {
      const contract = await getVaultContract();
      const [account] = await window.ethereum.request({ method: "eth_requestAccounts" });
      const amount = parseEther(repayAmount);

      const daiToken = await contract.daiToken();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signerObj = await provider.getSigner();
      const dai = new ethers.Contract(
        daiToken,
        ["function approve(address spender, uint256 amount) public returns (bool)"],
        signerObj
      );

      const approveTx = await dai.approve(contract.target, amount);
      await approveTx.wait();

      const tx = await contract.repay(amount);
      await tx.wait();
      setRepayAmount("");
      toast.success("Repay successful!");
    } catch (err) {
      console.error("Repay failed:", err);
      toast.error("Repay failed. Check console.");
    }
  };

  const handleWithdraw = async () => {
    try {
      const contract = await getVaultContract();
      const valueInWei = parseEther(withdrawAmount);
      const tx = await contract.withdraw(valueInWei);
      await tx.wait();
      setWithdrawAmount("");
      toast.success("Withdrawal successful!");
    } catch (err) {
      console.error("Withdrawal failed:", err);
      toast.error("Withdrawal failed. Check console.");
    }
  };

  const handleLiquidate = async () => {
    try {
      const contract = await getVaultContract();
      const [account] = await window.ethereum.request({ method: "eth_requestAccounts" });
      const tx = await contract.liquidate(account);
      await tx.wait();
      toast.success("Liquidation successful!");
    } catch (err) {
      console.error("Liquidation failed:", err);
      toast.error("Liquidation failed. Check console.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#1a2a3a] to-[#0d1117] text-white py-12 px-6 transition-all duration-500 ease-in-out">
      <div className="max-w-4xl mx-auto bg-white text-gray-900 rounded-3xl shadow-2xl p-8">
        {/* Current Interest Rate */}
        {interestRate !== null && (
          <div className="text-center text-xl font-bold mb-6">
            Current Interest Rate: <span className="text-indigo-600">{interestRate}%</span>
          </div>
        )}

        <ConnectWallet />

        {/* View Vault Info */}
        <div className="text-center mt-4">
          <button
            onClick={handleRead}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View Vault Info
          </button>
        </div>

        {/* Vault Info Modal */}
        {showVaultInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white text-gray-900 p-8 rounded-2xl shadow-2xl transform transition-transform duration-500 scale-95 hover:scale-100 w-[90%] max-w-lg relative">
              <button
                onClick={() => setShowVaultInfo(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-black"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-2xl font-bold mb-6 text-center text-indigo-700">Vault Summary</h3>
              <div className="space-y-4">
                <p className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-green-600" />
                  <span>Collateral: <strong>{collateral ?? "-"} ETH</strong></span>
                </p>
                <p className="flex items-center gap-2">
                  <ArrowDownCircle className="w-5 h-5 text-red-600" />
                  <span>Debt: <strong>{debt ?? "-"} DAI</strong></span>
                </p>
                {healthFactor && (
                  <p className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <span>Health Factor: <strong>{Number(healthFactor).toFixed(4)}</strong></span>
                  </p>
                )}
                {parseFloat(healthFactor || "0") < 1.2 && (
                  <p className="text-sm text-red-600 font-semibold">
                    ⚠️ Your vault is at risk. Please repay or add collateral.
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-green-500" />
                  <span>Collateral Value: <strong>{collateralValue ? Number(collateralValue).toFixed(2) : "—"} USD</strong></span>
                </p>
                <p className="flex items-center gap-2">
                  <ArrowDownCircle className="w-5 h-5 text-red-500" />
                  <span>Debt Value: <strong>{debtValue ? Number(debtValue).toFixed(2) : "—"} USD</strong></span>
                </p>
                <p className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span>Undercollateralized: <strong>{isUndercollateralized === null ? "—" : isUndercollateralized ? "Yes" : "No"}</strong></span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Deposit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div>
            <label className="block text-sm font-medium mb-1">ETH to Deposit</label>
            <div className="flex">
              <input
                type="text"
                placeholder="ETH amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-l"
              />
              <button
                onClick={handleDeposit}
                disabled={!depositAmount}
                className="px-4 bg-green-500 text-white rounded-r hover:bg-green-600"
              >
                Deposit ETH
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">You are earning <strong>0.00% APY</strong></p>
          </div>

          {/* Borrow */}
          <div>
            <label className="block text-sm font-medium mb-1">DAI to Borrow</label>
            <div className="flex">
              <input
                type="text"
                placeholder="DAI amount"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-l"
              />
              <button
                onClick={handleBorrow}
                disabled={!borrowAmount}
                className="px-4 bg-purple-500 text-white rounded-r hover:bg-purple-600"
              >
                Borrow DAI
              </button>
            </div>
          </div>

          {/* Repay */}
          <div>
            <label className="block text-sm font-medium mb-1">DAI to Repay</label>
            <div className="flex">
              <input
                type="text"
                placeholder="Repay DAI amount"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-l"
              />
              <button
                onClick={handleRepay}
                disabled={!repayAmount}
                className="px-4 bg-red-500 text-white rounded-r hover:bg-red-600"
              >
                Repay DAI
              </button>
            </div>
          </div>

          {/* Withdraw */}
          <div>
            <label className="block text-sm font-medium mb-1">ETH to Withdraw</label>
            <div className="flex">
              <input
                type="text"
                placeholder="Withdraw ETH amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-l"
              />
              <button
                onClick={handleWithdraw}
                disabled={!withdrawAmount}
                className="px-4 bg-yellow-500 text-white rounded-r hover:bg-yellow-600"
              >
                Withdraw ETH
              </button>
            </div>
          </div>
        </div>

        {/* Liquidate Button */}
        <div className="text-center mt-8">
          <button
            onClick={handleLiquidate}
            className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Liquidate Vault
          </button>
        </div>
      </div>
    </div>
  );
}