"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

type QuizOption = { text: string; correct: boolean };
type Mode = "cards" | "quiz";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api";

const deckThemes = [
  { icon: "☁", className: "theme-blue", label: "Cloud" },
  { icon: "⌘", className: "theme-purple", label: "Compute" },
  { icon: "⌁", className: "theme-cyan", label: "Network" },
  { icon: "▱", className: "theme-orange", label: "Storage" },
  { icon: "◇", className: "theme-green", label: "Security" },
];

function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return hash;
}

function ArrowLeftIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>;
}

function ArrowRightIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>;
}

function ShuffleIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>;
}

function RestartIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" /></svg>;
}

export default function Home() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<Mode>("cards");
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

  const showNextCard = useCallback(() => {
    setCardIndex((index) => Math.min(index + 1, cards.length - 1));
    setFlipped(false);
  }, [cards.length]);

  const showPreviousCard = useCallback(() => {
    setCardIndex((index) => Math.max(index - 1, 0));
    setFlipped(false);
  }, []);

  useEffect(() => {
    if (!selectedDeck || mode !== "cards") return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") showNextCard();
      if (event.key === "ArrowLeft") showPreviousCard();
      if (event.key === " " && event.target === document.body) {
        event.preventDefault();
        setFlipped((value) => !value);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, selectedDeck, showNextCard, showPreviousCard]);

  function restartCards() {
    setCardIndex(0);
    setFlipped(false);
  }

  function shuffleCards() {
    const shuffled = [...cards];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    setCards(shuffled);
    restartCards();
  }

  const currentCard = cards[cardIndex];
  const progress = cards.length ? ((cardIndex + 1) / cards.length) * 100 : 0;

  const quizOptions = useMemo(() => {
    if (!currentCard) return [];
    const distractors: QuizOption[] = cards
      .filter((card) => card.answer !== currentCard.answer)
      .map((card) => ({ text: card.answer, correct: false }))
      .sort((a, b) => stableHash(currentCard.question + a.text) - stableHash(currentCard.question + b.text));

    const options: QuizOption[] = [
      { text: currentCard.answer, correct: true },
      ...distractors.slice(0, 3),
    ];
    return options.sort((a, b) => stableHash(a.text + currentCard.question) - stableHash(b.text + currentCard.question));
  }, [cards, currentCard]);

  function chooseOption(index: number) {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    if (quizOptions[index]?.correct) setScore((current) => current + 1);
  }

  function nextQuestion() {
    setSelectedOption(null);
    if (cardIndex === cards.length - 1) setQuizFinished(true);
    else setCardIndex((index) => index + 1);
  }

  function restartQuiz() {
    setCardIndex(0);
    setSelectedOption(null);
    setScore(0);
    setQuizFinished(false);
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="site-header">
        <button className="brand" onClick={returnToDecks} type="button" aria-label="AzureRecall home">
          <span className="brand-mark"><span>AR</span></span>
          <span>Azure<span>Recall</span></span>
        </button>
        <div className="header-badge"><span>●</span> AZ-900 study lab</div>
      </header>

      {!selectedDeck ? (
        <section className="home-view">
          <div className="hero-copy">
            <span className="eyebrow"><span>✦</span> Learn Azure, one card at a time</span>
            <h1>Turn cloud concepts into <em>clear memories.</em></h1>
            <p>Pick a topic, flip through bite-sized lessons, and make AZ-900 ideas stick.</p>
            <div className="hero-stats" aria-label="Study library summary">
              <div><strong>{decks.reduce((total, deck) => total + deck.card_count, 0) || 25}</strong><span>study cards</span></div>
              <div><strong>{decks.length || 5}</strong><span>focused topics</span></div>
              <div><strong>∞</strong><span>fresh starts</span></div>
            </div>
          </div>

          <div className="section-heading">
            <div><span className="kicker">Choose your deck</span><h2>What are we learning today?</h2></div>
            <span className="tiny-note">No sign-in. Just start.</span>
          </div>

          {loadingDecks && <LoadingState label="Gathering your study decks…" />}
          {error && <ErrorState message={`Could not load topics: ${error}`} />}
          {!loadingDecks && !error && decks.length === 0 && <EmptyState message="No topics are available yet." />}

          {!loadingDecks && !error && decks.length > 0 && (
            <ul className="deck-grid">
              {decks.map((deck, index) => {
                const theme = deckThemes[index % deckThemes.length];
                return (
                  <li key={deck.slug}>
                    <button type="button" onClick={() => openDeck(deck)} className={`deck-card ${theme.className}`}>
                      <span className="deck-number">0{index + 1}</span>
                      <span className="deck-icon" aria-hidden="true">{theme.icon}</span>
                      <span className="deck-kind">{theme.label}</span>
                      <strong>{deck.title}</strong>
                      <span className="deck-description">{deck.description}</span>
                      <span className="deck-footer"><span>{deck.card_count} cards</span><span className="round-arrow">→</span></span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : (
        <section className="study-view">
          <button type="button" onClick={returnToDecks} className="back-link"><ArrowLeftIcon /> All topics</button>

          <div className="study-heading">
            <div><span className="kicker">Now studying</span><h1>{selectedDeck.title}</h1></div>
            {!loadingCards && cards.length > 0 && (
              <div className="mode-switch" aria-label="Study mode">
                <button type="button" onClick={() => setMode("cards")} className={mode === "cards" ? "active" : ""}>Flashcards</button>
                <button type="button" onClick={startQuiz} className={mode === "quiz" ? "active" : ""}>Quick quiz</button>
              </div>
            )}
          </div>

          {loadingCards && <LoadingState label="Shuffling the deck…" />}
          {error && <ErrorState message={`Could not load flashcards: ${error}`} />}
          {!loadingCards && !error && cards.length === 0 && <EmptyState message="This topic has no flashcards yet." />}

          {!loadingCards && !error && currentCard && mode === "cards" && (
            <div className="cards-mode">
              <div className="progress-row">
                <span><strong>{cardIndex + 1}</strong> of {cards.length}</span>
                <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
                <span>{Math.round(progress)}%</span>
              </div>

              <div className="card-stage">
                <div className="card-shadow card-shadow-two" />
                <div className="card-shadow card-shadow-one" />
                <button
                  type="button"
                  className={`flashcard ${flipped ? "is-flipped" : ""}`}
                  onClick={() => setFlipped((value) => !value)}
                  aria-label={`${flipped ? "Answer" : "Question"}: ${flipped ? currentCard.answer : currentCard.question}. Press to flip.`}
                >
                  <span className="flashcard-inner">
                    <span className="flashcard-face flashcard-front">
                      <span className="card-topline"><span className="side-label"><i /> Question</span><span className="card-count">{String(cardIndex + 1).padStart(2, "0")}</span></span>
                      <span className="card-content">{currentCard.question}</span>
                      <span className="flip-hint"><span>↻</span> Tap to reveal answer</span>
                    </span>
                    <span className="flashcard-face flashcard-back">
                      <span className="card-topline"><span className="side-label"><i /> Answer</span><span className="card-count">{String(cardIndex + 1).padStart(2, "0")}</span></span>
                      <span className="card-content answer-content">{currentCard.answer}</span>
                      <span className="flip-hint"><span>↻</span> Tap to see question</span>
                    </span>
                  </span>
                </button>
              </div>

              <div className="primary-controls">
                <button type="button" onClick={showPreviousCard} disabled={cardIndex === 0} className="nav-button secondary"><ArrowLeftIcon /><span>Previous</span></button>
                <span className="keyboard-tip">Use <kbd>←</kbd> <kbd>→</kbd> to move</span>
                <button type="button" onClick={showNextCard} disabled={cardIndex === cards.length - 1} className="nav-button primary"><span>Next card</span><ArrowRightIcon /></button>
              </div>

              <div className="utility-controls">
                <button type="button" onClick={restartCards}><RestartIcon /> Restart deck</button>
                <span />
                <button type="button" onClick={shuffleCards}><ShuffleIcon /> Shuffle cards</button>
              </div>
            </div>
          )}

          {!loadingCards && !error && mode === "quiz" && quizFinished && (
            <div className="quiz-finish">
              <span className="celebration" aria-hidden="true">✦</span>
              <span className="kicker">Deck complete</span>
              <h2>Nice work!</h2>
              <p>You answered <strong>{score} of {cards.length}</strong> questions correctly.</p>
              <button type="button" onClick={restartQuiz} className="nav-button primary"><RestartIcon /> Try again</button>
            </div>
          )}

          {!loadingCards && !error && mode === "quiz" && !quizFinished && currentCard && (
            <div className="quiz-card">
              <div className="progress-row quiz-progress"><span>Question <strong>{cardIndex + 1}</strong> of {cards.length}</span><span>Score <strong>{score}</strong></span></div>
              <span className="kicker">Choose the best answer</span>
              <h2>{currentCard.question}</h2>
              <div className="quiz-options">
                {quizOptions.map((option, index) => {
                  const answered = selectedOption !== null;
                  const isSelected = selectedOption === index;
                  const state = answered && option.correct ? "correct" : answered && isSelected ? "incorrect" : "";
                  return (
                    <button key={`${cardIndex}-${index}`} type="button" disabled={answered} onClick={() => chooseOption(index)} className={state}>
                      <span>{String.fromCharCode(65 + index)}</span>{option.text}
                    </button>
                  );
                })}
              </div>
              {selectedOption !== null && (
                <div className="quiz-result">
                  <p>{quizOptions[selectedOption]?.correct ? "✓ You got it!" : "Keep going — the correct answer is highlighted."}</p>
                  <button type="button" onClick={nextQuestion} className="nav-button primary">{cardIndex === cards.length - 1 ? "See results" : "Next question"}<ArrowRightIcon /></button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <footer><span>AzureRecall</span><span>Made for focused, low-pressure learning.</span></footer>
    </main>
  );
}

function LoadingState({ label }: { label: string }) {
  return <div className="status-card"><span className="loader" />{label}</div>;
}

function ErrorState({ message }: { message: string }) {
  return <div className="status-card error-card"><strong>Something drifted off course.</strong><span>{message}</span><small>Make sure the Django server is running on port 8000.</small></div>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="status-card"><span className="empty-icon">□</span>{message}</div>;
}
