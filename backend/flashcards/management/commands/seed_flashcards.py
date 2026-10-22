from django.core.management.base import BaseCommand
from django.db import transaction

from flashcards.models import Deck, Flashcard


DECKS = [
    {
        'title': 'Cloud Concepts and Fundamentals',
        'slug': 'cloud-concepts',
        'description': 'Core cloud models, service types, and responsibility concepts.',
        'cards': [
            ('What is Infrastructure as a Service (IaaS)?',
             'IaaS provides virtualized compute, networking, and storage. The customer manages the operating system, applications, and data, while the provider manages the physical datacenter and hardware.'),
            ('What is Platform as a Service (PaaS)?',
             'PaaS provides a managed platform for building and deploying applications. The provider manages the infrastructure, operating system, and runtime; the customer manages application code and data.'),
            ('What is Software as a Service (SaaS)?',
             'SaaS is a complete application delivered over the internet. The provider operates the application and underlying stack, while the customer manages its data, access, and configuration.'),
            ('How does the shared responsibility model change from on-premises to SaaS?',
             'On-premises, the customer manages the entire stack. In IaaS, PaaS, and SaaS, progressively more responsibility shifts to the cloud provider, but customers always remain responsible for their data, identities, accounts, and access management.'),
            ('What is the difference between high availability and disaster recovery?',
             'High availability keeps services accessible during localized failures, often through redundancy. Disaster recovery restores service after a major outage, typically using backups, replication, and failover to another location.'),
        ],
    },
    {
        'title': 'Azure Compute',
        'slug': 'azure-compute',
        'description': 'Azure virtual machines, managed applications, containers, and serverless compute.',
        'cards': [
            ('When are Azure Virtual Machines a good compute choice?',
             'Use Azure Virtual Machines when you need operating-system-level control, custom software, or support for workloads that cannot run on a managed platform. VMs are an IaaS offering.'),
            ('What does an Azure Virtual Machine Scale Set provide?',
             'A Virtual Machine Scale Set creates and manages a group of load-balanced VMs and can automatically increase or decrease instance count in response to demand or a schedule.'),
            ('What is Azure App Service?',
             'Azure App Service is a PaaS offering for hosting web applications, REST APIs, and mobile back ends without managing the underlying servers.'),
            ('What is Azure Functions?',
             'Azure Functions is a serverless compute service that runs event-driven code. Consumption-based hosting can automatically scale and charges primarily for resources used while functions execute.'),
            ('How do Azure Container Instances and Azure Kubernetes Service differ?',
             'Azure Container Instances runs containers without managing VMs or an orchestrator. Azure Kubernetes Service provides managed Kubernetes for orchestrating, scaling, and operating multi-container applications.'),
        ],
    },
    {
        'title': 'Azure Networking',
        'slug': 'azure-networking',
        'description': 'Virtual networks, traffic filtering, routing, and private connectivity.',
        'cards': [
            ('What is an Azure Virtual Network (VNet)?',
             'A VNet is a logically isolated network in Azure. It lets Azure resources communicate with each other, the internet, and on-premises networks using configurable address spaces, subnets, routing, and security controls.'),
            ('What does a Network Security Group (NSG) do?',
             'An NSG filters inbound and outbound network traffic using ordered allow or deny rules based on source, destination, port, and protocol. It can be associated with subnets or network interfaces.'),
            ('What is Azure Firewall?',
             'Azure Firewall is a managed, stateful network security service that filters traffic across VNets and subscriptions, with features such as application and network rules, threat intelligence, and centralized logging.'),
            ('How do VPN Gateway and ExpressRoute differ?',
             'VPN Gateway sends encrypted traffic between Azure and on-premises networks over the public internet. ExpressRoute provides a private connection through a connectivity provider that does not traverse the public internet.'),
            ('What is VNet peering?',
             'VNet peering privately connects two Azure virtual networks so resources can communicate using Microsoft\'s backbone network, while the VNets remain separate administrative resources.'),
        ],
    },
    {
        'title': 'Azure Storage',
        'slug': 'azure-storage',
        'description': 'Storage services, access tiers, and data redundancy options.',
        'cards': [
            ('Which core data services are available in an Azure Storage account?',
             'A general-purpose Azure Storage account provides Blob storage for objects, Azure Files for managed file shares, Queue Storage for messages, and Table Storage for NoSQL key-value data.'),
            ('How do hot, cool, cold, and archive Blob access tiers differ?',
             'Hot is optimized for frequent access; cool and cold reduce storage cost for less frequently accessed data but have higher access costs and minimum retention periods; archive has the lowest storage cost and requires rehydration before data can be read.'),
            ('What does locally redundant storage (LRS) provide?',
             'LRS synchronously copies data three times within one physical location in the primary region. It protects against local drive and server failures but not a datacenter-wide or regional disaster.'),
            ('What does zone-redundant storage (ZRS) provide?',
             'ZRS synchronously replicates data across three Azure availability zones in the primary region, helping data remain accessible if one zone becomes unavailable.'),
            ('How do GRS and GZRS extend storage redundancy?',
             'GRS copies LRS-protected data asynchronously to a secondary region. GZRS uses ZRS in the primary region and copies data to a secondary region. Read-access variants also permit reads from the secondary endpoint.'),
        ],
    },
    {
        'title': 'Security, Governance, and Monitoring',
        'slug': 'security-governance-monitoring',
        'description': 'Identity, access, policy, secrets, observability, and recommendations.',
        'cards': [
            ('What is Azure role-based access control (Azure RBAC)?',
             'Azure RBAC controls who can access Azure resources, what actions they can perform, and at what scope. Role assignments combine a security principal, a role definition, and a scope.'),
            ('What is Azure Policy used for?',
             'Azure Policy evaluates resources against business rules, audits noncompliance, and can deny or remediate configurations. Initiatives group multiple policy definitions into one assignment.'),
            ('What does Azure Key Vault protect?',
             'Azure Key Vault securely stores and controls access to secrets, cryptographic keys, and certificates. Applications can use Microsoft Entra identities to access them instead of embedding credentials in code.'),
            ('What is Azure Monitor?',
             'Azure Monitor collects, analyzes, and acts on telemetry from cloud and on-premises environments. It works with metrics, logs, alerts, Application Insights, and Log Analytics workspaces.'),
            ('What does Azure Advisor provide?',
             'Azure Advisor analyzes deployed resources and provides personalized recommendations across reliability, security, performance, operational excellence, and cost.'),
        ],
    },
]


class Command(BaseCommand):
    help = 'Create or update the version-controlled AzureRecall decks and cards.'

    @transaction.atomic
    def handle(self, *args, **options):
        card_total = 0
        for deck_order, deck_data in enumerate(DECKS, start=1):
            deck, _ = Deck.objects.update_or_create(
                slug=deck_data['slug'],
                defaults={
                    'title': deck_data['title'],
                    'description': deck_data['description'],
                    'display_order': deck_order,
                },
            )

            expected_orders = []
            for card_order, (question, answer) in enumerate(
                deck_data['cards'], start=1
            ):
                Flashcard.objects.update_or_create(
                    deck=deck,
                    display_order=card_order,
                    defaults={'question': question, 'answer': answer},
                )
                expected_orders.append(card_order)
                card_total += 1

            deck.cards.exclude(display_order__in=expected_orders).delete()

        self.stdout.write(
            self.style.SUCCESS(
                f'Seeded {len(DECKS)} decks and {card_total} flashcards.'
            )
        )
