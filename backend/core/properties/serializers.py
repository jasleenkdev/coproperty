from rest_framework import serializers
from .models import Property

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

from .models import Ownership, RentPayout

class OwnershipSerializer(serializers.ModelSerializer):
    ownership_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Ownership
        fields = ['user', 'tokens_owned', 'ownership_percentage']

    def get_ownership_percentage(self, obj):
        return obj.ownership_percentage()


class RentPayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = RentPayout
        fields = ['user', 'property', 'amount', 'month']
