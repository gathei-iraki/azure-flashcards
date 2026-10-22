"use client";

import { useEffect, useState } from "react";

type Deck = {
  title: string;
  slug: string;
  description: string;
  display_order: number;
  card_count: number;
};

type Flashcard = {
  question: string;
  answer: string;
  display_order: number;
};

const API_URL = "http://127.0.0.1:8000/api";

export default function Home() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDecks() {
      try {
        const response = await fetch(`${API_URL}/decks/`);
        if (!response.ok) {
          throw new Error(`The server returned ${response.status}`);
        }
        setDecks(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoadingDecks(false);
      }
    }

    loadDecks();
  }, []);

  async function openDeck(deck: Deck) {
    setSelectedDeck(deck);
    setCards([]);
    setCardIndex(0);
    setFlipped(false);
    setError("");
    setLoadingCards(true);

    try {
      const response = await fetch(`${API_URL}/decks/${deck.slug}/cards/`);
      if (!response.ok) {
        throw new Error(`The server returned ${response.status}`);
      }
      setCards(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoadingCards(false);
    }
  }

  function returnToDecks() {
    setSelectedDeck(null);
    setCards([]);
    setError("");
  }

  function showNextCard() {
    setCardIndex((index) => Math.min(index + 1, cards.length - 1));
    setFlipped(false);
  }

  function showPreviousCard() {
    setCardIndex((index) => Math.max(index - 1, 0));
    setFlipped(false);
  }

  function restartDeck() {
    setCardIndex(0);
    setFlipped(false);
  }

  function shuffleDeck() {
    const shuffled = [...cards];

    for (let index = shuffled.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [
        shuffled[randomIndex],
        shuffled[index],
      ];
    }

    setCards(shuffled);
    setCardIndex(0);
    setFlipped(false);
  }

  const currentCard = cards[cardIndex];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <p className="font-semibold text-blue-700">AZ-900 STUDY</p>
        <h1 className="mt-2 text-4xl font-bold">AzureRecall</h1>

        {!selectedDeck && (
          <>
            <p className="mt-3 text-slate-600">
              Choose a topic to start studying.
            </p>

            {loadingDecks && <p className="mt-8">Loading topics…</p>}

            {error && (
              <p className="mt-8 rounded-lg bg-red-100 p-4 text-red-800">
                Could not load topics: {error}
              </p>
            )}

            {!loadingDecks && !error && decks.length === 0 && (
              <p className="mt-8">No topics are available yet.</p>
            )}

            {!loadingDecks && !error && decks.length > 0 && (
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {decks.map((deck) => (
                  <li key={deck.slug}>
                    <button
                      type="button"
                      onClick={() => openDeck(deck)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-400 hover:shadow-md"
                    >
                      <h2 className="text-xl font-semibold">{deck.title}</h2>
                      <p className="mt-2 text-slate-600">{deck.description}</p>
                      <p className="mt-4 text-sm font-medium text-blue-700">
                        {deck.card_count} flashcards · Click to study
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {selectedDeck && (
          <section className="mt-8">
            <button
              type="button"
              onClick={returnToDecks}
              className="font-medium text-blue-700 hover:underline"
            >
              ← All topics
            </button>

            <h2 className="mt-5 text-2xl font-bold">{selectedDeck.title}</h2>

            {loadingCards && <p className="mt-6">Loading flashcards…</p>}

            {error && (
              <p className="mt-6 rounded-lg bg-red-100 p-4 text-red-800">
                Could not load flashcards: {error}
              </p>
            )}

            {!loadingCards && !error && cards.length === 0 && (
              <p className="mt-6">This topic has no flashcards yet.</p>
            )}

            {!loadingCards && !error && currentCard && (
              <>
                <p className="mt-4 text-slate-600">
                  Card {cardIndex + 1} of {cards.length}
                </p>

                <button
                  type="button"
                  onClick={() => setFlipped((value) => !value)}
                  className="mt-4 flex min-h-64 w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
                  aria-label="Flip flashcard"
                >
                  <span className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                    {flipped ? "Answer" : "Question"} · Click card to flip
                  </span>
                  <span className="mt-5 text-2xl font-semibold">
                    {flipped ? currentCard.answer : currentCard.question}
                  </span>
                </button>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={showPreviousCard}
                    disabled={cardIndex === 0}
                    className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={showNextCard}
                    disabled={cardIndex === cards.length - 1}
                    className="rounded-lg bg-blue-700 px-4 py-2 text-white disabled:opacity-40"
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={restartDeck}
                    className="rounded-lg border border-slate-300 px-4 py-2"
                  >
                    Restart
                  </button>
                  <button
                    type="button"
                    onClick={shuffleDeck}
                    className="rounded-lg border border-slate-300 px-4 py-2"
                  >
                    Shuffle
                  </button>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}