from .models import Ownership, RentPayout

TOTAL_TOKENS = 1000

def distribute_rent(property_obj):
    net_rent = property_obj.monthly_rent - property_obj.maintenance_cost
    ownerships = Ownership.objects.filter(property=property_obj)

    for ownership in ownerships:
        share = ownership.tokens_owned / TOTAL_TOKENS
        payout_amount = share * net_rent

        RentPayout.objects.create(
            user=ownership.user,
            property=property_obj,
            amount=round(payout_amount, 2)
        )


from django.utils.timezone import now
from .models import Ownership, RentPayout

TOTAL_TOKENS = 1000

def distribute_rent(property_obj):
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


from .models import Proposal, Vote, Ownership

def cast_vote(proposal, user, vote_choice):
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
    votes = Vote.objects.filter(proposal=proposal)

    votes_for = sum(v.tokens_used for v in votes if v.vote)
    votes_against = sum(v.tokens_used for v in votes if not v.vote)

    return {
        "votes_for": votes_for,
        "votes_against": votes_against,
        "approved": votes_for > votes_against
    }

