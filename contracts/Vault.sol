// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./IVault.sol";

interface IMintableDAI {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IIRMechanism {
    function updateInterest(address user, uint256 currentDebt) external returns (uint256);
    function getCurrentInterestRate() external view returns (uint256);
}

interface ILiquidation {
    function liquidate(address user, uint256 collateral, uint256 debt) external returns (bool);
}

contract Vault is ReentrancyGuard, IVault {
    mapping(address => uint256) public collateral;
    mapping(address => uint256) public debt;

    uint256 public totalCollateral;
    uint256 public totalDebt;

    IMintableDAI public daiToken;
    IIRMechanism public irMechanism;
    ILiquidation public liquidation;
    AggregatorV3Interface public ethPriceFeed;

    uint256 public constant COLLATERAL_RATIO = 150;

    constructor(
        IMintableDAI _daiToken,
        IIRMechanism _irMechanism,
        ILiquidation _liquidation,
        AggregatorV3Interface _ethPriceFeed
    ) {
        daiToken = _daiToken;
        irMechanism = _irMechanism;
        liquidation = _liquidation;
        ethPriceFeed = _ethPriceFeed;
    }

    function updateUserInterest(address user) internal {
        uint256 updatedDebt = irMechanism.updateInterest(user, debt[user]);
        debt[user] = updatedDebt;
    }

    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Must deposit ETH");
        collateral[msg.sender] += msg.value;
        totalCollateral += msg.value;
    }

    function getCollateralValue(address user) public view returns (uint256) {
        (, int256 answer, , , ) = ethPriceFeed.latestRoundData();
        require(answer > 0, "Invalid price data");
        uint256 price = uint256(answer);
        uint8 decimals = ethPriceFeed.decimals();
        return (collateral[user] * price) / (10 ** decimals);
    }

    function borrow(uint256 daiAmount) external nonReentrant {
        require(daiAmount > 0, "Must borrow > 0");

        // Apply interest rate
        updateUserInterest(msg.sender);

        // Trigger interest rate calculation 
        irMechanism.getCurrentInterestRate();

        uint256 collateralValue = getCollateralValue(msg.sender);
        uint256 maxBorrow = (collateralValue * 100) / COLLATERAL_RATIO;
        
        require(debt[msg.sender] + daiAmount <= maxBorrow, "Exceeds borrowing capacity");

        debt[msg.sender] += daiAmount;
        totalDebt += daiAmount;
        daiToken.mint(msg.sender, daiAmount);
    }

    function repay(uint256 daiAmount) external nonReentrant {
        require(daiAmount > 0, "Must repay > 0");
        updateUserInterest(msg.sender);
        require(debt[msg.sender] >= daiAmount, "Repaying more than debt");

        bool success = daiToken.transferFrom(msg.sender, address(this), daiAmount);
        require(success, "DAI transfer failed");

        daiToken.burn(address(this), daiAmount);
        debt[msg.sender] -= daiAmount;
        totalDebt -= daiAmount;
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(collateral[msg.sender] >= amount, "Not enough collateral");
        updateUserInterest(msg.sender);

        uint256 newCollateral = collateral[msg.sender] - amount;
        (, int256 answer, , , ) = ethPriceFeed.latestRoundData();
        require(answer > 0, "Invalid price data");
        uint256 price = uint256(answer);
        uint8 decimals = ethPriceFeed.decimals();
        uint256 newCollateralValue = (newCollateral * price) / (10 ** decimals);
        uint256 maxBorrowAfter = (newCollateralValue * 100) / COLLATERAL_RATIO;
        require(debt[msg.sender] <= maxBorrowAfter, "Withdrawal would breach collateral ratio");

        collateral[msg.sender] = newCollateral;
        totalCollateral -= amount;
        payable(msg.sender).transfer(amount);
    }

    function isUndercollateralized(address user) public view override returns (bool) {
        uint256 collateralValue = getCollateralValue(user);
        uint256 maxBorrow = (collateralValue * 100) / COLLATERAL_RATIO;
        return debt[user] > maxBorrow;
    }

    function getVaultInfo(address user) external view override returns (uint256, uint256) {
        return (collateral[user], debt[user]);
    }

    function getTreasury() external view override returns (address) {
        return address(this);
    }

    function withdrawCollateralForLiquidation(address user, uint256 amount) external override nonReentrant {
        require(msg.sender == address(liquidation), "Not authorized");
        require(collateral[user] >= amount, "Insufficient collateral");
        collateral[user] -= amount;
        totalCollateral -= amount;
        payable(msg.sender).transfer(amount);
    }

    function getTotalCollateral() external view returns (uint256) {
        return totalCollateral;
    }

    function getTotalDebt() external view returns (uint256) {
        return totalDebt;
    }

    function getVaultDAIBalance() external view returns (uint256) {
        return daiToken.balanceOf(address(this));
    }

    function getCurrentInterestRate() public view returns (uint256) {
        return irMechanism.getCurrentInterestRate();
    }

    function calculateHealthFactor(address user) public view returns (uint256) {
        uint256 colVal = getCollateralValue(user);
        if (debt[user] == 0) return type(uint256).max;
        return (colVal * 1e18) / debt[user];
    }

    function getDebtValue(address user) public view returns (uint256) {
        return debt[user];
    }

    function isUndercollateralized(address /* vault */, address user) public view returns (bool) {
        return isUndercollateralized(user);
    }
}
