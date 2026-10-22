from django.urls import path

from . import views

urlpatterns = [
    path('health/', views.health, name='health'),
    path('decks/', views.deck_list, name='deck-list'),
    path('decks/<slug:slug>/', views.deck_detail, name='deck-detail'),
    path('decks/<slug:slug>/cards/', views.deck_cards, name='deck-cards'),
]
