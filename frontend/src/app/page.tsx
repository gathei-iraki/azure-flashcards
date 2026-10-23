"use client";

import { useEffect, useMemo, useState } from "react";

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

type QuizOption = {
  text: string;
  correct: boolean;
};

const API_URL = "http://127.0.0.1:8000/api";

export default function Home() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<"cards" | "quiz">("cards");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDecks() {
      try {
        const response = await fetch(`${API_URL}/decks/`);
        if (!response.ok) throw new Error(`The server returned ${response.status}`);
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
    setMode("cards");
    setSelectedOption(null);
    setScore(0);
    setQuizFinished(false);
    setError("");
    setLoadingCards(true);

    try {
      const response = await fetch(`${API_URL}/decks/${deck.slug}/cards/`);
      if (!response.ok) throw new Error(`The server returned ${response.status}`);
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

  function startQuiz() {
    setMode("quiz");
    setCardIndex(0);
    setSelectedOption(null);
    setScore(0);
    setQuizFinished(false);
  }

  function restartQuiz() {
    setCardIndex(0);
    setSelectedOption(null);
    setScore(0);
    setQuizFinished(false);
  }

  function chooseOption(index: number) {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    if (quizOptions[index]?.correct) setScore((current) => current + 1);
  }

  function nextQuestion() {
    setSelectedOption(null);
    if (cardIndex === cards.length - 1) {
      setQuizFinished(true);
    } else {
      setCardIndex((index) => index + 1);
    }
  }

  function showNextCard() {
    setCardIndex((index) => Math.min(index + 1, cards.length - 1));
    setFlipped(false);
  }

  function showPreviousCard() {
    setCardIndex((index) => Math.max(index - 1, 0));
    setFlipped(false);
  }

  function restartCards() {
    setCardIndex(0);
    setFlipped(false);
  }

  function shuffleCards() {
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

  const quizOptions = useMemo(() => {
    if (!currentCard) return [];

    const distractors = cards
      .filter((card) => card.answer !== currentCard.answer)
      .map((card) => ({ text: card.answer, correct: false }));

    for (let index = distractors.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [distractors[index], distractors[randomIndex]] = [
        distractors[randomIndex],
        distractors[index],
      ];
    }

    const options: QuizOption[] = [
      { text: currentCard.answer, correct: true },
      ...distractors.slice(0, 3),
    ];

    for (let index = options.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [options[index], options[randomIndex]] = [
        options[randomIndex],
        options[index],
      ];
    }

    return options;
  }, [cards, cardIndex, currentCard]);

  return (
    <main className="min-h-screen bg-slate-50  text-slate-900">
      <div className="mx-auto max-w-4xl">
        <p className="font-semibold text-blue-700">AZ-900 STUDY</p>
        <h1 className="mt-2 text-4xl font-bold">AzureRecall</h1>

        {!selectedDeck && (
          <>
            <p className="mt-3 text-slate-600">Choose a topic to start studying.</p>

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
                      <p className="mt-4 font-medium text-blue-700">
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

            {!loadingCards && !error && cards.length > 0 && (
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setMode("cards")}
                  className={`rounded-lg px-4 py-2 ${
                    mode === "cards"
                      ? "bg-blue-700 text-white"
                      : "border border-slate-300"
                  }`}
                >
                  Flashcards
                </button>
                <button
                  type="button"
                  onClick={startQuiz}
                  className={`rounded-lg px-4 py-2 ${
                    mode === "quiz"
                      ? "bg-blue-700 text-white"
                      : "border border-slate-300"
                  }`}
                >
                  Quiz
                </button>
              </div>
            )}

            {loadingCards && <p className="mt-6">Loading flashcards…</p>}

            {error && (
              <p className="mt-6 rounded-lg bg-red-100 p-4 text-red-800">
                Could not load flashcards: {error}
              </p>
            )}

            {!loadingCards && !error && cards.length === 0 && (
              <p className="mt-6">This topic has no flashcards yet.</p>
            )}

            {!loadingCards && !error && currentCard && mode === "cards" && (
              <>
                <p className="mt-4 text-slate-600">
                  Card {cardIndex + 1} of {cards.length}
                </p>

                <button
                  type="button"
                  onClick={() => setFlipped((value) => !value)}
                  className="mt-4 flex min-h-64 w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
                >
                  <span className="font-semibold uppercase tracking-wide text-blue-700">
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
                    onClick={restartCards}
                    className="rounded-lg border border-slate-300 px-4 py-2"
                  >
                    Restart
                  </button>
                  <button
                    type="button"
                    onClick={shuffleCards}
                    className="rounded-lg border border-slate-300 px-4 py-2"
                  >
                    Shuffle
                  </button>
                </div>
              </>
            )}

            {!loadingCards && !error && mode === "quiz" && quizFinished && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8">
                <h3 className="text-2xl font-bold">Quiz complete!</h3>
                <p className="mt-3 text-lg">
                  Your score: {score} out of {cards.length}
                </p>
                <button
                  type="button"
                  onClick={restartQuiz}
                  className="mt-6 rounded-lg bg-blue-700 px-4 py-2 text-white"
                >
                  Try again
                </button>
              </div>
            )}

            {!loadingCards && !error && mode === "quiz" && !quizFinished && currentCard && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8">
                <p className="text-sm font-semibold text-blue-700">
                  QUESTION {cardIndex + 1} OF {cards.length} · SCORE {score}
                </p>
                <h3 className="mt-4 text-xl font-bold">{currentCard.question}</h3>

                <div className="mt-6 grid gap-3">
                  {quizOptions.map((option, index) => {
                    const answered = selectedOption !== null;
                    const isSelected = selectedOption === index;

                    return (
                      <button
                        key={`${cardIndex}-${index}`}
                        type="button"
                        disabled={answered}
                        onClick={() => chooseOption(index)}
                        className={`rounded-lg border p-4 text-left ${
                          answered && option.correct
                            ? "border-green-600 bg-green-50"
                            : answered && isSelected
                              ? "border-red-600 bg-red-50"
                              : "border-slate-300 hover:border-blue-500"
                        }`}
                      >
                        {option.text}
                      </button>
                    );
                  })}
                </div>

                {selectedOption !== null && (
                  <div className="mt-6">
                    <p className="font-medium">
                      {quizOptions[selectedOption]?.correct
                        ? "Correct!"
                        : "Not quite. The correct answer is highlighted."}
                    </p>
                    <button
                      type="button"
                      onClick={nextQuestion}
                      className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-white"
                    >
                      {cardIndex === cards.length - 1
                        ? "See my score"
                        : "Next question"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}