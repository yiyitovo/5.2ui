"use client";
import { BrowserProvider, Contract } from "ethers";
import abi from "./abi.json";

const CONTRACT_ADDRESS = "0x5080F7a0F5Cc78a336Ea45ffc83fa4bd6bf9f409";

export const getVaultContract = async () => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not detected (window or ethereum missing)");
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new Contract(CONTRACT_ADDRESS, abi, signer);

  return contract;
};