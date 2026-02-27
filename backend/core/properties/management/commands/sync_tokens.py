from django.core.management.base import BaseCommand
from web3 import Web3
from django.conf import settings
from properties.models import Property, Ownership
import os


class Command(BaseCommand):
    help = "Sync ERC20 Transfer events"

    def handle(self, *args, **kwargs):

        def get_web3(): 
            return Web3(Web3.HTTPProvider(settings.ALCHEMY_RPC_URL))

        for property in Property.objects.all():

            contract = w3.eth.contract(
                address=property.contract_address,
                abi=settings.PROPERTY_TOKEN_ABI
            )

            last_block = property.last_synced_block or 0
            latest_block = w3.eth.block_number

            events = contract.events.Transfer.get_logs(
                fromBlock=last_block,
                toBlock=latest_block
            )

            for event in events:
                # Temporary safe placeholder
                pass

            property.last_synced_block = latest_block
            property.save()

            self.stdout.write(
                self.style.SUCCESS(f"Synced property {property.id}")
            )