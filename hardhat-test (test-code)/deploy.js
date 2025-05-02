const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy MintableDAI
  const DAI = await hre.ethers.getContractFactory("MintableDAI");
  const dai = await DAI.deploy(deployer.address);
  await dai.waitForDeployment();

  // Deploy IRMechanism
  const IR = await hre.ethers.getContractFactory("IRMechanism");
  const ir = await IR.deploy();
  await ir.waitForDeployment();

  // Deploy Liquidation
  const LQ = await hre.ethers.getContractFactory("Liquidation");
  const lq = await LQ.deploy();
  await lq.waitForDeployment();

  // Use a mock Chainlink price feed for local test
  const MockFeed = await hre.ethers.getContractFactory("MockV3Aggregator");
  const feed = await MockFeed.deploy(8, "300000000000"); // $3000 per ETH, 8 decimals
  await feed.waitForDeployment();

  // Deploy Vault
  const Vault = await hre.ethers.getContractFactory("vault");
  const vault = await Vault.deploy(dai.target, ir.target, lq.target, feed.target);
  await vault.waitForDeployment();

  console.log("Vault deployed to:", vault.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
