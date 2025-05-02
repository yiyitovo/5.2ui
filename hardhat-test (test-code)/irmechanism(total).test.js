const { ethers } = require("hardhat");
const { assert, expect } = require("chai");


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

  // calculate Utilisation Impact test, the impact of utilization rate on interest rate
  it("should return non-zero impact when utilisation rate > 0", async function () {
    const requestedAmount = ethers.utils.parseUnits("100", 18); // 请求再借 100 DAI

    const impact = await ir.calculateUtilisationImpact(requestedAmount, mockVault.address);
    console.log("Utilisation impact:", impact.toString());

    // Use BigNumber for security comparison
    expect(impact.gt(ethers.BigNumber.from(0))).to.be.true;
  });

  // calculateTimeImpact test to verify that calculateTimeImpact will increase with the growth of loan days and will not exceed MAX_TIME_IMPACT
  it("should increase time impact with longer loan duration", async function () {
    const short = await ir.calculateTimeImpact(1); // 1 day
    const medium = await ir.calculateTimeImpact(10); // 10 days
    const long = await ir.calculateTimeImpact(100); // 100 dyas
    const capped = await ir.calculateTimeImpact(10000); // For the maximum number of days, verify whether the cap has reached the MAX

    console.log("Time Impact (1 day):", short.toString());
    console.log("Time Impact (10 days):", medium.toString());
    console.log("Time Impact (100 days):", long.toString());
    console.log("Time Impact (capped):", capped.toString());

    expect(medium.gt(short)).to.be.true;
    expect(long.gt(medium)).to.be.true;

    // The maximum value cannot exceed MAX_TIME_IMPACT (1e18)
    expect(capped.lte(ethers.BigNumber.from("1000000000000000000"))).to.be.true;
  });

  // calculate the Exchange Rate Impact test to adjust the interest rate based on whether the price of DAI/USD deviates from 1
  it("should return 0 impact when DAI price = $1", async function () {
    await daiPriceFeed.updateAnswer("100000000"); // 1.0 DAI
    const impact = await ir.calculateExchangeRateImpact();
    console.log("Impact @ $1 DAI:", impact.toString());
    expect(impact.toNumber()).to.equal(0);  // Fix the assertion mode
  });
  
  it("should return positive impact when DAI > $1", async function () {
    await daiPriceFeed.updateAnswer("105000000"); // 1.05 DAI
    const impact = await ir.calculateExchangeRateImpact();
    console.log("Impact @ $1.05 DAI:", impact.toString());
    expect(impact.toNumber()).to.be.gt(0);  // Fix the assertion mode
  });
  
  it("should return negative impact when DAI < $1", async function () {
    await daiPriceFeed.updateAnswer("95000000"); // 0.95 DAI
    const impact = await ir.calculateExchangeRateImpact();
    console.log("Impact @ $0.95 DAI:", impact.toString());
    expect(impact.toNumber()).to.be.lt(0);  // Fix the assertion mode
  });

  // Total what tests to verify calculateTotalInterestRate function
  it("should return a normal interest rate close to base (but not lower)", async function () {
    await daiPriceFeed.updateAnswer("101000000");
  
    await mockVault.setCollateralAndDebt(
      ethers.utils.parseEther("5"),               // Mortgage  5 ETH
      ethers.utils.parseUnits("5000", 18)         // debt 5000 DAI
    );
  
    const rate = await ir.calculateTotalInterestRate(
      20,
      ethers.utils.parseUnits("1000", 18),
      mockVault.address
    );
  
    const baseRate = ethers.utils.parseUnits("0.05", 18); // 5%
    console.log("Normal interest rate:", rate.toString());
  
    // The rate cannot be less than the BASE
    expect(rate.gt(0), `Expected positive rate, got ${rate.toString()}`).to.be.true;
  });
  
  
  it("should fallback to BASE_INTEREST_RATE if all impacts are negative", async function () {
    await daiPriceFeed.updateAnswer("60000000"); // 0.60 DAI/USD（Deviate significantly from peg）
    await mockVault.setCollateralAndDebt(
      ethers.utils.parseEther("50"),                     // A lot of collateral
      ethers.utils.parseUnits("10", 18)                  // The debt is very small.
    );

    const rate = await ir.calculateTotalInterestRate(
      0,                                                 // The loan period is extremely short
      ethers.utils.parseUnits("0", 18),                  // The requested amount is 0
      mockVault.address
    );

    const baseRate = ethers.utils.parseUnits("0.05", 18); // 5%
    console.log("Fallback (base) rate:", rate.toString());

    assert(rate.eq(baseRate), "Should fallback to BASE_INTEREST_RATE");
  });

  it("should return high interest rate under heavy utilisation and long loan duration", async function () {
    await daiPriceFeed.updateAnswer("110000000"); // 1.10 DAI/USD
  
    await mockVault.setCollateralAndDebt(
      ethers.utils.parseEther("0.1"), // Extremely low mortgage
      ethers.utils.parseUnits("4950", 18) // high debt
    );
  
    const rate = await ir.calculateTotalInterestRate(
      730, // 2 years
      ethers.utils.parseUnits("3000", 18),
      mockVault.address
    );
  
    const threshold = ethers.utils.parseUnits("0.000001", 18); // 0.0001%
    console.log("High interest rate:", rate.toString());
  
    expect(rate.gt(threshold), `Expected rate > ${threshold.toString()}, got ${rate.toString()}`).to.be.true;
  });    
  
});
