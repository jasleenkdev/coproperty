# properties/models.py
from django.db import models
from django.db import models
from django.contrib.auth.models import User

class WalletNonce(models.Model):
    wallet_address = models.CharField(max_length=42, unique=True)
    nonce = models.CharField(max_length=100)

    def get_or_create_user(self):
        user, _ = User.objects.get_or_create(username=self.wallet_address)
        return user

class Property(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    purchase_price = models.FloatField()
    monthly_rent = models.FloatField()
    maintenance_cost = models.FloatField()

    def annual_roi(self):
        net_annual = (self.monthly_rent - self.maintenance_cost) * 12
        return (net_annual / self.purchase_price) * 100

    def __str__(self):
        return self.name


from django.contrib.auth.models import User

class Ownership(models.Model):
    wallet_address = models.CharField(max_length=42)
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    tokens_owned = models.PositiveIntegerField()

    class Meta:
        unique_together = ('wallet_address', 'property')

    def ownership_percentage(self):
        TOTAL_TOKENS = 1000
        return (self.tokens_owned / TOTAL_TOKENS) * 100

    def __str__(self):
        return f"{self.wallet_address} owns {self.tokens_owned} tokens of {self.property.name}"

class RentPayout(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    amount = models.FloatField()
    month = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.property.name} - ₹{self.amount}"


from django.utils.timezone import now

class RentPayout(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    amount = models.FloatField()
    month = models.DateField(default=now)

    class Meta:
        unique_together = ('user', 'property', 'month')

    def __str__(self):
        return f"{self.user.username} - {self.property.name} - {self.amount}"

class Proposal(models.Model):

    PROPOSAL_TYPES = [
        ('RENT_CHANGE', 'Change Rent'),
        ('MAINTENANCE_CHANGE', 'Change Maintenance'),
        ('PROPERTY_REVALUATION', 'Change Property Value')
    ]

    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    proposal_type = models.CharField(max_length=20, choices=PROPOSAL_TYPES)
    description = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    status = models.CharField(
        max_length=20,
        choices=[
            ('ACTIVE','Active'),
            ('APPROVED','Approved'),
            ('REJECTED','Rejected')
        ],
        default='ACTIVE'
    )

    is_executed = models.BooleanField(default=False)


class Vote(models.Model):
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE)
    wallet_address = models.CharField(max_length=42)
    vote = models.BooleanField()  # True = FOR, False = AGAINST
    tokens_used = models.PositiveIntegerField()

    class Meta:
        unique_together = ('proposal', 'wallet_address')

    def __str__(self):
        return f"{self.wallet_address} voted on {self.proposal.title}"
