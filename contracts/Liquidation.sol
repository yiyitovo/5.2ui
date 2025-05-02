// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IVault.sol";

contract Liquidation is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public daiToken;

    uint256 public constant BASE_DISCOUNT = 5;  // 5%
    uint256 public constant MAX_DISCOUNT = 15;  // 15%
    uint256 public constant LIQUIDATION_WAIT_PERIOD = 24 hours;

    // 记录每个用户首次清算的时间
    mapping(address => uint256) public firstLiquidationTime;

    event Liquidated(
        address indexed vault,
        address indexed user,
        address indexed liquidator,
        uint256 repaidAmount,
        uint256 collateralSeized
    );

    constructor(address _daiToken) {
        daiToken = IERC20(_daiToken);
    }

    /// @notice 根据传入的利用率（例如这里固定为 50）计算动态折扣率
    function getDynamicDiscount(uint256 utilizationRate) public pure returns (uint256) {
        uint256 discount = BASE_DISCOUNT + (utilizationRate / 10);
        return discount > MAX_DISCOUNT ? MAX_DISCOUNT : discount;
    }

    /**
     * @notice 清算函数
     * @param vaultAddress 要操作的 Vault 合约地址
     * @param user 欠押用户地址
     *
     * 对于欠押用户：
     * - 若尚未清算，则首次清算50%债务，并记录清算时间；
     * - 若已清算且24小时后仍未恢复健康抵押率，则清算剩余债务，并重置清算记录。
     */
    function liquidate(address vaultAddress, address user) external nonReentrant {
        IVault vault = IVault(vaultAddress);
        require(vault.isUndercollateralized(user), "User is not undercollateralized");

        (uint256 userCollateral, uint256 userDebt) = vault.getVaultInfo(user);
        require(userDebt > 0, "No outstanding debt");

        uint256 liquidationAmount;
        uint256 collateralSeized;
        uint256 discount = getDynamicDiscount(50); // 这里固定利用率参数为50，根据需求可修改

        if (firstLiquidationTime[user] == 0) {
            // 首次清算：清算50%债务，并记录时间
            liquidationAmount = userDebt / 2;
            collateralSeized = (liquidationAmount * userCollateral * (100 + discount)) / (100 * userDebt);
            firstLiquidationTime[user] = block.timestamp;
        } else {
            // 检查是否超过24小时等待期
            require(block.timestamp >= firstLiquidationTime[user] + LIQUIDATION_WAIT_PERIOD, "24 hours not passed");
            require(vault.isUndercollateralized(user), "User has recovered collateral ratio");
            // 清算剩余债务
            liquidationAmount = userDebt;
            collateralSeized = (liquidationAmount * userCollateral * (100 + discount)) / (100 * userDebt);
            firstLiquidationTime[user] = 0;
        }

        require(daiToken.balanceOf(msg.sender) >= liquidationAmount, "Insufficient DAI balance for liquidation");
        // 将清算人支付的 DAI 转入 Vault 的资金池（Treasury）
        daiToken.safeTransferFrom(msg.sender, vault.getTreasury(), liquidationAmount);
        // 从 Vault 提取对应数量的抵押品给清算人
        vault.withdrawCollateralForLiquidation(user, collateralSeized);

        emit Liquidated(vaultAddress, user, msg.sender, liquidationAmount, collateralSeized);
    }
}
