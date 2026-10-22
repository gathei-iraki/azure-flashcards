from django.contrib import admin

from .models import Deck, Flashcard


class FlashcardInline(admin.TabularInline):
    model = Flashcard
    extra = 0


@admin.register(Deck)
class DeckAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'display_order', 'card_count')
    prepopulated_fields = {'slug': ('title',)}
    inlines = (FlashcardInline,)

    @admin.display(description='Cards')
    def card_count(self, obj):
        return obj.cards.count()


@admin.register(Flashcard)
class FlashcardAdmin(admin.ModelAdmin):
    list_display = ('question', 'deck', 'display_order')
    list_filter = ('deck',)
    search_fields = ('question', 'answer')

# Register your models here.
