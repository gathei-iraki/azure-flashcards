# AzureRecall

AzureRecall is a public AZ-900 flashcard study application. This repository currently contains a complete read-only Django REST API and an initialized Next.js frontend. The study UI is intentionally not implemented yet.

## Project structure

```text
frontend/   Next.js App Router, React, TypeScript, Tailwind CSS, ESLint
backend/    Django, Django REST Framework, SQLite
```

There is no student authentication, user data, saved progress, scoring, AI integration, or browser-to-database connection. Django admin authentication is available only for developer content management.

## Backend setup (Ubuntu)

From the repository root:

```bash
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
backend/.venv/bin/python backend/manage.py migrate
backend/.venv/bin/python backend/manage.py seed_flashcards
backend/.venv/bin/python backend/manage.py runserver
```

Django uses `backend/db.sqlite3`. The API is then available at `http://127.0.0.1:8000/api/`. The local database file is git-ignored; its schema and repeatable seed content are version-controlled through migrations and the seed command.

## How the backend works

Django reads decks and flashcards from SQLite and returns them as JSON through Django REST Framework. A deck contains many cards. Cards are returned in `display_order`, so the frontend can show them in the order received.

The API is public and read-only. It has no student accounts or saved progress. Flipping cards, moving between cards, restarting, and shuffling should all be handled in frontend state.

## Seeded content

The repeatable `seed_flashcards` command creates or updates 25 version-controlled cards across five decks:

- Cloud Concepts and Fundamentals
- Azure Compute
- Azure Networking
- Azure Storage
- Security, Governance, and Monitoring

Running the command again updates the managed cards by deck and display order instead of duplicating them. It does not remove unrelated decks created by an administrator.

## Public read-only API

Local base URL: `http://127.0.0.1:8000/api`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health/` | Health check |
| `GET` | `/api/decks/` | Ordered deck list with card counts |
| `GET` | `/api/decks/{slug}/` | One deck's public metadata |
| `GET` | `/api/decks/{slug}/cards/` | Ordered cards for one deck |

Only GET is allowed on these public routes; POST, PUT, PATCH, and DELETE return `405 Method Not Allowed`.

### Response examples

`GET /api/decks/`

```json
[
  {
    "title": "Azure Compute",
    "slug": "azure-compute",
    "description": "Azure virtual machines, managed applications, containers, and serverless compute.",
    "display_order": 2,
    "card_count": 5
  }
]
```

Use the `slug` value to request a deck or its cards.

`GET /api/decks/azure-compute/cards/`

```json
[
  {
    "question": "When are Azure Virtual Machines a good compute choice?",
    "answer": "Use Azure Virtual Machines when you need operating-system-level control...",
    "display_order": 1
  }
]
```

An unknown deck returns `404`. An existing deck with no cards returns an empty array. The frontend should provide loading, error, and empty states.

### Suggested frontend flow

1. Fetch `/api/decks/` for the topic list.
2. Keep the selected deck's `slug`.
3. Fetch `/api/decks/{slug}/cards/` for the study screen.
4. Store the current card index and flipped state only in the browser.

## Backend verification

```bash
backend/.venv/bin/python backend/manage.py test flashcards
backend/.venv/bin/python backend/manage.py check
```

To inspect seed counts manually:

```bash
backend/.venv/bin/python backend/manage.py shell -c "from flashcards.models import Deck, Flashcard; print(Deck.objects.count(), Flashcard.objects.count())"
```

Expected output after seeding is `5 25`.

## Frontend setup

The frontend is the untouched `create-next-app` starter requested for initialization only.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. No AzureRecall frontend screens or API client have been added yet.
