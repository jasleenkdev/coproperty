// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PropertyToken is ERC20, Ownable {

    uint256 public propertyId;
    uint256 public constant MAX_SUPPLY = 1000 * 10**18;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 _propertyId,
        address treasuryWallet
    ) ERC20(name_, symbol_) Ownable(treasuryWallet) {

        propertyId = _propertyId;
        // _mint(treasuryWallet, MAX_SUPPLY);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }
}