from django.db import models


class Deck(models.Model):
    title = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ('display_order', 'title')

    def __str__(self):
        return self.title


class Flashcard(models.Model):
    deck = models.ForeignKey(Deck, on_delete=models.CASCADE, related_name='cards')
    question = models.TextField()
    answer = models.TextField()
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ('display_order', 'id')
        constraints = [
            models.UniqueConstraint(
                fields=('deck', 'display_order'),
                name='unique_card_order_per_deck',
            ),
        ]

    def __str__(self):
        return f'{self.deck.title}: {self.question[:60]}'

# Create your models here.
