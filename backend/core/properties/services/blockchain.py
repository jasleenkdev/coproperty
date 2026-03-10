from django.conf import settings
from django.utils.timezone import now
from web3 import Web3
import json

# ==============================
# Web3 Setup
# ==============================

w3 = Web3(Web3.HTTPProvider(settings.RPC_URL))

with open(settings.CONTRACT_ABI_PATH) as f:
    artifact = json.load(f)
    contract_abi = artifact["abi"]

contract = w3.eth.contract(
    address=Web3.to_checksum_address(settings.CONTRACT_ADDRESS),
    abi=contract_abi
)

TOTAL_TOKENS = 1000


# ==============================
# Mint Tokens (Backend Controlled)
# ==============================


def mint_tokens(to_address, amount):
    try:
        to_address = Web3.to_checksum_address(to_address)
        amount = int(amount) * (10 ** 18)

        account = w3.eth.account.from_key(settings.PRIVATE_KEY)

        print("Contract address:", contract.address)
        print("MAX_SUPPLY:", contract.functions.MAX_SUPPLY().call())
        print("totalSupply:", contract.functions.totalSupply().call())
        print("Mint amount:", amount)
        nonce = w3.eth.get_transaction_count(account.address)

        txn = contract.functions.mint(
            to_address,
            amount
        ).build_transaction({
            "chainId": 31337,   # Hardhat local chain
            "from": account.address,
            "nonce": nonce,
        })

        signed_tx = w3.eth.account.sign_transaction(txn, settings.PRIVATE_KEY)

        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        if receipt.status != 1:
            raise Exception("Transaction reverted on-chain")

        return w3.to_hex(tx_hash)

    except Exception as e:
        raise Exception(f"Minting failed: {str(e)}")