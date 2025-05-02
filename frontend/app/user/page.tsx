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
    <div className="min-h-screen bg-gradient-to-tr from-[#f9fafb] to-white text-gray-900 pt-3 pb-12 transition-all duration-500 ease-in-out">
      <div className="max-w-6xl mx-auto bg-white text-gray-900 rounded-3xl shadow-xl p-10 border border-gray-200">
  
        {/* 当前利率 */}
        {interestRate !== null && (
          <div className="text-center text-2xl font-bold mb-8">
            Current Interest Rate: <span className="text-indigo-600">{interestRate}%</span>
          </div>
        )}
  
        {/* 顶部操作按钮 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <ConnectWallet />
          <button
            onClick={handleRead}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            View Vault Info
          </button>
        </div>
  
        {/* Vault Info Modal */}
        {showVaultInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-gradient-to-br from-white to-gray-50 text-gray-900 px-12 py-12 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] w-[95%] max-w-2xl relative border border-gray-200">
              <button
                onClick={() => setShowVaultInfo(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-3xl font-extrabold mb-8 text-center text-blue-500 tracking-tight">
                Vault Summary
              </h3>
              <div className="space-y-5 text-[15px]">
                <p className="flex items-center gap-3">
                  <Coins className="w-5 h-5 text-blue-500" />
                  Collateral: <strong className="ml-auto">{collateral ?? "-"}</strong>
                </p>
                <p className="flex items-center gap-3">
                  <ArrowDownCircle className="w-5 h-5 text-blue-500" />
                  Debt: <strong className="ml-auto">{debt ?? "-"}</strong>
                </p>
                {healthFactor && (
                  <p className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-500" />
                    Health Factor: <strong className="ml-auto">{Number(healthFactor).toFixed(4)}</strong>
                  </p>
                )}
                {parseFloat(healthFactor || "0") < 1.2 && (
                  <div className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
                    ⚠️ Your vault is at risk. Please repay or add collateral.
                  </div>
                )}
                <p className="flex items-center gap-3">
                  <Coins className="w-5 h-5 text-blue-500" />
                  Collateral Value: <strong className="ml-auto">{collateralValue ? Number(collateralValue).toFixed(2) : "—"} USD</strong>
                </p>
                <p className="flex items-center gap-3">
                  <ArrowDownCircle className="w-5 h-5 text-blue-500" />
                  Debt Value: <strong className="ml-auto">{debtValue ? Number(debtValue).toFixed(2) : "—"} USD</strong>
                </p>
                <p className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-500" />
                  Undercollateralized: <strong className="ml-auto">{isUndercollateralized ? "Yes" : "No"}</strong>
                </p>
              </div>
            </div>
          </div>
        )}
  
        {/* Deposit + Borrow */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Deposit ETH */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium mb-1">ETH to Deposit</label>
            <div className="flex">
              <input
                type="text"
                placeholder="ETH amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 text-sm rounded-l bg-white text-gray-900"
              />
              <button
                onClick={handleDeposit}
                disabled={!depositAmount}
                className="h-12 w-36 text-sm bg-green-500 text-white rounded-r hover:bg-green-600 transition"
              >
                Deposit ETH
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">You are earning <strong>0.00% APY</strong></p>
          </div>
  
          {/* Borrow DAI */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium mb-1">DAI to Borrow</label>
            <div className="flex">
              <input
                type="text"
                placeholder="DAI amount"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 text-sm rounded-l bg-white text-gray-900"
              />
              <button
                onClick={handleBorrow}
                disabled={!borrowAmount}
                className="h-12 w-36 text-sm bg-purple-500 text-white rounded-r hover:bg-purple-600 transition"
              >
                Borrow DAI
              </button>
            </div>
          </div>
        </div>
  
        {/* Repay + Withdraw */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Repay DAI */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium mb-1">DAI to Repay</label>
            <div className="flex">
              <input
                type="text"
                placeholder="Repay DAI amount"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 text-sm rounded-l bg-white text-gray-900"
              />
              <button
                onClick={handleRepay}
                disabled={!repayAmount}
                className="h-12 w-36 text-sm bg-red-500 text-white rounded-r hover:bg-red-600 transition"
              >
                Repay DAI
              </button>
            </div>
          </div>
  
          {/* Withdraw ETH */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium mb-1">ETH to Withdraw</label>
            <div className="flex">
              <input
                type="text"
                placeholder="Withdraw ETH amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 text-sm rounded-l bg-white text-gray-900"
              />
              <button
                onClick={handleWithdraw}
                disabled={!withdrawAmount}
                className="h-12 w-36 text-sm bg-yellow-500 text-white rounded-r hover:bg-yellow-600 transition"
              >
                Withdraw ETH
              </button>
            </div>
          </div>
        </div>
  
        {/* Liquidate */}
        <div className="mt-10">
          <button
            onClick={handleLiquidate}
            className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Liquidate Vault
          </button>
        </div>
  
      </div>
    </div>
  );
}