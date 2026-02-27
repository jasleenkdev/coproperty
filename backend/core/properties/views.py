from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Property
from .serializers import PropertySerializer
from django.shortcuts import get_object_or_404
import secrets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import WalletNonce
from eth_account.messages import encode_defunct
from eth_account import Account
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from properties.services.blockchain import mint_tokens


def perform_create(self, serializer):
    property = serializer.save()

    tx_hash = mint_tokens(
        property.contract_address,
        ABI,
        admin_wallet,
        1000 * 10**18
    )

    property.mint_tx_hash = tx_hash
    property.save()

@api_view(['POST'])
def wallet_login(request):
    wallet = request.data.get("wallet_address")
    signature = request.data.get("signature")

    nonce_obj = WalletNonce.objects.get(wallet_address=wallet)

    message = encode_defunct(text=nonce_obj.nonce)
    recovered_address = Account.recover_message(message, signature=signature)

    if recovered_address.lower() != wallet.lower():
        return Response({"error": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)

    user = nonce_obj.get_or_create_user()
    refresh = RefreshToken.for_user(user)

    return Response({
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    })

@api_view(['GET'])
def get_nonce(request):
    wallet = request.GET.get('wallet')
    nonce = secrets.token_hex(16)

    WalletNonce.objects.update_or_create(
        wallet_address=wallet,
        defaults={'nonce': nonce}
    )

    return Response({'nonce': nonce})

@api_view(['GET'])
def property_list(request):
    properties = Property.objects.all()
    serializer = PropertySerializer(properties, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def property_roi(request, pk):
    property = get_object_or_404(Property, pk=pk)
    return Response({
        "property_id": property.id,
        "roi": property.annual_roi()
    })

from .models import Ownership, RentPayout
from .serializers import OwnershipSerializer, RentPayoutSerializer

@api_view(['GET'])
def property_ownership(request, pk):
    ownerships = Ownership.objects.filter(property_id=pk)
    serializer = OwnershipSerializer(ownerships, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def property_payouts(request, pk):
    payouts = RentPayout.objects.filter(property_id=pk)
    serializer = RentPayoutSerializer(payouts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def user_payouts(request, user_id):
    payouts = RentPayout.objects.filter(user_id=user_id)
    serializer = RentPayoutSerializer(payouts, many=True)
    return Response(serializer.data)


from .models import Proposal, Vote
from .services_old import cast_vote, proposal_result
from django.contrib.auth.models import User

@api_view(['GET'])
def property_proposals(request, pk):
    proposals = Proposal.objects.filter(property_id=pk)
    response = []

    for p in proposals:
        result = proposal_result(p)
        response.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "proposal_type": p.proposal_type,
            "votes_for": result["votes_for"],
            "votes_against": result["votes_against"],
            "approved": result["approved"],
        })

    return Response(response)


@api_view(['POST'])
def vote_on_proposal(request, proposal_id):
    user = request.user or User.objects.first()
    vote_choice = request.data.get("vote")  # true / false

    proposal = Proposal.objects.get(id=proposal_id)
    cast_vote(proposal, user, vote_choice)

    return Response({"status": "vote recorded"})
