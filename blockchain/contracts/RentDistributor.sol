// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IPropertyToken {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function totalSupply(uint256 id) external view returns (uint256);
    function propertyExists(uint256 id) external view returns (bool);
}

contract RentDistributor is AccessControl, ReentrancyGuard {

    bytes32 public constant PLATFORM_ROLE = keccak256("PLATFORM_ROLE");

    IPropertyToken public propertyToken;

    // tokenId → total rent ever deposited (cumulative, in wei)
    mapping(uint256 => uint256) public cumulativeRentPerProperty;

    // tokenId → user → rent already withdrawn
    mapping(uint256 => mapping(address => uint256)) public rentWithdrawn;

    // Events
    event RentDeposited(uint256 indexed tokenId, uint256 amount, uint256 newCumulative);
    event RentClaimed(uint256 indexed tokenId, address indexed claimant, uint256 amount);

    constructor(address _propertyToken, address platformWallet) {
        propertyToken = IPropertyToken(_propertyToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PLATFORM_ROLE, platformWallet);
    }

    /// @notice Platform deposits rent for a property (in native token: ETH/MATIC/POL)
    function depositRent(uint256 tokenId) external payable onlyRole(PLATFORM_ROLE) {
        require(propertyToken.propertyExists(tokenId), "Property does not exist");
        require(msg.value > 0, "Must send rent amount");

        cumulativeRentPerProperty[tokenId] += msg.value;

        emit RentDeposited(tokenId, msg.value, cumulativeRentPerProperty[tokenId]);
    }

    /// @notice Calculate claimable rent for a user on a specific property
    function claimableRent(address user, uint256 tokenId) public view returns (uint256) {
        uint256 balance = propertyToken.balanceOf(user, tokenId);
        if (balance == 0) return 0;

        uint256 supply = propertyToken.totalSupply(tokenId);
        // Avoid division by zero if supply is somehow 0 (though unlikely with balance > 0)
        if (supply == 0) return 0;

        uint256 totalOwed = (cumulativeRentPerProperty[tokenId] * balance) / supply;
        uint256 alreadyClaimed = rentWithdrawn[tokenId][user];

        if (totalOwed > alreadyClaimed) {
            return totalOwed - alreadyClaimed;
        }
        return 0;
    }

    /// @notice Claim accumulated rent for a property
    function claimRent(uint256 tokenId) external nonReentrant {
        uint256 amount = claimableRent(msg.sender, tokenId);
        require(amount > 0, "Nothing to claim");

        rentWithdrawn[tokenId][msg.sender] += amount;
        payable(msg.sender).transfer(amount);

        emit RentClaimed(tokenId, msg.sender, amount);
    }

    /// @notice Claim rent from multiple properties in one transaction
    function batchClaimRent(uint256[] calldata tokenIds) external nonReentrant {
        uint256 totalAmount = 0;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 amount = claimableRent(msg.sender, tokenIds[i]);
            if (amount > 0) {
                rentWithdrawn[tokenIds[i]][msg.sender] += amount;
                totalAmount += amount;
                emit RentClaimed(tokenIds[i], msg.sender, amount);
            }
        }

        require(totalAmount > 0, "Nothing to claim");
        payable(msg.sender).transfer(totalAmount);
    }

    // Required to receive ETH (some patterns might need this)
    receive() external payable {}
}
