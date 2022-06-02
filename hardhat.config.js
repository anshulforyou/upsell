require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();
const {POLYGON_MUMBAI_RPC_PROVIDER, POLYGON_MAINNET_PROVIDER, PRIVATE_KEY, POLYGON_API_KEY} = process.env;
module.exports = {
  defaultNetwork: "matic",
  networks: {
    hardhat: {
    },
    matic: {
      url: POLYGON_MUMBAI_RPC_PROVIDER,
      accounts: [PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: POLYGON_API_KEY,
  },
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 20000
  }
}