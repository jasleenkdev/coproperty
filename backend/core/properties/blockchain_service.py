from web3 import Web3
from django.conf import settings
import json
import os

class BlockchainService:
    """Service layer for blockchain interactions from the Django backend."""

    def __init__(self):
        # Initialize Web3
        self.w3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL))
        
        # Load Account (if private key is set)
        if settings.PLATFORM_PRIVATE_KEY:
            self.account = self.w3.eth.account.from_key(settings.PLATFORM_PRIVATE_KEY)
        else:
            self.account = None

        # Load PropertyToken Contract
        try:
            with open(settings.PROPERTY_TOKEN_ABI_PATH) as f:
                property_abi = json.load(f)
            
            if settings.PROPERTY_TOKEN_ADDRESS:
                self.property_token = self.w3.eth.contract(
                    address=settings.PROPERTY_TOKEN_ADDRESS,
                    abi=property_abi
                )
            else:
                self.property_token = None
        except FileNotFoundError:
            print("Warning: ABI file not found. Blockchain service running in limited mode.")
            self.property_token = None

    def create_property_on_chain(self, property_id: int, metadata_uri: str) -> str:
        """Mint 1000 tokens for a new property. Returns tx hash."""
        if not self.property_token or not self.account:
            raise Exception("Blockchain service not configured")

        tx = self.property_token.functions.createProperty(
            property_id, metadata_uri
        ).build_transaction({
            'from': self.account.address,
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
            # Gas estimation is recommended in production
            'gas': 300000,
            'gasPrice': self.w3.eth.gas_price,
        })
        signed = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        return self.w3.to_hex(tx_hash)

    def distribute_tokens(self, to_address: str, property_id: int, amount: int) -> str:
        """Transfer tokens from platform to a buyer."""
        if not self.property_token or not self.account:
            raise Exception("Blockchain service not configured")

        tx = self.property_token.functions.distributeTokens(
            to_address, property_id, amount
        ).build_transaction({
            'from': self.account.address,
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
            'gas': 150000,
            'gasPrice': self.w3.eth.gas_price,
        })
        signed = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        return self.w3.to_hex(tx_hash)

    def deposit_rent(self, property_id: int, amount_wei: int) -> str:
        """Deposit rent for a property (Native Token)."""
        if not self.property_token or not self.account:
            raise Exception("Blockchain service not configured")
            
        tx = self.property_token.functions.depositRent(
            property_id
        ).build_transaction({
            'from': self.account.address,
            'value': amount_wei,
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
            'gas': 100000,
            'gasPrice': self.w3.eth.gas_price,
        })
        signed = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        return self.w3.to_hex(tx_hash)

    def get_balance(self, wallet_address: str, property_id: int) -> int:
        """Read token balance from blockchain."""
        if not self.property_token:
            return 0
        return self.property_token.functions.balanceOf(
            wallet_address, property_id
        ).call()
