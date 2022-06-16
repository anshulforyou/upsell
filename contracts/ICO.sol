// pragma solidity ^0.8.7;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/PausableToken.sol";
// import "@openzeppelin/contracts/token/ERC20/MintableToken.sol";
// import "@openzeppelin/contracts/token/ERC20/TokenTimelock.sol";
// import "@openzeppelin/contracts/crowdsale/Crowdsale.sol";
// import "@openzeppelin/contracts/crowdsale/emission/MintedCrowdsale.sol";
// import "@openzeppelin/contracts/crowdsale/validation/CappedCrowdsale.sol";
// import "@openzeppelin/contracts/crowdsale/validation/TimedCrowdsale.sol";
// import "@openzeppelin/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
// import "@openzeppelin/contracts/crowdsale/distribution/RefundableCrowdsale.sol";

// contract ICO is Crowdsale, MintedCrowdsale, CappedCrowdsale, TimedCrowdsale, WhitelistedCrowdsale, RefundableCrowdsale {

//   // Track investor contributions
//   uint256 public investorMinCap = 3000000000000000; // 0.003 ether
//   uint256 public investorHardCap = 40000000000000000000; // 40 ether
//   mapping(address => uint256) public contributions;

//   // Token Distribution
//   uint256 public tokenSalePercentage   = 60;
//   uint256 public foundersPercentage    = 20;
//   uint256 public foundationPercentage  = 10;
//   uint256 public partnersPercentage    = 10;

//   // Token reserve funds
//   address public foundersFund;
//   address public foundationFund;
//   address public partnersFund;

//   // Token time lock
//   uint256 public releaseTime;
//   address public foundersTimelock;
//   address public foundationTimelock;
//   address public partnersTimelock;

//   enum CrowdsaleStage { PreICO, ICO }
//   CrowdsaleStage public stage = CrowdsaleStage.PreICO;

//   constructor(
//     uint256 _rate,
//     address _wallet,
//     ERC20 _token,
//     uint256 _cap,
//     uint256 _openingTime,
//     uint256 _closingTime,
//     uint256 _goal,
//     address _foundersFund,
//     address _foundationFund,
//     address _partnersFund,
//     uint256 _releaseTime
//   )
//     Crowdsale(_rate, _wallet, _token)
//     CappedCrowdsale(_cap)
//     TimedCrowdsale(_openingTime, _closingTime)
//     RefundableCrowdsale(_goal)
//     public
//   {
//     require(_goal <= _cap);
//     foundersFund   = _foundersFund;
//     foundationFund = _foundationFund;
//     partnersFund   = _partnersFund;
//     releaseTime    = _releaseTime;
//   }

//   /**
//   * @dev Extend parent behavior requiring purchase to respect investor min/max funding cap.
//   * @param _beneficiary Token purchaser
//   * @param _weiAmount Amount of wei contributed
//   */
//   function _preValidatePurchase(
//     address _beneficiary,
//     uint256 _weiAmount
//   )
//     internal
//   {
//     super._preValidatePurchase(_beneficiary, _weiAmount);
//     uint256 _existingContribution = contributions[_beneficiary];
//     uint256 _newContribution = _existingContribution.add(_weiAmount);
//     require(_newContribution >= investorMinCap && _newContribution <= investorHardCap);
//     contributions[_beneficiary] = _newContribution;
//   }

//   function getUserContribution(address _beneficiary) public view returns (uint256)
//   {
//     return contributions[_beneficiary];
//   }

//   function setCrowdsaleStage(uint _stage) public onlyOwner {
//     if(uint(CrowdsaleStage.PreICO) == _stage) {
//       stage = CrowdsaleStage.PreICO;
//     } else if (uint(CrowdsaleStage.ICO) == _stage) {
//       stage = CrowdsaleStage.ICO;
//     }

//     if(stage == CrowdsaleStage.PreICO) {
//       rate = 500;
//     } else if (stage == CrowdsaleStage.ICO) {
//       rate = 250;
//     }
//   }

//   function _forwardFunds() internal {
//     if(stage == CrowdsaleStage.PreICO) {
//       wallet.transfer(msg.value);
//     } else if (stage == CrowdsaleStage.ICO) {
//       super._forwardFunds();
//     }
//   }

//   function _preValidatePurchase(
//     address _beneficiary,
//     uint256 _weiAmount
//   )
//     internal
//   {
//     super._preValidatePurchase(_beneficiary, _weiAmount);
//     uint256 _existingContribution = contributions[_beneficiary];
//     uint256 _newContribution = _existingContribution.add(_weiAmount);
//     require(_newContribution >= investorMinCap && _newContribution <= investorHardCap);
//     contributions[_beneficiary] = _newContribution;
//   }



//   /**
//    * @dev enables token transfers, called when owner calls finalize()
//   */
//   function finalization() internal {
//     if(goalReached()) {
//       MintableToken _mintableToken = MintableToken(token);
//       uint256 _alreadyMinted = _mintableToken.totalSupply();

//       uint256 _finalTotalSupply = _alreadyMinted.div(tokenSalePercentage).mul(100);

//       foundersTimelock   = new TokenTimelock(token, foundersFund, releaseTime);
//       foundationTimelock = new TokenTimelock(token, foundationFund, releaseTime);
//       partnersTimelock   = new TokenTimelock(token, partnersFund, releaseTime);

//       _mintableToken.mint(address(foundersTimelock),   _finalTotalSupply.mul(foundersPercentage).div(100));
//       _mintableToken.mint(address(foundationTimelock), _finalTotalSupply.mul(foundationPercentage).div(100));
//       _mintableToken.mint(address(partnersTimelock),   _finalTotalSupply.mul(partnersPercentage).div(100));

//       _mintableToken.finishMinting();
//       // Unpause the token
//       PausableToken _pausableToken = PausableToken(token);
//       _pausableToken.unpause();
//       _pausableToken.transferOwnership(wallet);
//     }

//     super.finalization();
//   }

// }