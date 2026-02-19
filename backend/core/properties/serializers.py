from rest_framework import serializers
from .models import Property, Ownership, RentPayout


class PropertySerializer(serializers.ModelSerializer):
    roi = serializers.SerializerMethodField()
    purchase_price = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False)
    monthly_rent = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    maintenance_cost = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)

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
        return float(obj.annual_roi())


class OwnershipSerializer(serializers.ModelSerializer):
    ownership_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Ownership
        fields = ['user', 'tokens_owned', 'ownership_percentage']

    def get_ownership_percentage(self, obj):
        return obj.ownership_percentage()


class RentPayoutSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)

    class Meta:
        model = RentPayout
        fields = ['user', 'property', 'amount', 'month']
