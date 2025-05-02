const axios = require("axios");

export async function getVaultById(req, res) {
  const { id } = req.query;
  // 假数据模拟
  const mockVault = {
    id,
    owner: "0x123...abc",
    collateral: "1.5 ETH",
    debt: "150 DAI",
    ratio: "180%",
  };
  res.status(200).json(mockVault);
}
