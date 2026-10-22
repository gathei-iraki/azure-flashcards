from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Deck
from .serializers import DeckDetailSerializer, DeckSerializer, FlashcardSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    return Response({'status': 'ok'})


@api_view(['GET'])
@permission_classes([AllowAny])
def deck_list(request):
    decks = Deck.objects.annotate(card_count=Count('cards')).order_by(
        'display_order', 'title'
    )
    return Response(DeckSerializer(decks, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def deck_detail(request, slug):
    deck = get_object_or_404(
        Deck.objects.annotate(card_count=Count('cards')),
        slug=slug,
    )
    return Response(DeckDetailSerializer(deck).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def deck_cards(request, slug):
    deck = get_object_or_404(Deck, slug=slug)
    return Response(FlashcardSerializer(deck.cards.all(), many=True).data)

# Create your views here.
