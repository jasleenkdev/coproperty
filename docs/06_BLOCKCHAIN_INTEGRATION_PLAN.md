# 🔗 Blockchain Integration — Master Implementation Plan

> **CoProperty: From Database Simulation → Real On-Chain Tokenization**
>
> This document is the complete, production-grade blueprint for integrating real blockchain tokenization into the existing CoProperty platform. Every architectural decision, smart contract design, migration strategy, and implementation step is detailed below.

---

## Table of Contents

1. [Current System Analysis](#1-current-system-analysis)
2. [Token Standard Decision: ERC-20 vs ERC-721 vs ERC-1155](#2-token-standard-decision)
3. [Network Selection](#3-network-selection)
4. [Architecture Design](#4-architecture-design)
5. [Smart Contract Design](#5-smart-contract-design)
6. [Backend Integration (Django + Web3)](#6-backend-integration)
7. [Frontend Integration (React + ethers.js)](#7-frontend-integration)
8. [Migration Strategy: DB → Blockchain](#8-migration-strategy)
9. [Security Considerations](#9-security-considerations)
10. [Implementation Phases](#10-implementation-phases)
11. [Cost Analysis](#11-cost-analysis)
12. [Testing Strategy](#12-testing-strategy)
13. [Production Deployment Checklist](#13-production-deployment-checklist)

---

## 1. Current System Analysis

### What Exists Today

```
┌──────────────────────────────────────────────────────────────┐
│                     CURRENT ARCHITECTURE                     │
│                                                              │
│  React Frontend ──── REST API ──── Django Backend ──── SQLite │
│                                                              │
│  Ownership = Database row (tokens_owned INTEGER)             │
│  Governance = Database row (Vote model)                      │
│  Rent = Database row (RentPayout model)                      │
│                                                              │
│  ⚠ Everything is simulated. Nothing is on-chain.             │
└──────────────────────────────────────────────────────────────┘
```

### Current Models & Their Blockchain Equivalents

| Django Model | Current Role | Blockchain Equivalent |
|---|---|---|
| `Property` | Stores property metadata | Token metadata (on-chain URI → off-chain JSON) |
| `Ownership` | `user × property × tokens_owned` | ERC-1155 `balanceOf(address, tokenId)` |
| `RentPayout` | Monthly payout records | `RentDistributor` smart contract |
| `Proposal` | Governance proposals | `GovernanceDAO` smart contract |
| `Vote` | Token-weighted votes | On-chain voting with `Governor` pattern |

### Key Constants

- **TOTAL_TOKENS = 1000** per property (hardcoded in `services.py`)
- **Ownership** → tracked via `Ownership.tokens_owned` (PositiveIntegerField)
- **Rent distribution** → `distribute_rent()` calculates share as `tokens_owned / 1000`
- **Vote weight** → `cast_vote()` uses `ownership.tokens_owned` as weight

All of these map perfectly to on-chain token balances.

---

## 2. Token Standard Decision

### The Three Contenders

#### Option A: ERC-20 (One Contract Per Property)

```
Property A → Deploy ERC20_A.sol (supply: 1000 PROPA)
Property B → Deploy ERC20_B.sol (supply: 1000 PROPB)
Property C → Deploy ERC20_C.sol (supply: 1000 PROPC)
```

| Pros | Cons |
|---|---|
| Simple, well-understood | One deploy per property (~$5-15 on L2) |
| Native DEX compatibility (Uniswap) | Managing N contracts is complex |
| Wallets display ERC-20 natively | No batch operations |
| Each token has its own ticker | Higher total gas overhead |

#### Option B: ERC-721 (NFTs)

```
Each property → 1000 unique NFTs (tokenId 1–1000)
Owner of NFT #42 of Property A = owns 0.1%
```

| Pros | Cons |
|---|---|
| Each share is unique, sellable on OpenSea | 1000 NFTs per property = huge gas |
| Rich metadata per share | Fractional ownership is unnatural |
| Visual marketplace appeal | Can't own 0.5 of an NFT |
| | Terrible for rent distribution (iterate 1000 NFTs) |

#### Option C: ERC-1155 (Semi-Fungible — RECOMMENDED ✅)

```
Single Contract:
  tokenId=1 (Property A) → 1000 fungible tokens
  tokenId=2 (Property B) → 1000 fungible tokens
  tokenId=3 (Property C) → 1000 fungible tokens
```

| Pros | Cons |
|---|---|
| Single contract for ALL properties | Slightly less DEX support than ERC-20 |
| Gas efficient (batch mint, batch transfer) | Wallets may not display as nicely |
| Each property = unique tokenId | Requires ERC-20 wrapper for DEX trading |
| Fungible within same property (shares are interchangeable) | |
| Non-fungible across properties (each property is unique) | |
| Matches current system PERFECTLY (tokenId = property.id, supply = 1000) | |
| Industry standard for gaming/RWA multi-asset contracts | |

### ✅ VERDICT: ERC-1155

**ERC-1155 is the production-correct choice** for this system because:

1. **Perfect mapping**: `tokenId` = `property.id`, `amount` = `tokens_owned`, `supply` = 1000 — maps 1:1 to the existing data model
2. **Single contract**: Deploy once, manage all properties forever. No per-property deployment cost
3. **Gas efficiency**: Batch minting, batch transfers. When creating a property and distributing to 10 owners, one batch call instead of 10 separate calls
4. **Extensibility**: Can add properties indefinitely without new contracts
5. **Rent distribution**: `balanceOf(owner, tokenId)` gives the exact share — same math as current `services.py`
6. **Future: ERC-20 wrappers**: If DEX trading is needed later, wrap individual tokenIds as ERC-20 using a wrapper contract (well-established pattern)

> **For advanced production (Phase 3+)**: Consider deploying individual ERC-20 wrapper contracts per property to enable DEX liquidity. This is the pattern used by Centrifuge, RealT, and other institutional RWA platforms. But for Phase 1-2, ERC-1155 alone is sufficient.

---

## 3. Network Selection

### Comparison

| Feature | Ethereum Sepolia | Polygon Amoy | Base Sepolia |
|---|---|---|---|
| Block time | ~12s | ~2s | ~2s |
| Gas cost (mainnet) | $2-50/tx | $0.001-0.01/tx | $0.001-0.01/tx |
| RWA ecosystem | Growing | Strongest (RealT, Centrifuge) | Growing fast |
| Faucet availability | Easy | Moderate | Easy |
| Production readiness | Ethereum mainnet | Polygon PoS / zkEVM | Base mainnet |
| MetaMask support | Native | Add network | Add network |

### ✅ RECOMMENDATION: Dual-Target

| Phase | Network | Reason |
|---|---|---|
| Development & Testing | **Sepolia** (Ethereum testnet) | Easiest faucets, most tutorials, native MetaMask |
| Staging & Pre-prod | **Polygon Amoy** (Polygon testnet) | Realistic gas costs, faster confirmations |
| Production | **Polygon PoS** (or zkEVM) | $0.001/tx, ideal for frequent rent distributions |

The smart contracts and tooling will be **network-agnostic** — same Solidity, same ABI, deploy to any EVM chain by changing one config line.

---

## 4. Architecture Design

### Target Architecture (Hybrid On-Chain/Off-Chain)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          TARGET ARCHITECTURE                                 │
│                                                                              │
│  ┌─────────────────┐     ┌─────────────────┐     ┌──────────────────────┐   │
│  │  React Frontend  │     │  Django Backend  │     │   Blockchain (L2)    │   │
│  │                  │     │                  │     │                      │   │
│  │  ethers.js ──────────────────────────────────── │  PropertyToken.sol   │   │
│  │  (direct reads)  │     │                  │     │  (ERC-1155)          │   │
│  │                  │     │  web3.py ─────────────  │                      │   │
│  │  MetaMask ───────────── │  (admin writes)  │     │  RentDistributor.sol │   │
│  │  (user signs tx) │     │                  │     │  (rent claims)       │   │
│  │                  │     │  Event Listener ──────  │                      │   │
│  │  REST API ─────────────  │  (sync → DB cache)│     │  GovernanceDAO.sol   │   │
│  │  (off-chain data)│     │                  │     │  (on-chain voting)   │   │
│  └─────────────────┘     └─────────────────┘     └──────────────────────┘   │
│                                                                              │
│  SOURCE OF TRUTH:                                                            │
│    Ownership    → Blockchain (ERC-1155 balanceOf)                            │
│    Property data → Django DB (name, location, rent, etc.)                    │
│    Rent history → Blockchain + DB cache                                      │
│    Governance   → Blockchain (Phase 3)                                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Who Reads/Writes What

| Operation | Frontend | Backend | Blockchain |
|---|---|---|---|
| View property list | Reads from Django API | Serves from DB | — |
| View ownership | Reads from blockchain via ethers.js | Serves cached data | Source of truth |
| Transfer tokens | Signs tx via MetaMask | Event listener syncs DB | Executes transfer |
| Create property | Calls Django API | Calls contract via web3.py | Mints 1000 tokens |
| Distribute rent | Triggers via UI | Deposits rent on-chain | Distributes proportionally |
| Vote on proposal | Signs tx via MetaMask | Event listener records | Executes on-chain vote |

### Key Design Principle: Hybrid Architecture

> **Blockchain = Source of Truth for ownership and financial state**
> **Django DB = Fast cache + off-chain metadata (property names, images, descriptions)**
>
> This is the same architecture used by OpenSea, Rarible, Zora, and every production NFT/RWA platform. Pure on-chain reads are too slow for UIs; pure off-chain storage defeats the purpose of blockchain. The hybrid approach gives you both trust and speed.

---

## 5. Smart Contract Design

### Contract 1: PropertyToken.sol (Core — Phase 1)

The main ERC-1155 contract managing all property tokens.

```solidity
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

    // tokenId → whether the property has been created
    mapping(uint256 => bool) public propertyExists;

    // tokenId → metadata URI (JSON on IPFS or centralized server)
    mapping(uint256 => string) private _tokenURIs;

    // Events
    event PropertyCreated(uint256 indexed tokenId, address indexed platformWallet, string metadataURI);
    event PropertyURIUpdated(uint256 indexed tokenId, string newURI);

    constructor(address platformWallet) ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PLATFORM_ROLE, platformWallet);
    }

    /// @notice Create a new property token.
    ///         Mints 1000 tokens to the platform wallet for distribution.
    /// @param tokenId  Must match the Django Property.id
    /// @param metadataURI  IPFS or HTTPS link to property metadata JSON
    function createProperty(
        uint256 tokenId,
        string calldata metadataURI
    ) external onlyRole(PLATFORM_ROLE) {
        require(!propertyExists[tokenId], "Property already tokenized");

        propertyExists[tokenId] = true;
        _tokenURIs[tokenId] = metadataURI;

        // Mint all 1000 tokens to the platform for later distribution
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

    /// @notice Batch distribute to multiple owners at once (gas efficient)
    function batchDistribute(
        address[] calldata recipients,
        uint256 tokenId,
        uint256[] calldata amounts
    ) external onlyRole(PLATFORM_ROLE) {
        require(recipients.length == amounts.length, "Length mismatch");
        require(propertyExists[tokenId], "Property does not exist");

        for (uint256 i = 0; i < recipients.length; i++) {
            safeTransferFrom(msg.sender, recipients[i], tokenId, amounts[i], "");
        }
    }

    /// @notice Update property metadata URI
    function setPropertyURI(
        uint256 tokenId,
        string calldata newURI
    ) external onlyRole(PLATFORM_ROLE) {
        require(propertyExists[tokenId], "Property does not exist");
        _tokenURIs[tokenId] = newURI;
        emit PropertyURIUpdated(tokenId, newURI);
    }

    /// @notice Returns the metadata URI for a given tokenId
    function uri(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    // ─── Required Overrides ─────────────────────────────

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Pausable, ERC1155Supply) {
        super._update(from, to, ids, values);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
```

**Design Decisions Explained:**

| Decision | Why |
|---|---|
| `tokenId = Property.id` | Maps directly to Django model, zero translation needed |
| `TOKENS_PER_PROPERTY = 1000` | Matches existing `TOTAL_TOKENS = 1000` in `services.py` |
| `PLATFORM_ROLE` | Only the platform can create properties and distribute initial tokens |
| `ERC1155Supply` | Tracks `totalSupply(tokenId)` on-chain — needed for rent calculation |
| `ERC1155Pausable` | Emergency stop for security incidents |
| `ReentrancyGuard` | Prevents reentrancy in future payable functions |
| `_mint to platform` | Platform holds all 1000 tokens initially, distributes to buyers |
| `batchDistribute` | Distribute to 10 owners in 1 tx instead of 10 txs |

### Contract 2: RentDistributor.sol (Phase 2)

The rent distribution contract uses a **pull pattern** — ownership snapshots + claimable balances, avoiding push-based gas bombs.

```solidity
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
        uint256 totalOwed = (cumulativeRentPerProperty[tokenId] * balance) / supply;
        uint256 alreadyClaimed = rentWithdrawn[tokenId][user];

        return totalOwed > alreadyClaimed ? totalOwed - alreadyClaimed : 0;
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
}
```

**Design Decisions Explained:**

| Decision | Why |
|---|---|
| Pull pattern (users claim) | Push pattern = O(n) gas for n owners, can hit block gas limit |
| Cumulative accounting | Owners can claim at any time; no snapshots needed; mathematically correct even if ownership changes |
| `nonReentrant` | Prevents reentrancy attack on `transfer()` call |
| Native token (ETH/MATIC) | Simplest for testnet; upgrade to USDC/USDT for production |
| `batchClaimRent` | User owns 5 properties? One tx to claim all rent |

> **IMPORTANT NOTE ON CUMULATIVE ACCOUNTING**: The cumulative model has a subtlety — if a user sells tokens and then buys them back, their `rentWithdrawn` counter may be inaccurate. For production, consider implementing **checkpoint-based accounting** using OpenZeppelin's `ERC1155Snapshot` pattern or a per-distribution epoch system. For the MVP/testnet, the cumulative model is sufficient because token transfers will be controlled through the platform.

### Contract 3: GovernanceDAO.sol (Phase 3 — Future)

On-chain governance using token-weighted voting.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Simplified design — full implementation in Phase 3
contract GovernanceDAO {

    IPropertyToken public propertyToken;

    struct Proposal {
        uint256 tokenId;        // Which property this proposal is for
        string title;
        string description;
        uint256 votesFor;       // Token-weighted
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;

    // Create proposal — must own tokens in the property
    function createProposal(uint256 tokenId, string calldata title, string calldata description, uint256 duration) external { ... }

    // Vote — weight = balanceOf(voter, tokenId)
    function vote(uint256 proposalId, bool support) external { ... }

    // Execute — if votesFor > votesAgainst and deadline passed
    function executeProposal(uint256 proposalId) external { ... }
}
```

> This is intentionally left as a skeleton. Phase 3 implementation will use OpenZeppelin's `Governor` framework adapted for ERC-1155 token-weighted voting.

---

## 6. Backend Integration

### New Django Components

#### 6.1 New Model: WalletProfile

Links Django users to Ethereum wallet addresses.

```python
# properties/models.py — NEW MODEL

class WalletProfile(models.Model):
    """Links a Django user to their blockchain wallet address."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    wallet_address = models.CharField(max_length=42, unique=True)  # 0x + 40 hex chars
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} → {self.wallet_address}"

    def clean(self):
        # Validate Ethereum address format
        import re
        if not re.match(r'^0x[0-9a-fA-F]{40}$', self.wallet_address):
            raise ValidationError("Invalid Ethereum address format")
```

#### 6.2 New Service: blockchain_service.py

The bridge between Django and the blockchain.

```python
# properties/blockchain_service.py — NEW FILE

from web3 import Web3
from django.conf import settings
import json

class BlockchainService:
    """Service layer for blockchain interactions from the Django backend."""

    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL))
        self.account = self.w3.eth.account.from_key(settings.PLATFORM_PRIVATE_KEY)

        # Load contract ABIs
        with open(settings.PROPERTY_TOKEN_ABI_PATH) as f:
            property_abi = json.load(f)
        with open(settings.RENT_DISTRIBUTOR_ABI_PATH) as f:
            rent_abi = json.load(f)

        self.property_token = self.w3.eth.contract(
            address=settings.PROPERTY_TOKEN_ADDRESS,
            abi=property_abi
        )
        self.rent_distributor = self.w3.eth.contract(
            address=settings.RENT_DISTRIBUTOR_ADDRESS,
            abi=rent_abi
        )

    def create_property_on_chain(self, property_id: int, metadata_uri: str) -> str:
        """Mint 1000 tokens for a new property. Returns tx hash."""
        tx = self.property_token.functions.createProperty(
            property_id, metadata_uri
        ).build_transaction({
            'from': self.account.address,
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
            'gas': 300000,
        })
        signed = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        return tx_hash.hex()

    def get_balance(self, wallet_address: str, property_id: int) -> int:
        """Read token balance from blockchain."""
        return self.property_token.functions.balanceOf(
            wallet_address, property_id
        ).call()

    def distribute_tokens(self, to_address: str, property_id: int, amount: int) -> str:
        """Transfer tokens from platform to a buyer."""
        tx = self.property_token.functions.distributeTokens(
            to_address, property_id, amount
        ).build_transaction({
            'from': self.account.address,
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
            'gas': 150000,
        })
        signed = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        return tx_hash.hex()

    def deposit_rent(self, property_id: int, amount_wei: int) -> str:
        """Deposit rent for a property into the distributor contract."""
        tx = self.rent_distributor.functions.depositRent(
            property_id
        ).build_transaction({
            'from': self.account.address,
            'value': amount_wei,
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
            'gas': 100000,
        })
        signed = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        return tx_hash.hex()
```

#### 6.3 Settings Updates

```python
# core/settings.py — ADD THESE

# ─── Blockchain Configuration ───
BLOCKCHAIN_RPC_URL = os.environ.get('BLOCKCHAIN_RPC_URL', 'https://sepolia.infura.io/v3/YOUR_KEY')
PLATFORM_PRIVATE_KEY = os.environ.get('PLATFORM_PRIVATE_KEY', '')  # NEVER hardcode!
PROPERTY_TOKEN_ADDRESS = os.environ.get('PROPERTY_TOKEN_ADDRESS', '')
RENT_DISTRIBUTOR_ADDRESS = os.environ.get('RENT_DISTRIBUTOR_ADDRESS', '')
PROPERTY_TOKEN_ABI_PATH = BASE_DIR / 'contracts' / 'PropertyToken.json'
RENT_DISTRIBUTOR_ABI_PATH = BASE_DIR / 'contracts' / 'RentDistributor.json'
```

#### 6.4 Event Listener (Blockchain → DB Sync)

A management command that listens to on-chain Transfer events and syncs ownership to the DB cache.

```python
# properties/management/commands/sync_blockchain.py — NEW FILE

class Command(BaseCommand):
    """Listen to blockchain events and sync ownership state to DB."""

    def handle(self, *args, **options):
        service = BlockchainService()

        # Listen for TransferSingle and TransferBatch events
        transfer_filter = service.property_token.events.TransferSingle.create_filter(fromBlock='latest')

        while True:
            for event in transfer_filter.get_new_entries():
                self._process_transfer(event)
            time.sleep(2)  # Poll every 2 seconds

    def _process_transfer(self, event):
        token_id = event.args['id']
        from_addr = event.args['from']
        to_addr = event.args['to']
        amount = event.args['value']

        # Update Ownership records in DB cache
        # ... (decrease from_addr, increase to_addr)
```

---

## 7. Frontend Integration

### New Frontend Components & Libraries

#### 7.1 Dependencies

```json
{
  "ethers": "^6.13.0",
  "@metamask/sdk-react": "^0.28.0"
}
```

#### 7.2 Wallet Connection Context

```
frontend/app/src/
├── blockchain/
│   ├── config.js          # Contract addresses, ABIs, chain config
│   ├── WalletContext.js   # React context for wallet state
│   ├── usePropertyToken.js  # Hook for PropertyToken contract reads/writes
│   └── useRentDistributor.js # Hook for RentDistributor contract
├── components/
│   ├── WalletConnect.js   # MetaMask connect/disconnect button
│   ├── TokenBalance.js    # Show on-chain token balance
│   ├── TransferTokens.js  # Transfer tokens to another wallet
│   └── ClaimRent.js       # Claim accumulated rent
```

#### 7.3 Core Wallet Flow

```javascript
// blockchain/WalletContext.js — Simplified example

import { createContext, useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import PropertyTokenABI from './abis/PropertyToken.json';
import { PROPERTY_TOKEN_ADDRESS, CHAIN_CONFIG } from './config';

export const WalletContext = createContext();

export function WalletProvider({ children }) {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [propertyToken, setPropertyToken] = useState(null);

    async function connectWallet() {
        if (!window.ethereum) {
            alert("Install MetaMask!");
            return;
        }

        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();

        // Ensure correct network
        const network = await provider.getNetwork();
        if (network.chainId !== CHAIN_CONFIG.chainId) {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: CHAIN_CONFIG.chainIdHex }],
            });
        }

        const contract = new Contract(PROPERTY_TOKEN_ADDRESS, PropertyTokenABI, signer);

        setProvider(provider);
        setAccount(accounts[0]);
        setPropertyToken(contract);
    }

    return (
        <WalletContext.Provider value={{ account, provider, propertyToken, connectWallet }}>
            {children}
        </WalletContext.Provider>
    );
}
```

#### 7.4 Reading Ownership from Blockchain

```javascript
// blockchain/usePropertyToken.js

export function usePropertyToken() {
    const { propertyToken, account } = useContext(WalletContext);

    async function getBalance(propertyId) {
        if (!propertyToken || !account) return 0;
        const balance = await propertyToken.balanceOf(account, propertyId);
        return Number(balance);  // BigInt → Number (safe for ≤1000)
    }

    async function getOwnershipPercentage(propertyId) {
        const balance = await getBalance(propertyId);
        return (balance / 1000) * 100;  // Same math as current services.py
    }

    return { getBalance, getOwnershipPercentage };
}
```

---

## 8. Migration Strategy

### The Critical Question: How to Transition?

The existing system has data in the DB. Blockchain is empty. How do we bridge?

### Phase 1: Parallel Mode (Recommended Start)

```
┌──────────────────────────────────────────────────────┐
│                  PARALLEL MODE                        │
│                                                       │
│  Frontend reads from:                                 │
│    ├── Django API (existing — always works)            │
│    └── Blockchain (new — when wallet connected)        │
│                                                       │
│  Ownership data:                                      │
│    ├── DB: Existing Ownership model (unchanged)        │
│    └── Chain: ERC-1155 balances (new, synced)          │
│                                                       │
│  No breaking changes. Gradual migration.               │
└──────────────────────────────────────────────────────┘
```

**Step-by-step migration:**

1. Deploy contracts to testnet
2. Add `WalletProfile` model — users link their wallets
3. For each existing `Ownership` record with a linked wallet:
   - Platform distributes tokens on-chain: `distributeTokens(wallet, propertyId, amount)`
4. Frontend shows **both** DB and on-chain balances during transition
5. New ownership changes go through blockchain first, sync to DB second
6. Eventually, mark Ownership model as "cache only" — blockchain is source of truth

### Phase 2: Blockchain-Primary Mode

```
┌──────────────────────────────────────────────────────┐
│              BLOCKCHAIN-PRIMARY MODE                  │
│                                                       │
│  Ownership: Read from blockchain (ERC-1155)            │
│  Property metadata: Read from Django API               │
│  Rent distribution: On-chain (RentDistributor)         │
│  Governance: On-chain (GovernanceDAO)                  │
│                                                       │
│  Django DB Ownership model = cache only,               │
│  synced via event listener                             │
└──────────────────────────────────────────────────────┘
```

---

## 9. Security Considerations

### Smart Contract Security

| Threat | Mitigation |
|---|---|
| Reentrancy | `ReentrancyGuard` on all state-changing + payable functions |
| Unauthorized minting | `AccessControl` with `PLATFORM_ROLE` — only platform can mint/distribute |
| Integer overflow | Solidity ^0.8.20 has built-in overflow protection |
| Flash loan manipulation | Not applicable (no AMM/price oracle) |
| Front-running | Low risk for rent claims; consider commit-reveal for governance |
| Private key compromise | Use multi-sig (Gnosis Safe) for platform wallet in production |
| Contract upgrade bugs | Use UUPS proxy pattern; test upgrades on testnet first |
| Gas limit DoS | Pull pattern for rent (users claim, no iteration over holders) |

### Backend Security

| Threat | Mitigation |
|---|---|
| Private key exposure | Store in environment variable, NEVER in code or DB |
| RPC endpoint abuse | Use authenticated RPC (Infura/Alchemy with API key) |
| DB ↔ Chain desync | Event listener with retry logic; periodic reconciliation job |
| Admin key compromise | Multi-sig wallet; time-locked admin operations |

### Frontend Security

| Threat | Mitigation |
|---|---|
| Phishing (fake MetaMask popup) | Verify contract addresses in UI; use ENS names |
| Man-in-the-middle on RPC | Use HTTPS RPC endpoints only |
| Malicious contract interaction | Validate all transaction parameters before signing |

---

## 10. Implementation Phases

### 📦 Phase 1: Smart Contracts + Basic Integration (2-3 weeks)

| Step | Task | Details |
|---|---|---|
| 1.1 | Set up Hardhat project | `npx hardhat init` in `coproperty/blockchain/` |
| 1.2 | Install OpenZeppelin | `npm install @openzeppelin/contracts` |
| 1.3 | Write `PropertyToken.sol` | ERC-1155 with AccessControl, Pausable, Supply |
| 1.4 | Write unit tests | 100% coverage on create, mint, transfer, batch |
| 1.5 | Deploy to Sepolia | Via Hardhat deploy script |
| 1.6 | Verify on Etherscan | `npx hardhat verify` |
| 1.7 | Add `WalletProfile` model to Django | Migration `0007` |
| 1.8 | Create `blockchain_service.py` | Web3.py bridge service |
| 1.9 | Add wallet connect button to React | ethers.js + MetaMask |
| 1.10 | Read on-chain balances in UI | Show alongside DB data |

### 🔗 Phase 2: Rent Distribution On-Chain (1-2 weeks)

| Step | Task | Details |
|---|---|---|
| 2.1 | Write `RentDistributor.sol` | Pull-based rent claiming |
| 2.2 | Test rent distribution | Unit tests + integration tests |
| 2.3 | Deploy to Sepolia | Linked to PropertyToken |
| 2.4 | Add rent deposit API | Django endpoint → on-chain deposit |
| 2.5 | Add claim rent UI | React component with MetaMask signing |
| 2.6 | Add event listener | Sync rent events to DB for history display |

### 🗳️ Phase 3: On-Chain Governance (2-3 weeks)

| Step | Task | Details |
|---|---|---|
| 3.1 | Write `GovernanceDAO.sol` | Token-weighted voting |
| 3.2 | Adapt existing proposal UI | Replace DB voting with on-chain |
| 3.3 | Add proposal creation on-chain | MetaMask → create proposal tx |
| 3.4 | Add voting on-chain | MetaMask → vote tx (weight = token balance) |
| 3.5 | Proposal execution | Time-locked execution after quorum |

### 🚀 Phase 4: Production Hardening (2-3 weeks)

| Step | Task | Details |
|---|---|---|
| 4.1 | Audit smart contracts | Professional audit or automated (Slither, Mythril) |
| 4.2 | Deploy to Polygon mainnet | Production deployment |
| 4.3 | Multi-sig platform wallet | Gnosis Safe setup |
| 4.4 | Upgrade proxy pattern | UUPS for contract upgradability |
| 4.5 | Monitoring & alerting | Block explorer + custom dashboard |
| 4.6 | SIWE (Sign-In with Ethereum) | Replace Django auth with wallet-based auth |

---

## 11. Cost Analysis

### Gas Costs (Estimated)

| Operation | Gas Units | Polygon PoS ($) | Ethereum ($) |
|---|---|---|---|
| Deploy PropertyToken | ~3,000,000 | $0.03 | $15-30 |
| Deploy RentDistributor | ~2,000,000 | $0.02 | $10-20 |
| Create property (mint 1000) | ~150,000 | $0.002 | $1-2 |
| Transfer tokens | ~60,000 | $0.001 | $0.50-1 |
| Batch distribute (10 users) | ~300,000 | $0.003 | $3-5 |
| Deposit rent | ~80,000 | $0.001 | $0.50-1 |
| Claim rent | ~60,000 | $0.001 | $0.50-1 |
| On-chain vote | ~80,000 | $0.001 | $0.50-1 |

> **Conclusion**: On Polygon, the entire system can operate for pennies per transaction. On Ethereum mainnet, costs are prohibitive for frequent operations like rent distribution. **Polygon (or any L2) is the clear production choice.**

### Infrastructure Costs

| Service | Free Tier | Paid |
|---|---|---|
| Infura/Alchemy RPC | 100K requests/day | $49-199/month |
| IPFS (Pinata) | 500MB + 200 files | $20/month |
| Etherscan verification | Free | Free |
| Gnosis Safe (multi-sig) | Free | Free |

---

## 12. Testing Strategy

### Smart Contract Tests (Hardhat + Chai)

```
tests/
├── PropertyToken.test.js
│   ├── Deployment
│   │   ├── Should set correct roles
│   │   └── Should have zero initial supply
│   ├── createProperty
│   │   ├── Should mint 1000 tokens to platform
│   │   ├── Should emit PropertyCreated event
│   │   ├── Should revert if property already exists
│   │   └── Should revert if caller lacks PLATFORM_ROLE
│   ├── distributeTokens
│   │   ├── Should transfer correct amount
│   │   ├── Should update balances
│   │   └── Should revert if insufficient balance
│   └── Access Control
│       ├── Should prevent unauthorized minting
│       └── Should allow admin to grant roles
│
├── RentDistributor.test.js
│   ├── depositRent
│   │   ├── Should accept ETH and update cumulative
│   │   └── Should revert for non-existent property
│   ├── claimRent
│   │   ├── Should pay proportional to token balance
│   │   ├── Should handle multiple claims correctly
│   │   └── Should revert when nothing to claim
│   └── Edge Cases
│       ├── Should handle ownership transfer between deposits
│       └── Should handle zero-balance users
```

### Integration Tests

```
Backend:
  - blockchain_service.py → testnet contract interaction
  - Event listener → verify DB sync after on-chain transfer
  - API endpoint → verify response includes on-chain data

Frontend:
  - WalletConnect → connects to MetaMask
  - Token balance → reads correct balance from contract
  - Transfer → sends correct transaction
```

---

## 13. Production Deployment Checklist

```
Pre-Launch:
  □ Smart contracts audited (automated + manual)
  □ All tests passing (100% coverage on critical paths)
  □ Multi-sig wallet configured (Gnosis Safe)
  □ UUPS proxy deployed (for upgradability)
  □ Contract verified on block explorer
  □ RPC provider configured (Alchemy/Infura production plan)
  □ Private keys secured (HSM or cloud KMS)
  □ Rate limiting on blockchain API endpoints
  □ Event listener resilient (handles reorgs, missed blocks)
  □ Monitoring dashboard (Tenderly or custom)
  □ Incident response plan documented

Post-Launch:
  □ Monitor gas usage and optimize if needed
  □ Regular reconciliation: DB cache vs on-chain state
  □ Bug bounty program
  □ Community governance bootstrap
```

---

## Directory Structure (Final)

```
coproperty/
├── blockchain/                         # ← NEW: Hardhat project
│   ├── contracts/
│   │   ├── PropertyToken.sol           # ERC-1155 ownership
│   │   ├── RentDistributor.sol         # Rent distribution
│   │   └── GovernanceDAO.sol           # Phase 3
│   ├── scripts/
│   │   ├── deploy.js                   # Deploy to testnet/mainnet
│   │   └── verify.js                   # Etherscan verification
│   ├── test/
│   │   ├── PropertyToken.test.js
│   │   └── RentDistributor.test.js
│   ├── hardhat.config.js
│   ├── package.json
│   └── .env                            # RPC URL, deployer private key
│
├── backend/
│   └── core/
│       ├── contracts/                  # ← NEW: ABI files for web3.py
│       │   ├── PropertyToken.json
│       │   └── RentDistributor.json
│       └── properties/
│           ├── models.py               # + WalletProfile model
│           ├── blockchain_service.py   # ← NEW: Web3 bridge
│           ├── management/
│           │   └── commands/
│           │       └── sync_blockchain.py  # ← NEW: Event listener
│           └── ...
│
├── frontend/
│   └── app/
│       └── src/
│           ├── blockchain/             # ← NEW: Blockchain layer
│           │   ├── config.js
│           │   ├── WalletContext.js
│           │   ├── abis/
│           │   │   ├── PropertyToken.json
│           │   │   └── RentDistributor.json
│           │   ├── usePropertyToken.js
│           │   └── useRentDistributor.js
│           ├── components/
│           │   ├── WalletConnect.js     # ← NEW
│           │   ├── TokenBalance.js      # ← NEW
│           │   ├── ClaimRent.js         # ← NEW
│           │   └── ...
│           └── ...
│
├── Moti/                               # Documentation
│   ├── 01_PROJECT_OVERVIEW.md
│   ├── 02_ARCHITECTURE_DEEPDIVE.md
│   ├── 03_CODE_ISSUES_AUDIT.md
│   ├── 04_FILE_BY_FILE_ANALYSIS.md
│   ├── 05_ROADMAP_AND_RECOMMENDATIONS.md
│   └── 06_BLOCKCHAIN_INTEGRATION_PLAN.md  ← THIS FILE
│
└── data/
    └── properties.json
```

---

## Summary: What Makes This Production-Correct

| Decision | Why It's Right |
|---|---|
| ERC-1155 over ERC-20/721 | Single contract, gas efficient, perfect fit for multi-property fractional ownership |
| Hybrid architecture | Blockchain for trust, DB for speed — same as OpenSea/Rarible |
| Pull-based rent distribution | O(1) gas per claim vs O(n) for push distribution |
| Polygon for production | $0.001/tx makes frequent rent distribution viable |
| UUPS proxy | Upgradability without redeployment |
| Multi-sig platform wallet | No single point of failure |
| Event listener → DB sync | Fast reads from DB, truth from chain |
| Phased rollout | Parallel mode first → no breaking changes |

> **This plan transforms CoProperty from a database simulation into a real blockchain-powered fractional ownership platform, without breaking anything that already works.**
