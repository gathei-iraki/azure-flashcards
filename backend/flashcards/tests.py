from io import StringIO

from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse

from .models import Deck, Flashcard


class SeedFlashcardsTests(TestCase):
    def test_seed_is_idempotent(self):
        call_command('seed_flashcards', stdout=StringIO())
        call_command('seed_flashcards', stdout=StringIO())

        self.assertEqual(Deck.objects.count(), 5)
        self.assertEqual(Flashcard.objects.count(), 25)
        self.assertTrue(
            all(deck.cards.count() >= 5 for deck in Deck.objects.all())
        )


class PublicApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed_flashcards', stdout=StringIO())

    def test_health_endpoint(self):
        response = self.client.get(reverse('health'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'status': 'ok'})

    def test_deck_list_is_ordered_and_includes_counts(self):
        response = self.client.get(reverse('deck-list'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 5)
        self.assertEqual(response.json()[0]['slug'], 'cloud-concepts')
        self.assertEqual(response.json()[0]['card_count'], 5)

    def test_deck_detail(self):
        response = self.client.get(
            reverse('deck-detail', kwargs={'slug': 'azure-compute'})
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['title'], 'Azure Compute')
        self.assertEqual(response.json()['card_count'], 5)

    def test_cards_are_ordered(self):
        response = self.client.get(
            reverse('deck-cards', kwargs={'slug': 'azure-storage'})
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [card['display_order'] for card in response.json()],
            [1, 2, 3, 4, 5],
        )

    def test_unknown_deck_returns_404(self):
        response = self.client.get(
            reverse('deck-detail', kwargs={'slug': 'not-a-deck'})
        )
        self.assertEqual(response.status_code, 404)

    def test_public_write_methods_are_rejected(self):
        response = self.client.post(reverse('deck-list'), {'title': 'Nope'})
        self.assertEqual(response.status_code, 405)

