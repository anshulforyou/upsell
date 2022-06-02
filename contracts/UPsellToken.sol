// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UPsellToken is ERC20, Ownable{
    // uint256 private tokenSupply = 0;
    constructor() ERC20("UPsellToken", "UPSELL"){
        _mint(msg.sender, 15000*10**uint256(decimals()));
        // tokenSupply+=10000*10**uint256(decimals);
        // return tokenSupply();
    }
    function getMoreTokens(uint quantity) public onlyOwner{
        _mint(msg.sender, quantity*10**uint256(decimals()));
        // tokenSupply+=quantity;
        // return tokenSupply();
    }

    function burnTokens(address account, uint256 amount) public onlyOwner{
        _burn(account, amount);
        // tokenSupply-=amount;
        // return tokenSupply();
    }

    function giveRewards(address rewardee, uint256 amount) public onlyOwner{
        _mint(rewardee, amount);
        // tokenSupply+=amount;
        // return tokenSupply();
    }
}