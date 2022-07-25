require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
// require("@nomiclabs/hardhat-ganache");
require("@nomiclabs/hardhat-web3");
require("hardhat-gas-reporter");
require("dotenv").config();
const {POLYGON_MUMBAI_RPC_PROVIDER, POLYGON_MAINNET_RPC_PROVIDER, PRIVATE_KEY, POLYGON_API_KEY} = process.env;
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
    },
    mumbai: {
      url: POLYGON_MUMBAI_RPC_PROVIDER,
      accounts: [PRIVATE_KEY]
    },
    matic: {
      url: POLYGON_MAINNET_RPC_PROVIDER,
      accounts: [PRIVATE_KEY]
    },
    localhost:{
      url: "http://127.0.0.1:8545",
      chainId:1337,
      accounts: ["0xe8a028160e51b08c80c450e1e90f0e8deef6362c97d3b5b44488ce5a5fbf6110"]
    }
  },
  etherscan: {
    apiKey: POLYGON_API_KEY,
  },
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 800
          }
        }
      },
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 800
          }
        }
      }
    ]
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