// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./IVault.sol";

contract IRMechanism {
    AggregatorV3Interface public daiPriceFeed; // DAI/USD 预言机（返回价格接近1e18，即1 DAI≈1 USD）
    AggregatorV3Interface public ethPriceFeed; // ETH/USD 预言机，用于将 Vault 中全局抵押品转换为美元价值

    // Utilisation Rate Impact parameters
    uint256 public constant UR_LINEAR_COEFFICIENT = 30;
    uint256 public constant UR_QUADRATIC_COEFFICIENT = 100;
    uint256 public constant UR_QUADRATIC_TRIGGER = 50;
    uint256 public constant MAX_UTILISATION = 1e18; // 100%

    // DAI/USD Exchange Rate Impact Parameters
    uint256 public constant EXR_LINEAR_COEFFICIENT = 15;
    uint256 public constant EXR_QUADRATIC_COEFFICIENT = 150;
    uint256 public constant EXR_QUADRATIC_THRESHOLD = 5e13;

    // Base Interest Rate (Minimum Rate)
    uint256 public constant BASE_INTEREST_RATE = 5e16; // 5%

    // Time Weighting Coefficients 
    uint256 public constant TIME_QUADRATIC_COEFFICIENT = 1e7; 
    uint256 public constant TIME_LINEAR_COEFFICIENT = 1e6;
    uint256 public constant MAX_TIME_IMPACT = 1e18; // Cap on time impact

    constructor(address _daiPriceFeed, address _ethPriceFeed) {
        daiPriceFeed = AggregatorV3Interface(_daiPriceFeed);
        ethPriceFeed = AggregatorV3Interface(_ethPriceFeed);
    }

    /// @notice 获取 DAI/USD 价格（18 位小数），用于衡量 DAI 是否偏离 peg
    function getDaiPriceUSD() public view returns (uint256) {
        (, int256 price, , , ) = daiPriceFeed.latestRoundData();
        require(price > 0, "Invalid DAI price data");
        // 假定 daiPriceFeed 返回 8 位小数，将其转换为 18 位
        return uint256(price) * 1e10;
    }

    function getTotalDeposits(address vaultAddress) public view returns (uint256) {
        IVault vault = IVault(vaultAddress);
        uint256 totalCollateral = vault.getTotalCollateral();
        (, int256 ethPrice, , , ) = ethPriceFeed.latestRoundData();
        require(ethPrice > 0, "Invalid ETH price data");
        uint8 decimals = ethPriceFeed.decimals();
        return (totalCollateral * uint256(ethPrice)) / (10 ** decimals);
    }

    function getUtilisationRateWithAmount(
        uint256 requestedAmount,
        address vaultAddress
    ) public view returns (uint256) {
        uint256 totalDeposits = getTotalDeposits(vaultAddress);
        IVault vault = IVault(vaultAddress);
        uint256 totalDebt = vault.getTotalDebt();
        if (totalDeposits == 0) {
            return totalDebt > 0 ? MAX_UTILISATION : 0;
        }
        return ((totalDebt + requestedAmount) * 1e18) / totalDeposits;
    }

    function calculateUtilisationImpact(
        uint256 requestedAmount,
        address vaultAddress
    ) public view returns (uint256) {
        uint256 utilisationRate = getUtilisationRateWithAmount(requestedAmount, vaultAddress);
        if (utilisationRate > MAX_UTILISATION) {
            utilisationRate = MAX_UTILISATION;
        }
        uint256 linearImpact = (utilisationRate * UR_LINEAR_COEFFICIENT) / 1e17;
        uint256 quadraticImpact = 0;
        if (utilisationRate > UR_QUADRATIC_TRIGGER * 1e16) {
            uint256 excessUtilisation = utilisationRate - (UR_QUADRATIC_TRIGGER * 1e16);
            quadraticImpact = (excessUtilisation ** 2 * UR_QUADRATIC_COEFFICIENT) / 1e36;
        }
        return linearImpact + quadraticImpact;
    }

    function calculateTimeImpact(uint256 loanDurationDays) public pure returns (uint256) {
        uint256 impact = (TIME_QUADRATIC_COEFFICIENT * loanDurationDays ** 2) + (TIME_LINEAR_COEFFICIENT * loanDurationDays);
        return impact > MAX_TIME_IMPACT ? MAX_TIME_IMPACT : impact;
    }

    function calculateExchangeRateImpact() public view returns (int256) {
        uint256 daiPrice = getDaiPriceUSD();
        int256 deviation = int256(daiPrice) - int256(1e18);
        int256 linearImpact = (deviation * int256(EXR_LINEAR_COEFFICIENT)) / 1e16;
        int256 quadraticImpact = 0;
        if (deviation > int256(EXR_QUADRATIC_THRESHOLD) || deviation < -int256(EXR_QUADRATIC_THRESHOLD)) {
            int256 absDeviation = deviation > 0 ? deviation : -deviation;
            quadraticImpact = (absDeviation * absDeviation * int256(EXR_QUADRATIC_COEFFICIENT)) / 1e36;
            if (deviation < 0) {
                quadraticImpact *= -1;
            }
        }
        return linearImpact + quadraticImpact;
    }

    function calculateTotalInterestRate(
        uint256 loanDurationDays,
        uint256 requestedAmount,
        address vaultAddress
    ) public view returns (uint256) {
        uint256 utilisationImpact = calculateUtilisationImpact(requestedAmount, vaultAddress);
        uint256 timeImpact = calculateTimeImpact(loanDurationDays);
        int256 exchangeRateImpact = calculateExchangeRateImpact();
        int256 totalImpact = int256(utilisationImpact) + int256(timeImpact) + exchangeRateImpact;
        return totalImpact > 0 ? uint256(totalImpact) : BASE_INTEREST_RATE;
    }

    function updateInterest(address /* user */, uint256 currentDebt) external pure returns (uint256) {
        return currentDebt;
    }

    function getCurrentInterestRate() external pure returns (uint256) {
        return BASE_INTEREST_RATE;
    }
}
