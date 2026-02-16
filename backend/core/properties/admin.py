from django.contrib import admin
from .models import Property
from .models import Ownership

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'location',
        'purchase_price',
        'monthly_rent',
        'maintenance_cost',
        'annual_roi_display',
    )

    def annual_roi_display(self, obj):
        return f"{obj.annual_roi():.2f}%"

    annual_roi_display.short_description = "Annual ROI"

@admin.register(Ownership)
class OwnershipAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'property',
        'tokens_owned',
        'ownership_percentage_display',
    )

    def ownership_percentage_display(self, obj):
        return f"{obj.ownership_percentage():.2f}%"

    ownership_percentage_display.short_description = "Ownership %"


from .models import RentPayout

@admin.register(RentPayout)
class RentPayoutAdmin(admin.ModelAdmin):
    list_display = ('user', 'property', 'amount', 'month')


from .models import Proposal, Vote

@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = ('title', 'property', 'proposal_type', 'is_executed', 'created_at')


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ('user', 'proposal', 'vote', 'tokens_used')
