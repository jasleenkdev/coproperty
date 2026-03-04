from django.urls import path
from .views import (
    get_nonce,
    wallet_login,
    property_list,
    property_roi,
    property_ownership,
    property_payouts,
    wallet_payouts,
    property_proposals,
    vote_on_proposal,
    buy_tokens,   # ✅ NEW
)

urlpatterns = [
    # ================= AUTH =================
    path("auth/nonce/", get_nonce),
    path("auth/login/", wallet_login),

    # ================= PROPERTIES =================
    path('properties/', property_list),
    path('properties/<int:pk>/roi/', property_roi),
    path('properties/<int:pk>/ownership/', property_ownership),
    path('properties/<int:pk>/payouts/', property_payouts),

    # ================= BUY TOKENS =================
    path('properties/<int:pk>/buy/', buy_tokens),  # ✅ IMPORTANT

    # ================= USER =================
    path("wallets/<str:wallet_address>/payouts/", wallet_payouts),

    # ================= GOVERNANCE =================
    path('properties/<int:pk>/proposals/', property_proposals),
    path('proposals/<int:proposal_id>/vote/', vote_on_proposal),
]