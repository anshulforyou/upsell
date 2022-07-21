Tokenomics
Max cap - 10M

Developer team - 10% (5% released immediately, 5% vested for 3 years)
Brand gifts - 5%
Early adopters - 5%
Founders/new hires - 20%(10% released immediately, 10% vested for 3 years)
Marketing - 20%
Advisers - 5%
Legal/accounting - 5%(2.5% released immediately, 2.5% vested for 3 years)
Operations - 5%
Community rewards - 20% (tokens that would be given as incentivize to general audience)
Live sale - 5%

This is the rough tokenomics that is decided after consultation with the client. For the implementation purpose, there are four sections in which tokens are divided, founders, developers, partners and the public sale. All the token distribution will be handled by the ICOUpsell smart contract. As mentioned in the tokenomics, for founders and developers half of their allocation would be vested for 3 years.

# Code Documentation

## Global variables defined - 
_token - Address of the token being sold, it is of type ERC20PresetMinterPauser which gives it functionality to be paused, minted, burn etc. This token address is kept private.

_wallet - Address of the wallet where the ETH or Matic would be collected. This address is private.

_rate - Rate in wei at which token would be bought. If we need to sell the token in 0.2 Eth (or 0.2 Matic in our case). We need to keep the rate to be 5.

investorMinCap and investorHardCap - Minimum and maximum amount of ether a user can put into buy our tokens. These limits helps to stop the sharks from hijacking the project.

contributions - A mapping of address(of the user) => uint256(amount of ether(or matic contributed))

totalSupply - Total supply of tokens

_tokenSalePercentage, _foundersSalePercentage, _developersSalePercentage, _partnersSalePercentage - percentage distribution of tokens to every shareholder.

saleTokenSupply - Count of tokens available for sale.

_foundersWallet, _developersWallet, _partnersWallet - Wallet address of the three mentioned stakeholders.

_releaseTime - Time for which the tokens are vested.

_foundersTimelock, _developersTimelock, _partnersTimelock - Time locks on the tokens vested.

_saleLive - boolean to turn on or off the sale of tokens.