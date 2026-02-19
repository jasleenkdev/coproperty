from django.db import models
from django.contrib.auth.models import User
from django.utils.timezone import now
from django.core.exceptions import ValidationError
import re


class Property(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2)
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    maintenance_cost = models.DecimalField(max_digits=10, decimal_places=2)

    def annual_roi(self):
        net_annual = (self.monthly_rent - self.maintenance_cost) * 12
        return (net_annual / self.purchase_price) * 100

    def __str__(self):
        return self.name


class Ownership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    tokens_owned = models.PositiveIntegerField()

    class Meta:
        unique_together = ('user', 'property')

    def ownership_percentage(self):
        TOTAL_TOKENS = 1000
        return (self.tokens_owned / TOTAL_TOKENS) * 100

    def __str__(self):
        return f"{self.user.username} owns {self.tokens_owned} tokens of {self.property.name}"


class RentPayout(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    month = models.DateField(default=now)

    class Meta:
        unique_together = ('user', 'property', 'month')

    def __str__(self):
        return f"{self.user.username} - {self.property.name} - {self.amount}"


class Proposal(models.Model):
    PROPOSAL_TYPES = [
        ('RENT_CHANGE', 'Change Rent'),
        ('MAINTENANCE', 'Approve Maintenance'),
        ('SELL', 'Sell Property'),
        ('BUY', 'Buy New Property'),
    ]

    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    proposal_type = models.CharField(max_length=20, choices=PROPOSAL_TYPES)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_executed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} ({self.property.name})"


class Vote(models.Model):
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    vote = models.BooleanField()  # True = FOR, False = AGAINST
    tokens_used = models.PositiveIntegerField()

    class Meta:
        unique_together = ('proposal', 'user')

    def __str__(self):
        return f"{self.user.username} voted on {self.proposal.title}"

class WalletProfile(models.Model):
    """Links a Django user to their blockchain wallet address."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    wallet_address = models.CharField(max_length=42, unique=True)  # 0x + 40 hex chars
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} -> {self.wallet_address}"

    def clean(self):
        if not re.match(r'^0x[0-9a-fA-F]{40}$', self.wallet_address):
            raise ValidationError("Invalid Ethereum address format")
