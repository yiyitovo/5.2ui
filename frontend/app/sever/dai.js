"use client";
import { useEffect, useState } from "react";

export default function DaiPage() {
  const [price, setPrice] = useState(null);
  const [vault, setVault] = useState(null);

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=dai&vs_currencies=usd")
      .then(res => res.json())
      .then(data => setPrice(data.dai.usd));

    fetch("/api/vaults/1234")
      .then(res => res.json())
      .then(data => setVault(data));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">DAI Price: ${price}</h1>
      {vault && <pre>{JSON.stringify(vault, null, 2)}</pre>}
    </div>
  );
}