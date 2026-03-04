from web3 import Web3
import os

w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
private_key = os.getenv("DEPLOYER_PRIVATE_KEY")
account = w3.eth.account.from_key(private_key)

def mint_tokens(contract_address, abi, to_wallet, amount):
    contract = w3.eth.contract(address=contract_address, abi=abi)

    txn = contract.functions.mint(
        to_wallet,
        amount
    ).build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "gas": 200000,
        "gasPrice": w3.to_wei("1", "gwei"),
        "chainId": 31337
    })

    signed_txn = account.sign_transaction(txn)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)

    return tx_hash.hex()