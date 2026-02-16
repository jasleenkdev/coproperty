from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Property
from .serializers import PropertySerializer
from django.shortcuts import get_object_or_404

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
from .services import cast_vote, proposal_result
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
