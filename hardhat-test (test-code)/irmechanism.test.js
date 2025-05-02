const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IRMechanism - calculateUtilisationImpact", function () {
  this.timeout(100000);

  let ir;
  let mockVault;
  let daiPriceFeed, ethPriceFeed;

  beforeEach(async function () {
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    daiPriceFeed = await MockV3Aggregator.deploy(8, "100000000"); // 1 DAI
    ethPriceFeed = await MockV3Aggregator.deploy(8, "200000000000"); // 1 ETH = $2000
    await daiPriceFeed.deployed();
    await ethPriceFeed.deployed();

    const MockVault = await ethers.getContractFactory("MockVaultForIR");
    mockVault = await MockVault.deploy();
    await mockVault.deployed();

    // Set the Vault status: 10 ETH as collateral, 1000 DAI as debt
    await mockVault.setCollateralAndDebt(
      ethers.utils.parseEther("10"),
      ethers.utils.parseUnits("1000", 18)
    );

    const IRMechanism = await ethers.getContractFactory("IRMechanism");
    ir = await IRMechanism.deploy(daiPriceFeed.address, ethPriceFeed.address);
    await ir.deployed();
  });

  it("should return non-zero impact when utilisation rate > 0", async function () {
    const requestedAmount = ethers.utils.parseUnits("100", 18); // Request to borrow another 100 DAI

    const impact = await ir.calculateUtilisationImpact(requestedAmount, mockVault.address);
    console.log("Utilisation impact:", impact.toString());

    // Use BigNumber for security comparison
    expect(impact.gt(ethers.BigNumber.from(0))).to.be.true;
  });
});

