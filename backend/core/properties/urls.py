from django.urls import path
from .views import (
    property_list,
    property_roi,
    property_ownership,
    property_payouts,
    user_payouts,
    property_proposals,
    vote_on_proposal,
)


urlpatterns = [
    path('properties/', property_list),
    path('properties/<int:pk>/roi/', property_roi),
    path('properties/<int:pk>/ownership/', property_ownership),
    path('properties/<int:pk>/payouts/', property_payouts),
    path('users/<int:user_id>/payouts/', user_payouts),
    path('properties/<int:pk>/proposals/', property_proposals),
    path('proposals/<int:proposal_id>/vote/', vote_on_proposal),

]
