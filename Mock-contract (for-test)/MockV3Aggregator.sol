// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Mock Chainlink Aggregator
/// @dev Used for local testing and simulating the Chainlink ETH/USD oracle

contract MockV3Aggregator {
    uint8 private _decimals;
    int256 private _answer;
    uint256 private _startedAt;
    uint256 private _updatedAt;

    constructor(uint8 decimals_, int256 answer_) {
        _decimals = decimals_;
        _answer = answer_;
        _startedAt = block.timestamp;
        _updatedAt = block.timestamp;
    }

    function decimals() external view returns (uint8) {
        return _decimals;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (0, _answer, _startedAt, _updatedAt, 0);
    }

    // Used for updating the price
    function updateAnswer(int256 newAnswer) external {
        _answer = newAnswer;
        _updatedAt = block.timestamp;
    }
}
