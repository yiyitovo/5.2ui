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

  // calculate Utilisation Impact test，The influence of utilization rate on interest rate
  it("should return non-zero impact when utilisation rate > 0", async function () {
    const requestedAmount = ethers.utils.parseUnits("100", 18); // Request to borrow another 100 DAI

    const impact = await ir.calculateUtilisationImpact(requestedAmount, mockVault.address);
    console.log("Utilisation impact:", impact.toString());

    // Use BigNumber for security comparison
    expect(impact.gt(ethers.BigNumber.from(0))).to.be.true;
  });

  // calculate Time Impact test，Verify that calculateTimeImpact will increase with the growth of loan days and will not exceed MAX_TIME_IMPACT
  it("should increase time impact with longer loan duration", async function () {
    const short = await ir.calculateTimeImpact(1); // 1 day
    const medium = await ir.calculateTimeImpact(10); // 10 days
    const long = await ir.calculateTimeImpact(100); // 100 days
    const capped = await ir.calculateTimeImpact(10000); // For the maximum number of days, verify whether the cap has reached the MAX
    console.log("Time Impact (1 day):", short.toString());
    console.log("Time Impact (10 days):", medium.toString());
    console.log("Time Impact (100 days):", long.toString());
    console.log("Time Impact (capped):", capped.toString());

    expect(medium.gt(short)).to.be.true;
    expect(long.gt(medium)).to.be.true;

    // 最大值不能超过 MAX_TIME_IMPACT（1e18）
    expect(capped.lte(ethers.BigNumber.from("1000000000000000000"))).to.be.true;
  });

  //calculate Exchange Rate Impact 测试，根据 DAI/USD 的价格是否偏离 1 来调整利率
  it("should return 0 impact when DAI price = $1", async function () {
    await daiPriceFeed.updateAnswer("100000000"); // 1.0 DAI
    const impact = await ir.calculateExchangeRateImpact();
    console.log("Impact @ $1 DAI:", impact.toString());
    expect(impact.toNumber()).to.equal(0); //  修复断言方式
  });
  
  it("should return positive impact when DAI > $1", async function () {
    await daiPriceFeed.updateAnswer("105000000"); // 1.05 DAI
    const impact = await ir.calculateExchangeRateImpact();
    console.log("Impact @ $1.05 DAI:", impact.toString());
    expect(impact.toNumber()).to.be.gt(0); //  修复断言方式
  });
  
  it("should return negative impact when DAI < $1", async function () {
    await daiPriceFeed.updateAnswer("95000000"); // 0.95 DAI
    const impact = await ir.calculateExchangeRateImpact();
    console.log("Impact @ $0.95 DAI:", impact.toString());
    expect(impact.toNumber()).to.be.lt(0); //  修复断言方式
  });

  
  

});
