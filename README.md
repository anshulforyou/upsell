## compilation command
npx hardhat compile

## testing command
npm run test

## deployment command
npx hardhat run scripts/deploy-token.js --network matic 

## verification command
npx hardhat verify {{contract address}} --network matic

Contract address - Polygon Testnet
Upsell token smart contract
0xaA3154e73e1eA6D5CB7bcf368E4deF0E452926F4

ICO smart contract
0x6C938558dA436871752ee348749aDE79693D40FE
## Creation flow
For three weeks token sale would be public, that time token transfer would be paused. In this particular period people can buy tokens at predefined rate. We have defined a limit of the sale. Only 5% tokens of the total supply could be sold. After 3 weeks, token transfer would be allowed and uniswap pool would be created which will allow people to swap the token with ether.
