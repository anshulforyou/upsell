## compilation command
npx hardhat compile

## testing command
npm run test

## deployment command
npx hardhat run scripts/deploy.js --network matic 

## verification command
npx hardhat verify {{contract address}} --network matic

Contract address - Polygon Testnet
0xb5C02d591313aF01EFAE3aB6D749F51d1f48A859

## Creation flow
For three weeks token sale would be public, that time token transfer would be paused. In this particular period people can buy tokens at predefined rate. We have defined a limit of the sale. Only 5% tokens of the total supply could be sold. After 3 weeks, token transfer would be allowed and uniswap pool would be created which will allow people to swap the token with ether.
