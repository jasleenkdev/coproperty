from decimal import Decimal
from rest_framework import serializers
from .models import Property, Ownership, RentPayout


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

    class Meta:
        model = Ownership
        fields = [
            'wallet_address',
            'property',
            'tokens_owned',
            'ownership_percentage'
        ]

    def get_ownership_percentage(self, obj):
        total_supply = Decimal(1000 or 0)
        tokens = Decimal(obj.tokens_owned or 0)

        if total_supply == 0:
            return Decimal('0')

        return (tokens / total_supply) * Decimal('100')


# ==============================
# Rent Payout Serializer (Wallet-Based)
# ==============================

class RentPayoutSerializer(serializers.ModelSerializer):

    class Meta:
        model = RentPayout
        fields = [
            'wallet_address',
            'property',
            'amount',
            'month'
        ]