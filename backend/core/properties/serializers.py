from decimal import Decimal
from rest_framework import serializers
from .models import Property, Ownership, RentPayout, WalletUser


# ==============================
# Property Serializer
# ==============================

class PropertySerializer(serializers.ModelSerializer):
    roi = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            'id',
            'name',
            'location',
            'purchase_price',
            'monthly_rent',
            'maintenance_cost',    
            'roi',
        ]

    def get_roi(self, obj):
        return obj.annual_roi()


# ==============================
# Ownership Serializer (Indexed from Blockchain)
# ==============================

class OwnershipSerializer(serializers.ModelSerializer):
    ownership_percentage = serializers.SerializerMethodField()
    investor_name = serializers.SerializerMethodField()
  

    class Meta:
        model = Ownership
        fields = [
           'wallet_address', # Ensure this matches your models.py exactly
            'property',
            'tokens_owned',
            'ownership_percentage',
            'investor_name'
        ]
        
    def get_investor_name(self, obj):
        try:
            # Assuming the wallet_address is saved as the username in Django
    
            wallet_user = WalletUser.objects.get(wallet_address=obj.wallet_address)

            user = wallet_user.user

            return user.username if user.username else "Anonymous"
        except:
            return "Anonymous"

    def get_ownership_percentage(self, obj):
        # Safely get the supply, default to 1000 if the field doesn't exist
        total_supply = Decimal(getattr(obj.property, 'total_token_supply', 1000) or 1000)
        
        # Safely get tokens owned, default to 0
        tokens = Decimal(getattr(obj, 'tokens_owned', 0) or 0)

        if total_supply == 0:
            return Decimal('0')

        return (tokens / total_supply) * Decimal('100')


# ==============================
# Rent Payout Serializer (Wallet-Based)
# ==============================

class RentPayoutSerializer(serializers.ModelSerializer):
    investor_name = serializers.SerializerMethodField()
    # This makes the wallet address directly available as a string
    user_username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = RentPayout
        fields = ['user', 'user_username', 'property', 'amount', 'month', 'investor_name']

    def get_investor_name(self, obj):
        return obj.user.first_name if obj.user.first_name else "Investor"


from .models import Proposal
class ProposalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposal
        fields = [
            "id",
            "title",
            "proposal_type",
            "description",
            "created_at",
            "status",
            "is_executed"
        ]

    