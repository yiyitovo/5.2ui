// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVault {
    // Check whether the specified user is in an under-bet state
    function isUndercollateralized(address user) external view returns (bool);

    // Obtain the collateral and debt information of the designated user
    function getVaultInfo(address user) external view returns (uint256 collateral, uint256 debt);

    // Obtain the Treasury address of Vault for receiving DAI paid by the liquidator
    function getTreasury() external view returns (address);

    // Extract collateral from the designated user for the liquidation operation
    function withdrawCollateralForLiquidation(address user, uint256 amount) external;

    // Obtain the total global collateral quantity (unit: wei)
    function getTotalCollateral() external view returns (uint256);

    // Obtain the total global debt (unit: wei)
    function getTotalDebt() external view returns (uint256);

}
