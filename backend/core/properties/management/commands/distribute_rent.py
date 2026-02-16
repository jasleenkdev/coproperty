from django.core.management.base import BaseCommand
from properties.models import Property
from properties.services import distribute_rent

class Command(BaseCommand):
    help = "Distribute monthly rent for all properties"

    def handle(self, *args, **kwargs):
        properties = Property.objects.all()
        for prop in properties:
            distribute_rent(prop)

        self.stdout.write(self.style.SUCCESS("Monthly rent distributed successfully"))
