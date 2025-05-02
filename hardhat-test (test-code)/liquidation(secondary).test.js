const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const { expect } = chai;
const { ethers } = require("hardhat");

describe("Liquidation System", function () {
  let dai, ir, liquidation, vault;
  let daiPriceFeed, ethPriceFeed;
  let deployer, user, liquidator;

  this.timeout(100000);

  beforeEach(async function () {
    [deployer, user, liquidator] = await ethers.getSigners();

    // Deploy the Chainlink Mock oracle
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    daiPriceFeed = await MockV3Aggregator.deploy(8, "100000000"); // $1
    ethPriceFeed = await MockV3Aggregator.deploy(8, "200000000000"); // $2000
    await daiPriceFeed.deployed();
    await ethPriceFeed.deployed();

    // Deploy DAI
    const MintableDAI = await ethers.getContractFactory("MintableDAI");
    dai = await MintableDAI.deploy();
    await dai.deployed();

    // Deploy the IR mechanism
    const IRMechanism = await ethers.getContractFactory("IRMechanism");
    ir = await IRMechanism.deploy(daiPriceFeed.address, ethPriceFeed.address);
    await ir.deployed();

    // Deploy Liquidation
    const Liquidation = await ethers.getContractFactory("Liquidation");
    liquidation = await Liquidation.deploy(dai.address);
    await liquidation.deployed();

    // Deploy Vault
    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy(dai.address, ir.address, liquidation.address, ethPriceFeed.address);
    await vault.deployed();

    // Authorize vault as the minter of DAI
    await dai.setMinter(vault.address);
  });

  // Test the first liquidation
  it("should allow liquidator to perform partial liquidation", async function () {
    const depositAmount = ethers.utils.parseEther("1"); // 1 ETH = $2000
    const borrowAmount = ethers.utils.parseUnits("1300", 18); 

    // The user staked ETH and borrowed money
    await vault.connect(user).deposit({ value: depositAmount });
    await vault.connect(user).borrow(borrowAmount);

    // 转Transfer DAI to the liquidator (deployer）
    await dai.connect(user).transfer(deployer.address, borrowAmount);

    // Simulate the decline of ETH
    await ethPriceFeed.updateAnswer("120000000000"); // ETH = $1200

    // Manually trigger interest updates to ensure real-time debt reflection (avoiding liquidation failure)
    await vault.poke(user.address);

    // Verify whether there is any outstanding deposit
    const under = await vault.isUndercollateralized(user.address);
    console.log("Is user undercollateralized?", under); // 应该是 true

    // Obtain pre-liquidation debts
    const debtBefore = await vault.debt(user.address);
    console.log("User debt before:", ethers.utils.formatUnits(debtBefore, 18));

    // The liquidator authorizes DAI
    await dai.connect(deployer).approve(liquidation.address, borrowAmount);

    // Execution of liquidation
    const tx = await liquidation.connect(deployer).liquidate(vault.address, user.address);
    await tx.wait();

    // Obtain the debt after liquidation
    const debtAfter = await vault.debt(user.address);
    console.log("User debt after:", ethers.utils.formatUnits(debtAfter, 18));

    // Assert a decline in debt (partial liquidation successful)
    expect(debtAfter.lt(debtBefore)).to.be.true;
  });

  // Test the secondary liquidation
  it("should allow second liquidation after 24 hours if still undercollateralized", async function () {
    const depositAmount = ethers.utils.parseEther("1"); // 1 ETH = $2000
    const borrowAmount = ethers.utils.parseUnits("1300", 18); // borrow
    
    await vault.connect(user).deposit({ value: depositAmount });
    await vault.connect(user).borrow(borrowAmount);
    await dai.connect(user).transfer(deployer.address, borrowAmount);
    await ethPriceFeed.updateAnswer("120000000000"); // ETH = $1200
    
    await vault.poke(user.address); // Update interest
  
    // The first liquidation
    await dai.connect(deployer).approve(liquidation.address, borrowAmount);
    await liquidation.connect(deployer).liquidate(vault.address, user.address);
  
    // debt should be reduced.
    const afterFirst = await vault.debt(user.address);
    console.log("Debt after first liquidation:", ethers.utils.formatUnits(afterFirst, 18));
  
    // Simulate the passage of 24 hours
    await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]); // 24 hours + 1 second
    await ethers.provider.send("evm_mine");

    // Authorize deployer to mint (for testing only)
    await dai.setMinter(deployer.address);
  
    // The second liquidation
    await dai.mint(deployer.address, afterFirst); // Give deployer the new DAI
    await dai.connect(deployer).approve(liquidation.address, afterFirst);
    await liquidation.connect(deployer).liquidate(vault.address, user.address);
  
    const finalDebt = await vault.debt(user.address);
    console.log("Debt after second liquidation:", ethers.utils.formatUnits(finalDebt, 18));
  
    //  The final assertion: The user has no debts
    expect(finalDebt.eq(0)).to.be.true;
  });
  

});
