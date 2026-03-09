// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

contract PropertyToken is ERC1155, AccessControl, ReentrancyGuard, ERC1155Pausable, ERC1155Supply {

    bytes32 public constant PLATFORM_ROLE = keccak256("PLATFORM_ROLE");

    uint256 public constant TOKENS_PER_PROPERTY = 1000;
    uint256 constant MAGNITUDE = 2**128;

    // tokenId → whether the property has been created
    mapping(uint256 => bool) public propertyExists;

    // tokenId → metadata URI
    mapping(uint256 => string) private _tokenURIs;

    // ─── RENT DISTRIBUTION STATE ───
    // tokenId → magnified accumulated rent per share
    mapping(uint256 => uint256) public magnifiedRentPerShare;

    // tokenId → user → magnified rent debt
    mapping(uint256 => mapping(address => int256)) public magnifedRentDebt;

    // tokenId → user → withdrawn rent (for history/analytics)
    mapping(uint256 => mapping(address => uint256)) public rentWithdrawn;

    // Events
    event PropertyCreated(uint256 indexed tokenId, address indexed platformWallet, string metadataURI);
    event PropertyURIUpdated(uint256 indexed tokenId, string newURI);
    event RentDeposited(uint256 indexed tokenId, uint256 amount);
    event RentClaimed(uint256 indexed tokenId, address indexed claimant, uint256 amount);

    constructor(address platformWallet) ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PLATFORM_ROLE, platformWallet);
    }

    /// @notice Create a new property token.
    function createProperty(
        uint256 tokenId,
        string calldata metadataURI
    ) external onlyRole(PLATFORM_ROLE) {
        require(!propertyExists[tokenId], "Property already tokenized");

        propertyExists[tokenId] = true;
        _tokenURIs[tokenId] = metadataURI;

        // Mint all 1000 tokens to the platform
        // _mint calls _update, which handles debt logic
        _mint(msg.sender, tokenId, TOKENS_PER_PROPERTY, "");

        emit PropertyCreated(tokenId, msg.sender, metadataURI);
    }

    /// @notice Distribute tokens from platform to a buyer/owner
    function distributeTokens(
        address to,
        uint256 tokenId,
        uint256 amount
    ) external onlyRole(PLATFORM_ROLE) {
        require(propertyExists[tokenId], "Property does not exist");
        safeTransferFrom(msg.sender, to, tokenId, amount, "");
    }

    /// @notice Deposit rent for a property (Native Token)
    function depositRent(uint256 tokenId) external payable nonReentrant {
        require(propertyExists[tokenId], "Property does not exist");
        require(msg.value > 0, "Must send rent");

        uint256 supply = totalSupply(tokenId);
        require(supply > 0, "No tokens minted");

        magnifiedRentPerShare[tokenId] += (msg.value * MAGNITUDE) / supply;

        emit RentDeposited(tokenId, msg.value);
    }

    /// @notice View claimable rent for a user
    function claimableRent(address user, uint256 tokenId) public view returns (uint256) {
        uint256 supply = totalSupply(tokenId);
        if (supply == 0) return 0;

        uint256 accum = magnifiedRentPerShare[tokenId];
        int256 debt = magnifedRentDebt[tokenId][user];
        uint256 balance = balanceOf(user, tokenId);

        int256 accumulated = int256(accum * balance);
        int256 pending = accumulated - debt;

        if (pending < 0) return 0;
        return uint256(pending) / MAGNITUDE;
    }

    /// @notice Claim rent
    function claimRent(uint256 tokenId) external nonReentrant {
        uint256 pending = claimableRent(msg.sender, tokenId);
        require(pending > 0, "Nothing to claim");

        // Update debt to mark as claimed
        // "Claiming" is effectively resetting the debt to current accumulation
        // But since we use a strictly additive debt model for transfers, we can't just set debt = balance * acc
        // Instead, we increase debt by the amount claimed (converted to magnified)
        
        magnifedRentDebt[tokenId][msg.sender] += int256(pending * MAGNITUDE);
        
        rentWithdrawn[tokenId][msg.sender] += pending;
        payable(msg.sender).transfer(pending);

        emit RentClaimed(tokenId, msg.sender, pending);
    }

    /// @notice Internal hook to track ownership changes for rent logic
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Pausable, ERC1155Supply) {
        // Before transfer, update debt
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 tokenId = ids[i];
            uint256 amount = values[i];
            uint256 acc = magnifiedRentPerShare[tokenId];

            if (from != address(0)) {
                // Sender loses entitlement to future rent on this amount
                // debt -= amount * acc
                magnifedRentDebt[tokenId][from] -= int256(amount * acc);
            }

            if (to != address(0)) {
                // Receiver gains entitlement (but debt increases so they don't get PAST rent)
                // debt += amount * acc
                magnifedRentDebt[tokenId][to] += int256(amount * acc);
            }
        }

        super._update(from, to, ids, values);
    }

    // Boilerplate overrides
    function uri(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
