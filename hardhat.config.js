require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const path = require("path");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  paths: {
    sources: "./contracts", // your existing contracts folder
  },
  networks: {
    sepolia: {
      url: process.env.INFURA_API_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    }
  },
  resolve: {
    alias: {
      "@chainlink": path.resolve(__dirname, "node_modules/@chainlink"),
    }
  }
};
