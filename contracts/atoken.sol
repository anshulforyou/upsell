//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";

contract atoken is ERC20, Ownable{
    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol){

    }

    function mint(uint quantity) public onlyOwner{
        _mint(msg.sender, quantity);
    }
}