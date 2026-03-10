from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import ProposalSerializer
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db.models import Sum
from eth_account.messages import encode_defunct
from eth_account import Account
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import IntegrityError

from .models import (
    Property,
    Ownership,
    RentPayout,
    Proposal,
    Vote,
    WalletNonce,
    WalletUser
)

from .serializers import (
    PropertySerializer,
    OwnershipSerializer,
    RentPayoutSerializer
)

from properties.services.blockchain import mint_tokens

import secrets


# ========================= BUY TOKENS =========================

@api_view(['POST'])
def buy_tokens(request, pk):
    try:
        property_obj = get_object_or_404(Property, pk=pk)

        wallet_address = request.data.get("wallet_address")
        amount = int(request.data.get("amount"))

        if amount <= 0:
            return Response(
                {"error": "Invalid token amount"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Call mint ONLY ONCE
        try:
            tx_hash = mint_tokens(wallet_address, amount)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

        user = request.user if request.user.is_authenticated else User.objects.first()

        ownership, created = Ownership.objects.get_or_create(
        wallet_address=wallet_address,
        property=property_obj,
        defaults={"tokens_owned": amount}
        )


        if not created:
            ownership.tokens_owned += amount
            ownership.save()

        return Response({
            "message": "Tokens minted successfully",
            "tx_hash": tx_hash,
            "tokens_owned": ownership.tokens_owned
        })

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ========================= AUTH =========================

@api_view(['GET'])
def get_nonce(request):
    wallet = request.GET.get('wallet')
    nonce = secrets.token_hex(16)

    WalletNonce.objects.update_or_create(
        wallet_address=wallet,
        defaults={'nonce': nonce}
    )

    return Response({'nonce': nonce})


@api_view(['POST'])
def wallet_login(request):
    wallet = request.data.get("wallet_address")
    signature = request.data.get("signature")

    nonce_obj = WalletNonce.objects.get(wallet_address=wallet)

    message = encode_defunct(text=nonce_obj.nonce)
    recovered_address = Account.recover_message(message, signature=signature)

    if recovered_address.lower() != wallet.lower():
        return Response({"error": "Invalid signature"}, status=400)

    user = nonce_obj.get_or_create_user()
    refresh = RefreshToken.for_user(user)

    return Response({
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    })


# ========================= PROPERTY =========================

@api_view(['GET'])
def property_list(request):
    properties = Property.objects.all()
    print(properties)
    serializer = PropertySerializer(properties, many=True)
    print(serializer.data)
    return Response(serializer.data)
@api_view(['POST'])
def property_create(request):
    serializer = PropertySerializer(data=request.data)

    if serializer.is_valid():
        property_obj = serializer.save()
        return Response(PropertySerializer(property_obj).data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def property_roi(request, pk):
    property = get_object_or_404(Property, pk=pk)
    return Response({
        "property_id": property.id,
        "roi": property.annual_roi()
    })


@api_view(['GET'])
def property_ownership(request, pk):

    ownerships = Ownership.objects.filter(property_id=pk)
    serializer = OwnershipSerializer(ownerships, many=True)
    print(f'Ownership data: {serializer.data}')
    return Response(serializer.data)


@api_view(['GET'])
def property_payouts(request, pk):
    payouts = RentPayout.objects.filter(property_id=pk)
    serializer = RentPayoutSerializer(payouts, many=True)
    print(f'payout data is {serializer.data}')
    return Response(serializer.data)


@api_view(['GET'])
def wallet_payouts(request, wallet_address):
    # Notice the __iexact added to the end of user__username!
    # This tells Django to ignore uppercase/lowercase differences.
    payouts = RentPayout.objects.filter(user__username__iexact=wallet_address)
    serializer = RentPayoutSerializer(payouts, many=True)
    return Response(serializer.data)


# ========================= GOVERNANCE =========================

def cast_vote(proposal, wallet_address, vote_choice):

    # prevent voting on closed proposal
    if proposal.status != "ACTIVE":
        raise Exception("Voting closed")

    # get token ownership
    ownership = Ownership.objects.get(
        wallet_address=wallet_address,
        property=proposal.property
    )

    # prevent double voting
    if Vote.objects.filter(proposal=proposal, wallet_address=wallet_address).exists():
        raise Exception("Wallet already voted")

    Vote.objects.create(
        proposal=proposal,
        wallet_address=wallet_address,
        vote=vote_choice,
        tokens_used=ownership.tokens_owned
    )

    check_proposal_result(proposal)


def proposal_result(proposal):
    votes = Vote.objects.filter(proposal=proposal)

    votes_for = sum(v.tokens_used for v in votes if v.vote)
    votes_against = sum(v.tokens_used for v in votes if not v.vote)

    return {
        "votes_for": votes_for,
        "votes_against": votes_against,
        "approved": votes_for > votes_against
    }

@api_view(['GET'])
def property_proposals(request, pk):

    proposals = Proposal.objects.filter(property_id=pk)

    total_weight = Ownership.objects.filter(
        property_id=pk
    ).aggregate(
        Sum("tokens_owned")
    )["tokens_owned__sum"] or 0

    response = []

    for p in proposals:

        votes_for = Vote.objects.filter(
            proposal=p,
            vote=True
        ).aggregate(
            Sum("tokens_used")
        )["tokens_used__sum"] or 0

        votes_against = Vote.objects.filter(
            proposal=p,
            vote=False
        ).aggregate(
            Sum("tokens_used")
        )["tokens_used__sum"] or 0

        response.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "proposal_type": p.proposal_type,
            "votes_for": votes_for,
            "votes_against": votes_against,
            "total_weight": total_weight,

            # IMPORTANT: return DB status
            "status": p.status,
        })

    return Response(response)
@api_view(["POST"])
def create_property_proposals(request, pk):
    try:
        property_obj = Property.objects.get(id=pk)
    except Property.DoesNotExist:
        return Response(
            {"error": "Property not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = ProposalSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save(property=property_obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
def check_proposal_result(proposal):

    if proposal.status != "ACTIVE":
        return

    votes = Vote.objects.filter(proposal=proposal)

    for_tokens = votes.filter(vote=True).aggregate(
        Sum("tokens_used")
    )["tokens_used__sum"] or 0

    against_tokens = votes.filter(vote=False).aggregate(
        Sum("tokens_used")
    )["tokens_used__sum"] or 0

    total_tokens = Ownership.objects.filter(
        property=proposal.property
    ).aggregate(
        Sum("tokens_owned")
    )["tokens_owned__sum"] or 0

    print(f"total tokens {total_tokens}, for: {for_tokens}, against: {against_tokens}")

    if for_tokens >= total_tokens / 2:
        proposal.status = "APPROVED"
        prop = proposal.property
        value = float(proposal.description)

        if proposal.proposal_type == "RENT_CHANGE":
            prop.monthly_rent = value

        elif proposal.proposal_type == "MAINTENANCE_CHANGE":
            prop.maintenance_cost = value

        elif proposal.proposal_type == "PROPERTY_REVALUATION":
            prop.purchase_price = value

        prop.save()
        proposal.save()

    elif against_tokens > total_tokens / 2:
        proposal.status = "REJECTED"
        proposal.save()
@api_view(['POST'])
def vote_on_proposal(request, proposal_id):

    vote_choice = request.data.get("vote")
    wallet_address = request.data.get("wallet_address")

    try:
        proposal = Proposal.objects.get(id=proposal_id)
    except Proposal.DoesNotExist:
        return Response({"error": "Proposal not found"}, status=404)

    try:
        cast_vote(proposal, wallet_address, vote_choice)
    except Exception as e:
        return Response({"error": str(e)}, status=400)

    return Response({"status": "vote recorded"})
# properties/views.py
@api_view(['POST'])
def distribute_rent(request, pk):
    property_obj = get_object_or_404(Property, pk=pk)

    net_rent = property_obj.monthly_rent - property_obj.maintenance_cost

    ownerships = Ownership.objects.filter(property=property_obj)

    payout_count = 0

    for ownership in ownerships:

        try:
            wallet_user = WalletUser.objects.get(wallet_address=ownership.wallet_address)
            user = wallet_user.user
        except WalletUser.DoesNotExist:
            user, _ = User.objects.get_or_create(username=ownership.wallet_address)

        share_amount = (ownership.tokens_owned / 1000) * net_rent

        if share_amount > 0:
            payout, created = RentPayout.objects.get_or_create(
                user=user,
                property=property_obj,
                defaults={"amount": share_amount}
            )

            if created:
                payout_count += 1

    return Response({
        "message": f"Successfully distributed rent to {payout_count} owners."
    })
@api_view(["POST"])
def wallet_login(request):

    wallet_address = request.data.get("wallet_address")
    password = request.data.get("password")

    try:
        wallet_user = WalletUser.objects.get(wallet_address=wallet_address)
        user = wallet_user.user

        # First call (just checking wallet)
        if not password:
            return Response({
                "exists": True,
                "require_password": True,
                "username": user.username   # IMPORTANT
            })

        # Second call (password verification)
        if user.check_password(password):
            return Response({
                "success": True,
                "username": user.username
            })
        else:
            return Response({
                "success": False,
                "error": "Invalid password"
            }, status=401)

    except WalletUser.DoesNotExist:

        return Response({
            "exists": False
        })
@api_view(["POST"])
def register_wallet_user(request):

    wallet_address = request.data.get("wallet_address")
    username = request.data.get("username")
    password = request.data.get("password")

    if not wallet_address or not username or not password:
        return Response({"error": "wallet_address, username and password required"}, status=400)

    if WalletUser.objects.filter(wallet_address=wallet_address).exists():
        return Response({"error": "Wallet already registered"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=400)

    user = User.objects.create(username=username)
    user.set_password(password)
    user.save()

    WalletUser.objects.create(
        user=user,
        wallet_address=wallet_address
    )

    return Response({
        "message": "User created successfully"
    })