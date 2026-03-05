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
    WalletNonce
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
    print(ownerships)
    print(serializer.data)
   
    return Response(serializer.data)


@api_view(['GET'])
def property_payouts(request, pk):
    payouts = RentPayout.objects.filter(property_id=pk)
    serializer = RentPayoutSerializer(payouts, many=True)
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

    if for_tokens > total_tokens / 2:
        proposal.status = "APPROVED"
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
    
    # Calculate Net Rent
    net_rent = property_obj.monthly_rent - property_obj.maintenance_cost
    
    # Get all owners
    ownerships = Ownership.objects.filter(property=property_obj)
    
    payout_count = 0
    for ownership in ownerships:
        # 1. Find the User associated with this wallet address
        # Your WalletNonce model has a helper for this
        try:
            nonce_obj = WalletNonce.objects.get(wallet_address=ownership.wallet_address)
            user = nonce_obj.get_or_create_user()
        except WalletNonce.DoesNotExist:
            # Fallback if no nonce object exists (useful for admin-created data)
            user, _ = User.objects.get_or_create(username=ownership.wallet_address)

        # 2. Calculate Share: (Tokens / 1000) * Net Rent
        # Note: TOTAL_TOKENS is 1000 based on your Ownership model logic
        share_amount = (ownership.tokens_owned / 1000) * net_rent
        if share_amount > 0:
            try:
                # Use 'defaults' so it only tries to set the amount if creating a new one
                payout, created = RentPayout.objects.get_or_create(
                    user=user,
                    property=property_obj,
                    defaults={'amount': share_amount}
                )
                
                if created:
                    payout_count += 1
                    
            except IntegrityError:
                # If a payout already exists for this user/property/month, skip it
                pass
        
            
    return Response({"message": f"Successfully distributed rent to {payout_count} owners."})