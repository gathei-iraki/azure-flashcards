from rest_framework import serializers

from .models import Deck, Flashcard


class DeckSerializer(serializers.ModelSerializer):
    card_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Deck
        fields = ('title', 'slug', 'description', 'display_order', 'card_count')


class DeckDetailSerializer(serializers.ModelSerializer):
    card_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Deck
        fields = ('title', 'slug', 'description', 'display_order', 'card_count')


class FlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = ('question', 'answer', 'display_order')
