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

## Functions
Constructor - While deploying the contract, rate, token address, stakeholders wallet addresses and collection wallet address needs to be passed to the constructor. The constructor then declares the value of global varibales based on values provided as input. Apart from it the value of timelocks and total supply is declared.
    Inputs - {
        uint256 rate,
        address payable wallet,
        ERC20PresetMinterPauser token,
        address foundersFund,
        address developersFund, 
        address partnersFund
    }


startSale - This particular function shifts the boolean saleLive to true and also mints the tokens for the predefined stakeholders.
    Requirement - {
        ICO contract is owner of Upsell token contract
        Only owner of ICO smart contract can call the function
    }
    Inputs - Null

releaseToken - This function releases the vested tokens of an individual. This function can be called by anyone and would release the vested tokens of all the stakeholders if the vested period is over.

token, wallet, rate - view only functions which returns the value of the mentioned global variables - token address, wallet address and rate.

getUserContribution - Returns the amount contributed by a specific user so far
    Input - Address of the user

fallback - executes the buyTokens function with msg sender as input.
    If anyone will send eth to the contract they will automatically get the tokens.

nonReentrant modifier to prevent the reentrancy attack in the buyTokens function

buyTokens - The function responsible for allocating the token to the user based on the amount of ETH contributes by the user.
    Input - Beneficiary address
    Keep in mind that it is a low level function for token purchase and should not be override.

    _preValidatePurchase, _getTokenAmount, _processPurchase, _updatePurchasingState, _forwardsFunds and _postValidatePurchase are all helper functions for buyTokens function

    require statements - Before processing the tokens to the user, it is checked if the sale is live or not.

_getTokenAmount - Calculates the number of tokens need to be given based on amount of ETH contributed.

_preValidatePurchase - Validation of an incoming purchase. Use require statements to revert state when conditions are not met.
    Input - _beneficiary Address performing the token purchase, _weiAmount Value in wei involved in the purchase

_processPurchase - Executes when a purchase has been validated and is ready to be executed. Doesn't necessarily emit/send tokens.
    Input - beneficiary address receiving the token, Token amount that needs to be transferred.
    
_forwardFunds - Transfers the ETH received to the collection wallet

_postValidatePurchase - Validation of an executed purchase. Observe state and use revert statements to undo rollback when valid
conditions are not met.
    Input - beneficiary Address performing the token purchase, weiAmount Value in wei involved in the purchase

finishSale - Switches the _saleLive variable to false and transfer the ownership of the token smart contract to the wallet.



## Things to change before mainnet deploy -
    Address of the final owner of the token contract in the finishsale function