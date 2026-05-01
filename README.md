# System Design Arena

AI-powered system design interview simulator with interactive canvas, voice interaction, and detailed scoring.

## What it does

- **AI Interviewer** — Claude-powered interviewer that behaves differently across 4 phases (Clarify → Design → Deep Dive → Scale)
- **Interactive Canvas** — drag-and-drop system design components (DB, cache, LB, queue, CDN, etc.) with freehand drawing and connections
- **Voice Interaction** — full duplex: speak your answers, hear the interviewer's questions (Web Speech API)
- **Vague Problems** — problems are intentionally open-ended like real MAANG interviews; you drive the scoping
- **Cross-questioning** — AI probes weak areas, challenges contradictions, escalates depth
- **Scoring** — 7-dimension rubric with hire/no-hire verdict and actionable feedback

## Quick Start

```bash
# Clone and install
git clone <your-repo-url>
cd system-design-arena
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
system-design-arena/
├── index.html                  # Entry HTML
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite bundler config
├── tailwind.config.js          # Tailwind CSS config
├── postcss.config.js           # PostCSS config
├── .env.example                # Environment variables template
├── .gitignore
│
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # Root component (screen router)
    │
    ├── components/
    │   ├── Canvas.jsx          # Interactive design board
    │   ├── ChatPanel.jsx       # Chat UI with voice integration
    │   ├── MicButton.jsx       # Animated mic toggle button
    │   └── ScoreCard.jsx       # Post-interview scoring display
    │
    ├── data/
    │   ├── problems.js         # Problem bank (curated + AI generation prompt)
    │   └── prompts.js          # Phase-specific system prompts + scoring rubric
    │
    ├── hooks/
    │   └── useVoice.js         # Speech-to-text + text-to-speech hook
    │
    ├── lib/
    │   ├── claude.js           # Anthropic API client
    │   └── store.js            # Zustand global state (interview session)
    │
    ├── pages/
    │   ├── HomeScreen.jsx      # Problem selection screen
    │   ├── InterviewScreen.jsx # Main interview (canvas + chat split pane)
    │   └── ScoringScreen.jsx   # Post-interview results
    │
    └── styles/
        └── index.css           # Global styles + Tailwind directives
```

## Interview Phases

| Phase | Duration | AI Behavior |
|-------|----------|-------------|
| **1. Clarify** | ~5 min | Terse, Socratic — won't volunteer scope, forces candidate to drive |
| **2. Design** | ~15 min | Observes canvas, asks about component choices and gaps |
| **3. Deep Dive** | ~20 min | Adversarial probing — drills into weakest areas with escalating depth |
| **4. Scale** | ~10 min | Throws curveballs — 10x traffic, new regions, compliance, cost optimization |

## Tech Stack

- **React 18** + Vite
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Claude API** (Anthropic) for AI interviewer
- **Web Speech API** for voice (Chrome/Edge recommended)
- **React Router** for future route-based navigation

## Production Deployment

To go from this to a live product:

1. **Auth** — Add [Clerk](https://clerk.com) or [Supabase Auth](https://supabase.com/auth) (~1 day)
2. **Database** — Persist sessions in Supabase Postgres (~2 days)
3. **API Proxy** — Move Claude API calls to a Next.js/Express backend to protect keys (~0.5 day)
4. **Payments** — Add [Stripe](https://stripe.com) subscriptions (~1 day)
5. **Voice upgrade** — Swap Web Speech API for [Deepgram](https://deepgram.com) (STT) + [ElevenLabs](https://elevenlabs.io) (TTS) for better quality (~1 day)
6. **Deploy** — Push to [Vercel](https://vercel.com) (~1 hour)

## Voice Requirements

Voice uses the browser's native Web Speech API:
- **Chrome / Edge**: Full support (recommended)
- **Safari**: Partial support (TTS works, STT may be limited)
- **Firefox**: TTS only, no speech recognition

## License

MIT
