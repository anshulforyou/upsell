// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UPsellToken is ERC20PresetMinterPauser, Ownable {
    uint256 private _cap;

    constructor(uint256 cap_) ERC20PresetMinterPauser("UPsellToken", "UPSELL") {
        require(cap_ > 0, "ERC20Capped: cap is 0");
        _cap = cap_;
        _mint(msg.sender, 15000*10**uint256(decimals()));
    }

    /**
     * @dev Returns the cap on the token's total supply.
     */
    function cap() public view virtual returns (uint256) {
        return _cap;    
    }

    /**
     * @dev See {ERC20-_mint}.
     */
    function _mint(address account, uint256 amount) internal virtual override {
        require(ERC20.totalSupply() + amount <= cap(), "ERC20Capped: cap exceeded");
        super._mint(account, amount);
    }
}