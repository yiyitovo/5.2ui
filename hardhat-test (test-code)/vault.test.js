const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault System - Deploy and Init", function () {
  let dai, ir, liquidation, vault;
  let daiPriceFeed, ethPriceFeed;

  this.timeout(100000); // Extend the overall test timeout (unit: milliseconds)

  beforeEach(async function () {
    [deployer, user] = await ethers.getSigners();

    // Deploy Mock DAI/USD Price Feed（1 DAI = 1 USD）
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    daiPriceFeed = await MockV3Aggregator.deploy(8, "100000000"); // 1e8 = 1.00 USD
    await daiPriceFeed.deployed();
    console.log(" DAI price feed deployed");

    // Deploy Mock ETH/USD Price Feed（1 ETH = 2000 USD）
    ethPriceFeed = await MockV3Aggregator.deploy(8, "200000000000"); // 2000 * 1e8
    await ethPriceFeed.deployed();
    console.log(" ETH price feed deployed");

    // Deploy the DAI token
    const MintableDAI = await ethers.getContractFactory("MintableDAI");
    dai = await MintableDAI.deploy();
    await dai.deployed();
    console.log(" MintableDAI deployed");

    // Deploy IRMechanism (requires two oracle addresses)
    const IR = await ethers.getContractFactory("IRMechanism");
    ir = await IR.deploy(daiPriceFeed.address, ethPriceFeed.address);
    await ir.deployed();
    console.log(" IRMechanism deployed");

    // Deploy the Liquidation contract (DAI address required)
    const Liquidation = await ethers.getContractFactory("Liquidation");
    liquidation = await Liquidation.deploy(dai.address);
    await liquidation.deployed();
    console.log(" Liquidation deployed");

    // Deploy the Vault contract
    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy(
      dai.address,
      ir.address,
      liquidation.address,
      ethPriceFeed.address
    );
    await vault.deployed();
    console.log(" Vault deployed");
  });

  it("should deploy Vault with correct dependencies", async function () {
    expect(await vault.daiToken()).to.equal(dai.address);
    expect(await vault.irMechanism()).to.equal(ir.address);
    expect(await vault.liquidation()).to.equal(liquidation.address);
    expect(await vault.ethPriceFeed()).to.equal(ethPriceFeed.address);
  });

  
});

