//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/TokenTimelock.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract ICOUpsell is Ownable{
    using SafeERC20 for IERC20;

    // The token being sold
    ERC20PresetMinterPauser private _token;

    // Address where funds are collected
    address payable private _wallet;

    // How many token units a buyer gets per wei.
    // The rate is the conversion between wei and the smallest and indivisible token unit.
    // So, if you are using a rate of 1 with a ERC20Detailed token with 3 decimals called TOK
    // 1 wei will give you 1 unit, or 0.001 TOK.
    uint256 private _rate;

    // Track investor contributions
    uint256 public investorMinCap = 2000000000000000; // 0.002 ether
    uint256 public investorHardCap = 50000000000000000000; // 50 ether
    mapping(address => uint256) public contributions;

    uint256 public totalSupply = 1000000000*10**uint256(18);

    /**
     * Event for token purchase logging
     * @param purchaser who paid for the tokens
     * @param beneficiary who got the tokens
     * @param value weis paid for purchase
     * @param amount amount of tokens purchased
     */
    event TokensPurchased(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

    // Token Distribution
    uint256 public _tokenSalePercentage   = 10;
    uint256 public _foundersPercentage    = 20;
    uint256 public _developersPercentage  = 10;
    uint256 public _partnersPercentage    = 10;

    uint256 internal saleTokenSupply;

    // Token reserve funds
    address public _foundersWallet;
    address public _developersWallet;
    address public _partnersWallet;


    //Token Time Lock
    uint256 public _releaseTime = block.timestamp + 5 minutes;
    TokenTimelock public _foundersTimelock;
    TokenTimelock public _developersTimelock;
    TokenTimelock public _partnersTimelock;

    bool public _saleLive = false;


    // Amount of wei raised
    uint256 private _weiRaised;

    constructor (uint256 rate, address payable wallet, ERC20PresetMinterPauser token, address foundersFund,
    address developersFund, address partnersFund){
        require(rate > 0, "Crowdsale: rate is 0");
        require(wallet != address(0), "Crowdsale: wallet is the zero address");
        require(address(token) != address(0), "Crowdsale: token is the zero address");
        // require(cap > 0, "CappedCrowdsale: cap is 0");

        _rate = rate;
        _wallet = wallet;
        _token = token;

        _foundersWallet   = foundersFund;
        _developersWallet = developersFund;
        _partnersWallet   = partnersFund;

        _foundersTimelock   = new TokenTimelock(token, _foundersWallet, _releaseTime);
        _developersTimelock = new TokenTimelock(token, _developersWallet, _releaseTime);
        _partnersTimelock   = new TokenTimelock(token, _partnersWallet, _releaseTime);

        saleTokenSupply = (totalSupply*_tokenSalePercentage)/100;
    }

    /**
     * @dev starts the sale and mints the token for predefined stakehoders.
     * NOTE Needs to be executed after the ownership of token smart contract is transferred to ICO smart contract 
     */
    function startSale() public onlyOwner{
        _token.mint(address(_foundersWallet), (totalSupply*(_foundersPercentage/2))/100);
        _token.mint(address(_developersWallet), (totalSupply*(_developersPercentage/2))/100);
        _token.mint(address(_partnersWallet), (totalSupply*(_partnersPercentage/2))/100);

        _token.mint(address(_foundersTimelock), (totalSupply*(_foundersPercentage/2))/100);
        _token.mint(address(_developersTimelock), (totalSupply*(_developersPercentage/2))/100);
        _token.mint(address(_partnersTimelock), (totalSupply*(_partnersPercentage/2))/100);

        // _token.pause();
        _saleLive = true;
    }

    /**
     * @dev releases the vested tokens for all the stakeholders. Needs to be called after the vesting time period.
     */
    function releaseTokens() public {
        _foundersTimelock.release();
        _developersTimelock.release();
        _partnersTimelock.release();
    }

    /**
     * @return the token being sold.
     */
    function token() public view returns (IERC20) {
        return _token;
    }

    /**
     * @return the address where funds are collected.
     */
    function wallet() public view returns (address payable) {
        return _wallet;
    }

    /**
     * @return the number of token units a buyer gets per wei.
     */
    function rate() public view returns (uint256) {
        return _rate;
    }

    /**
    * @dev Returns the amount contributed so far by a sepecific user.
    * @param _beneficiary Address of contributor
    * @return User contribution so far
    */
    function getUserContribution(address _beneficiary)
        public view returns (uint256)
    {
        return contributions[_beneficiary];
    }

    /**
     * @dev fallback function ***DO NOT OVERRIDE***
     * Note that other contracts will transfer funds with a base gas stipend
     * of 2300, which is not enough to call buyTokens. Consider calling
     * buyTokens directly when purchasing tokens from a contract.
     */
    fallback () external payable {
        buyTokens(msg.sender);
    }

    bool private _notEntered = true;

    modifier nonReentrant() {
        // On the first call to nonReentrant, _notEntered will be true
        require(_notEntered, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _notEntered = false;

        _;

        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _notEntered = true;
    }


    /**
     * @dev low level token purchase ***DO NOT OVERRIDE***
     * This function has a non-reentrancy guard, so it shouldn't be called by
     * another `nonReentrant` function.
     * @param beneficiary Recipient of the token purchase
     */
    function buyTokens(address beneficiary) public nonReentrant payable {
        uint256 weiAmount = msg.value;
        _preValidatePurchase(beneficiary, weiAmount);

        // calculate token amount to be created
        uint256 tokens = _getTokenAmount(weiAmount);

        uint256 mintedSuppy = _token.totalSupply();
        
        if (totalSupply<(mintedSuppy+tokens)){
            _saleLive = false;
        }

        require(_saleLive!=false, "Sale is not live yet or it's finished!");

        // update state
        _weiRaised = _weiRaised + weiAmount;

        _processPurchase(beneficiary, tokens);
        emit TokensPurchased(msg.sender, beneficiary, weiAmount, tokens);

        _updatePurchasingState(beneficiary, weiAmount);

        _forwardFunds();
        _postValidatePurchase(beneficiary, weiAmount);
    }

    /**
    @dev Validation of an incoming purchase. Use require statements to revert state when conditions are not met.
     Use `super` in contracts that inherit from Crowdsale to extend their validations.
     Example from CappedCrowdsale.sol's _preValidatePurchase method:
         super._preValidatePurchase(_beneficiary, _weiAmount);
         require(weiRaised().add(_weiAmount) <= cap);
     @param _beneficiary Address performing the token purchase
     @param _weiAmount Value in wei involved in the purchase
     */
    
    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
        preValidatePurchase(_beneficiary, _weiAmount);
        uint256 _existingContribution = contributions[_beneficiary];
        uint256 _newContribution = _existingContribution+_weiAmount;
        require(_newContribution >= investorMinCap && _newContribution <= investorHardCap);
        contributions[_beneficiary] = _newContribution;
    }

    function preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal view{
        require(_beneficiary != address(0), "Crowdsale: beneficiary is the zero address");
        require(_weiAmount != 0, "Crowdsale: weiAmount is 0");
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
    }

    /**
     * @dev Source of tokens. Override this method to modify the way in which the crowdsale ultimately gets and sends
     * its tokens.
     * @param beneficiary Address performing the token purchase
     * @param tokenAmount Number of tokens to be emitted
     */
    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal {
        // (bool success, bytes memory result) = address(_token).call(abi.encodeWithSignature("mint(address, uint256)", beneficiary, tokenAmount));
        // Have to solve the pausing issue here
        _token.mint(beneficiary, tokenAmount);
    }

    /**
     * @dev Executed when a purchase has been validated and is ready to be executed. Doesn't necessarily emit/send
     * tokens.
     * @param beneficiary Address receiving the tokens
     * @param tokenAmount Number of tokens to be purchased
     */
    function _processPurchase(address beneficiary, uint256 tokenAmount) internal {
        _deliverTokens(beneficiary, tokenAmount);
    }

    /**
     * @dev Validation of an executed purchase. Observe state and use revert statements to undo rollback when valid
     * conditions are not met.
     * @param beneficiary Address performing the token purchase
     * @param weiAmount Value in wei involved in the purchase
     */
    function _postValidatePurchase(address beneficiary, uint256 weiAmount) internal view {
        // solhint-disable-previous-line no-empty-blocks
    }

    /**
     * @dev Override to extend the way in which ether is converted to tokens.
     * @param weiAmount Value in wei to be converted into tokens
     * @return Number of tokens that can be purchased with the specified _weiAmount
     */
    function _getTokenAmount(uint256 weiAmount) internal view returns (uint256) {
        return weiAmount*_rate;
    }

    /**
     * @dev Override for extensions that require an internal state to check for validity (current user contributions,
     * etc.)
     * @param beneficiary Address receiving the tokens
     * @param weiAmount Value in wei involved in the purchase
     */
    function _updatePurchasingState(address beneficiary, uint256 weiAmount) internal {
        // solhint-disable-previous-line no-empty-blocks
    }

    /**
     * @dev Transfers the ETH to the collection wallet
     */
    function _forwardFunds() internal {
        _wallet.transfer(msg.value);
    }

    /**
    * @dev enables token transfers, called when owner calls finalize()
    */
    function finishSale() public onlyOwner {
        // ERC20PresetMinterPauser tempToken = ERC20PresetMinterPauser(_token);
        // tempToken.unpause();
        // tempToken.transferOwnership(wallet);
        address(_token).call(abi.encodeWithSignature("transferOwnership", _wallet));

        _saleLive = false;
        // uint256 _alreadyMinted = _mintableToken.totalSupply();
    }
}