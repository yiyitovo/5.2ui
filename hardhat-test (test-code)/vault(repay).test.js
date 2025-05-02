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
    await dai.setMinter(vault.address);

    console.log(" Vault deployed");
  });

  it("should deploy Vault with correct dependencies", async function () {
    expect(await vault.daiToken()).to.equal(dai.address);
    expect(await vault.irMechanism()).to.equal(ir.address);
    expect(await vault.liquidation()).to.equal(liquidation.address);
    expect(await vault.ethPriceFeed()).to.equal(ethPriceFeed.address);
  });

  // The test user deposited Decomposite ETH as collateral
  it("should allow user to deposit ETH as collateral", async function () {
    const depositAmount = ethers.utils.parseEther("1"); // 1 ETH

    // The user calls "deposit" to deposit ETH
    await vault.connect(user).deposit({ value: depositAmount });

    // Verify the user's mortgage amount
    const userCollateral = await vault.collateral(user.address);
    expect(userCollateral.toString()).to.equal(depositAmount.toString());

    // Verify the total amount of global collateral
    const globalCollateral = await vault.getTotalCollateral();
    expect(globalCollateral.toString()).to.equal(depositAmount.toString());
  });

  // Test the user to borrow DAI
  it("should allow user to borrow DAI after depositing ETH", async function () {
    const depositAmount = ethers.utils.parseEther("1"); // 1 ETH = $2000
    const borrowAmount = ethers.utils.parseUnits("1000", 18); // 1000 DAI
  
    // The user deposits collateral
    await vault.connect(user).deposit({ value: depositAmount });
  
    // The user lends DAI
    await vault.connect(user).borrow(borrowAmount);
  
    // Check the debt records
    const userDebt = await vault.debt(user.address);
    expect(userDebt.toString()).to.equal(borrowAmount.toString());
  
    // Check the DAI balance
    const daiBalance = await dai.balanceOf(user.address);
    expect(daiBalance.toString()).to.equal(borrowAmount.toString());
  });  

  // Test Repayment function repay DAI
  it("should allow user to repay DAI and reduce debt", async function () {
    const depositAmount = ethers.utils.parseEther("1"); // 2000 USD
    const borrowAmount = ethers.utils.parseUnits("1000", 18); // 1000 DAI
  
    // Deposit ETH and lend DAI
    await vault.connect(user).deposit({ value: depositAmount });
    await vault.connect(user).borrow(borrowAmount);
  
    // Users can transfer their DAI by approving the Vault contract (mandatory)
    await dai.connect(user).approve(vault.address, borrowAmount);
  
    // Call for repayment
    await vault.connect(user).repay(borrowAmount);
  
    // Verify that the user's debt has been cleared to zero
    const userDebt = await vault.debt(user.address);
    expect(userDebt.toString()).to.equal("0");
  
    // Verify that DAI is no longer held in the Vault contract (it has been burned)
    const vaultDAIBalance = await dai.balanceOf(vault.address);
    expect(vaultDAIBalance.toString()).to.equal("0");
  });
  

});

