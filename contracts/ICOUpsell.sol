// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/TokenTimelock.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract ICOUpsell is Ownable {
    using SafeERC20 for IERC20;

    // The token being sold
    address private immutable _token;

    // Address where funds are collected
    address payable private immutable _wallet;

    // How many token units a buyer gets per wei.
    // The rate is the conversion between wei and the smallest and indivisible token unit.
    // So, if you are using a rate of 1 with a ERC20Detailed token with 3 decimals called TOK
    // 1 wei will give you 1 unit, or 0.001 TOK.
    uint256 private immutable _rate;

    mapping(address => uint256) private contributions;

    // Amount of wei raised
    uint256 private _weiRaised;
    uint256 private _saleTokenSupply;

    // Track investor contributions
    uint256 public constant INVESTOR_MIN_CAP = 2000000 gwei; // 0.002 ether
    uint256 public constant INVESTOR_HARD_CAP = 50 ether; // 50 ether

    uint256 public constant TOTAL_SUPPLY = 10000000 ether;

    // Token Distribution
    uint8 public constant TOKEN_SALE_PERCENTAGE  = 10;
    uint8 public constant FOUNDERS_PERCENTAGE    = 20;
    uint8 public constant DEVELOPERS_PERCENTAGE  = 10;
    uint8 public constant PARTNERS_PERCENTAGE    = 10;

    // Token reserve funds
    address public immutable foundersWallet;
    address public immutable developersWallet;
    address public immutable partnersWallet;


    //Token Time Lock
    uint256 public releaseTime = block.timestamp + 3*365 days;
    address public foundersTimelock;
    address public developersTimelock;
    address public partnersTimelock;

    bool public saleLive = false;


     /**
     * Event for token purchase logging
     * @param purchaser who paid for the tokens
     * @param beneficiary who got the tokens
     * @param value weis paid for purchase
     * @param amount amount of tokens purchased
     */
    event TokensPurchased(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);


    constructor (
        uint256 rate_, 
        address payable wallet_, 
        ERC20PresetMinterPauser token_, 
        address foundersWallet_,
        address developersWallet_, 
        address partnersWallet_
    ) {
        require(rate_ > 0, "Crowdsale: rate is 0");
        require(wallet_ != address(0), "Crowdsale: wallet is the zero address");
        require(address(token_) != address(0), "Crowdsale: token is the zero address");
        require(foundersWallet_ != address(0), "Crowdsale: zero address");
        require(developersWallet_ != address(0), "Crowdsale: zero address");
        require(partnersWallet_ != address(0), "Crowdsale: zero address");

        _rate = rate_;
        _wallet = wallet_;
        _token = address(token_);

        foundersWallet   = foundersWallet_;
        developersWallet = developersWallet_;
        partnersWallet   = partnersWallet_;

        foundersTimelock   = address(new TokenTimelock(IERC20(token_), foundersWallet_, releaseTime));
        developersTimelock = address(new TokenTimelock(IERC20(token_), developersWallet_, releaseTime));
        partnersTimelock   = address(new TokenTimelock(IERC20(token_), partnersWallet_, releaseTime));

        _saleTokenSupply = (TOTAL_SUPPLY*TOKEN_SALE_PERCENTAGE)/100;
    }

    /**
     * @dev starts the sale and mints the token for predefined stakehoders.
     * NOTE Needs to be executed after the ownership of token smart contract is transferred to ICO smart contract 
     */
    function startSale() external onlyOwner {
        ERC20PresetMinterPauser(_token).mint(address(foundersWallet), ((TOTAL_SUPPLY*FOUNDERS_PERCENTAGE)/2)/100);
        ERC20PresetMinterPauser(_token).mint(address(developersWallet), ((TOTAL_SUPPLY*DEVELOPERS_PERCENTAGE)/2)/100);
        ERC20PresetMinterPauser(_token).mint(address(partnersWallet), ((TOTAL_SUPPLY*PARTNERS_PERCENTAGE)/2)/100);

        ERC20PresetMinterPauser(_token).mint(address(foundersTimelock), ((TOTAL_SUPPLY*FOUNDERS_PERCENTAGE)/2)/100);
        ERC20PresetMinterPauser(_token).mint(address(developersTimelock), ((TOTAL_SUPPLY*DEVELOPERS_PERCENTAGE)/2)/100);
        ERC20PresetMinterPauser(_token).mint(address(partnersTimelock), ((TOTAL_SUPPLY*PARTNERS_PERCENTAGE)/2)/100);

        // _token.pause();
        saleLive = true;
    }

    /**
     * @dev releases the vested tokens for all the stakeholders. Needs to be called after the vesting time period.
     */
    function releaseTokens() external {
        TokenTimelock(foundersTimelock).release();
        TokenTimelock(developersTimelock).release();
        TokenTimelock(partnersTimelock).release();
    }

    /**
     * @return the token being sold.
     */
    function token() external view returns (IERC20) {
        return IERC20(_token);
    }

    /**
     * @return the address where funds are collected.
     */
    function wallet() external view returns (address payable) {
        return _wallet;
    }

    /**
     * @return the number of token units a buyer gets per wei.
     */
    function rate() external view returns (uint256) {
        return _rate;
    }

    /**
    * @dev Returns the amount contributed so far by a sepecific user.
    * @param _beneficiary Address of contributor
    * @return User contribution so far
    */
    function getUserContribution(address _beneficiary)
        external 
        view 
        returns (uint256)
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

        uint256 mintedSupply = ERC20PresetMinterPauser(_token).totalSupply();
        
        if (TOTAL_SUPPLY<(mintedSupply+tokens)) {
            saleLive = false;
        }

        require(saleLive!=false, "Sale is not live yet or it finished!");

        // update state
        _weiRaised += weiAmount;

        _processPurchase(beneficiary, tokens);
        emit TokensPurchased(msg.sender, beneficiary, weiAmount, tokens);

        _updatePurchasingState(beneficiary, weiAmount);

        // _forwardFunds();
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
        require(_newContribution >= INVESTOR_MIN_CAP && _newContribution <= INVESTOR_HARD_CAP);
        contributions[_beneficiary] = _newContribution;
    }

    function preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal view {
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
        ERC20PresetMinterPauser(_token).mint(beneficiary, tokenAmount);
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

    // /**
    //  * @dev Determines how ETH is stored/forwarded on purchases.
    //  */
    // function _forwardFunds() internal {
    //     _wallet.transfer(msg.value);
    // }

    function withdrawFunds() public onlyOwner {
        _wallet.transfer(address(this).balance);
    }

    /**
    * @dev enables token transfers, called when owner calls finalize()
    */
    function finishSale() external onlyOwner {
        saleLive = false;
        withdrawFunds();
    }
}
