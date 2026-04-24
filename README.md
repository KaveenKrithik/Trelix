# BFHL — Tree Hierarchy Analyzer

SRM Full-Stack Engineering Challenge submission.

**Author:** Kaveen Krithik Kandan  
**Roll:** RA2311033010019  
**Email:** kk7310@srmist.edu.in

---

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/bfhl-challenge.git
cd bfhl-challenge
npm install
npm run dev
```

Open `http://localhost:3000` to use the app.

### Standalone Express Backend

```bash
npm run server
# Runs on http://localhost:3000 — POST /bfhl
```

---

## Project Structure

```
.
├── server.js                   # Standalone Express backend (POST /bfhl)
├── src/
│   ├── lib/bfhl.js             # Shared processing logic
│   └── app/
│       ├── layout.js           # Root layout
│       ├── globals.css         # Design tokens & base styles
│       ├── page.js             # Frontend UI
│       └── api/bfhl/route.js   # Next.js API route (POST /api/bfhl)
├── package.json
├── .env.example
└── README.md
```

---

## API

### `POST /bfhl` (Express) or `POST /api/bfhl` (Next.js)

**Request:**
```json
{
  "data": ["A->B", "A->C", "B->D", "C->E"]
}
```

**Response:**
```json
{
  "user_id": "kaveen_krithik_kandan_11012006",
  "email_id": "kk7310@srmist.edu.in",
  "college_roll_number": "RA2311033010019",
  "hierarchies": [...],
  "invalid_entries": [...],
  "duplicate_edges": [...],
  "summary": {
    "total_trees": 1,
    "total_cycles": 0,
    "largest_tree_root": "A"
  }
}
```

### Processing Pipeline

| Step | Operation |
|------|-----------|
| 1 | Trim and validate entries against `/^[A-Z]->[A-Z]$/`, reject self-loops |
| 2 | Deduplicate — keep first occurrence, report duplicates once |
| 3 | Build adjacency with diamond rule (second parent silently discarded) |
| 4 | Find roots (nodes that never appear as a child) |
| 5 | Group connected components via Union-Find |
| 6 | Detect cycles per component using DFS (white/gray/black) |
| 7 | Build nested tree objects recursively |
| 8 | Compute summary: counts + largest tree by depth (lex tiebreaker) |

---

## Test Case

**Input:**
```json
["A->B", "A->C", "B->D", "C->E", "E->F",
 "X->Y", "Y->Z", "Z->X",
 "P->Q", "Q->R",
 "G->H", "G->H", "G->I",
 "hello", "1->2", "A->"]
```

**Expected output:**
```json
{
  "hierarchies": [
    { "root": "A", "tree": {"A":{"B":{"D":{}},"C":{"E":{"F":{}}}}}, "depth": 4 },
    { "root": "G", "tree": {"G":{"H":{},"I":{}}}, "depth": 2 },
    { "root": "P", "tree": {"P":{"Q":{"R":{}}}}, "depth": 3 },
    { "root": "X", "tree": {}, "has_cycle": true }
  ],
  "invalid_entries": ["hello", "1->2", "A->"],
  "duplicate_edges": ["G->H"],
  "summary": { "total_trees": 3, "total_cycles": 1, "largest_tree_root": "A" }
}
```

---

## Deployment

### Option A: Deploy Everything to Vercel (Recommended)

Since the Next.js app includes the API route at `/api/bfhl`, a single Vercel deployment gives you both frontend and backend.

1. Push to a public GitHub repo.
2. Go to [vercel.com](https://vercel.com) — import the repo.
3. Framework Preset: **Next.js** (auto-detected).
4. Deploy. Done.
5. The API is available at `https://your-app.vercel.app/api/bfhl`.

### Option B: Standalone Express on Render

1. Go to [render.com](https://render.com) — New Web Service.
2. Connect the GitHub repo.
3. Settings:

| Field | Value |
|-------|-------|
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm run server` |
| Plan | Free |

4. API will be live at `https://your-app.onrender.com/bfhl`.

### Connecting a Separate Frontend to Render Backend

In `src/app/page.js`, change:

```js
const API_URL = "/api/bfhl";
// to:
const API_URL = "https://your-app.onrender.com/bfhl";
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Express server port |

---

MIT License
