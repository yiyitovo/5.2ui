// app/vaults/[vaultId]/page.js
import React from 'react';

export default async function VaultPage({ params }) {
  const { vaultId } = params;

  // 假设这里你从链上或 API 获取 Vault 数据
  // const vaultData = await fetchVaultData(vaultId);

  return (
    <div>
      <h1>Vault #{vaultId}</h1>
      {/* 渲染 vaultData 中的信息 */}
      {/* <p>Collateral Type: {vaultData.collateralType}</p> */}
      {/* <p>Debt: {vaultData.debt}</p> */}
      {/* ... */}
    </div>
  );
}
