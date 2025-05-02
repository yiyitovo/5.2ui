const { ethers, network } = require("hardhat");
const { expect } = require("chai");

describe("IRMechanism - updateInterest", function () {
  let ir, daiFeed, ethFeed;
  let mockVault, vaultSigner;
  let user;
  const ONE_ETHER = ethers.utils.parseEther("1");

  beforeEach(async function () {
    const accounts = await ethers.getSigners();
    user = accounts[1];

    // Deploy mock price feeds
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    daiFeed = await MockV3Aggregator.deploy(8, 1e8); // DAI/USD = $1
    ethFeed = await MockV3Aggregator.deploy(8, 2000e8); // ETH/USD = $2000

    // Deploy IRMechanism
    const IRMechanism = await ethers.getContractFactory("IRMechanism");
    ir = await IRMechanism.deploy(daiFeed.address, ethFeed.address);

    // Deploy and setup MockVault
    const MockVault = await ethers.getContractFactory("MockVaultForIR");
    mockVault = await MockVault.deploy();
    await mockVault.setCollateralAndDebt(
      ethers.utils.parseEther("10"), // 10 ETH
      ethers.utils.parseEther("1000") // 1000 DAI
    );

    // 4. Impersonate Vault
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [mockVault.address],
    });

    const [owner] = await ethers.getSigners();
    await owner.sendTransaction({
      to: mockVault.address,
      value: ONE_ETHER,
    });

    vaultSigner = await ethers.getSigner(mockVault.address);
  });

  it("should return currentDebt on first call (initialize timestamp)", async function () {
    const currentDebt = ethers.utils.parseEther("1000");
  
    const updated = await ir.connect(vaultSigner).callStatic.updateInterest(user.address, currentDebt);
    expect(updated.eq(currentDebt)).to.be.true; //  BigNumber comparison
  
    await ir.connect(vaultSigner).updateInterest(user.address, currentDebt);
  
    const last = await ir.lastTimestamp(user.address);
    expect(last.gt(0)).to.be.true; //  Fix this line
  });
    

  it("should not accrue interest if less than 1 day passed", async function () {
    const currentDebt = ethers.utils.parseEther("1000");
  
    await ir.connect(vaultSigner).updateInterest(user.address, currentDebt);
  
    await network.provider.send("evm_increaseTime", [12 * 60 * 60]);
    await network.provider.send("evm_mine");
  
    const updated = await ir.connect(vaultSigner).callStatic.updateInterest(user.address, currentDebt);
    expect(updated.eq(currentDebt)).to.be.true; 
  });
  
  it("should accrue interest correctly after 5 days", async function () {
    const currentDebt = ethers.utils.parseEther("1000");

    // First update: sets timestamp
    await ir.connect(vaultSigner).updateInterest(user.address, currentDebt);

    // Forward 5 days
    await network.provider.send("evm_increaseTime", [5 * 86400]);
    await network.provider.send("evm_mine");

    const updated = await ir.connect(vaultSigner).callStatic.updateInterest(user.address, currentDebt);
    const interest = updated.sub(currentDebt);

    console.log(" Interest after 5 days:", ethers.utils.formatEther(interest));
    console.log(" Total updated debt:", ethers.utils.formatEther(updated));

    expect(interest.gt(0)).to.be.true;
  });

});
