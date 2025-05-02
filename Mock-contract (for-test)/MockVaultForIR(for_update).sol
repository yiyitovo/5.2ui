// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IVault.sol";

contract MockVaultForIR is IVault {
    uint256 public totalCollateral;
    uint256 public totalDebt;

    function setCollateralAndDebt(uint256 _collateral, uint256 _debt) external {
        totalCollateral = _collateral;
        totalDebt = _debt;
    }

    function getTotalCollateral() external view override returns (uint256) {
        return totalCollateral;
    }

    function getTotalDebt() external view override returns (uint256) {
        return totalDebt;
    }

    // This function must be added for impersonation to simulate the payment of gas by Vault
    receive() external payable {}

    // stubbed unused functions
    function isUndercollateralized(address) external pure override returns (bool) { return false; }
    function getVaultInfo(address) external pure override returns (uint256, uint256) { return (0, 0); }
    function getTreasury() external pure override returns (address) { return address(0); }
    function withdrawCollateralForLiquidation(address, uint256) external override {}
    function reduceDebt(address, uint256) external override {}
}
