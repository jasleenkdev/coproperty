from django.conf import settings
from django.utils.timezone import now
from web3 import Web3
import json

# ==============================
# Web3 Setup
# ==============================

w3 = Web3(Web3.HTTPProvider(settings.ALCHEMY_RPC_URL))

with open(settings.CONTRACT_ABI_PATH) as f:
    artifact = json.load(f)
    contract_abi = artifact["abi"]

contract = w3.eth.contract(
    address=settings.CONTRACT_ADDRESS,
    abi=contract_abi
)

TOTAL_TOKENS = 1000


# ==============================
# Mint Tokens (Backend Controlled)
# ==============================

def mint_tokens(to_address, amount):
    """
    Mints ERC-20 property tokens to a wallet address.
    Only backend owner wallet should call this.
    """

    nonce = w3.eth.get_transaction_count(settings.BACKEND_WALLET_ADDRESS)

    txn = contract.functions.mint(
        Web3.to_checksum_address(to_address),
        int(amount)
    ).build_transaction({
        "chainId": 80002,  # Polygon Amoy
        "gas": 200000,
        "gasPrice": w3.to_wei("30", "gwei"),
        "nonce": nonce,
    })

    signed_txn = w3.eth.account.sign_transaction(
        txn,
        private_key=settings.PRIVATE_KEY
    )

    tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)

    return w3.to_hex(tx_hash)


# ==============================
# Rent Distribution
# ==============================

def distribute_rent(property_obj):
    from properties.models import Ownership, RentPayout

    current_month = now().date().replace(day=1)

    net_rent = property_obj.monthly_rent - property_obj.maintenance_cost
    ownerships = Ownership.objects.filter(property=property_obj)

    for ownership in ownerships:
        share = ownership.tokens_owned / TOTAL_TOKENS
        payout_amount = round(share * net_rent, 2)

        RentPayout.objects.get_or_create(
            user=ownership.user,
            property=property_obj,
            month=current_month,
            defaults={'amount': payout_amount}
        )


# ==============================
# Governance Voting
# ==============================

def cast_vote(proposal, user, vote_choice):
    from properties.models import Ownership, Vote

    ownership = Ownership.objects.get(
        user=user,
        property=proposal.property
    )

    Vote.objects.create(
        proposal=proposal,
        user=user,
        vote=vote_choice,
        tokens_used=ownership.tokens_owned
    )


def proposal_result(proposal):
    from properties.models import Vote

    votes = Vote.objects.filter(proposal=proposal)

    votes_for = sum(v.tokens_used for v in votes if v.vote)
    votes_against = sum(v.tokens_used for v in votes if not v.vote)

    return {
        "votes_for": votes_for,
        "votes_against": votes_against,
        "approved": votes_for > votes_against
    }