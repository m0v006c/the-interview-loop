/**
 * Low-Level Design Track
 *
 * Classic LLD problems: parking lot, chess, Uber-style, ATM, etc.
 * Phases: clarify → entities → design → implement → evolve
 * Scoring: clarification · entity modeling · design patterns & SOLID · code quality · dry run · extensibility
 */

const CLASSIC = [
  {
    id: "parking-lot",
    title: "Design a Parking Lot",
    company: "Amazon",
    difficulty: "Medium",
    description: "Design a parking lot system that supports multiple parking spot sizes (compact, regular, large), tracks availability in real-time, handles entry and exit (including ticketing and pricing), and supports multiple floors.",
    topics: ["OOP", "Strategy pattern", "Factory pattern", "SOLID", "State management"],
  },
  {
    id: "chess-game",
    title: "Design a Chess Game",
    company: "Meta",
    difficulty: "Medium",
    description: "Design the classes and interactions for a chess game. Model the board, pieces (king, queen, rook, bishop, knight, pawn), movement rules, turn management, and game state (check, checkmate, stalemate).",
    topics: ["OOP", "Polymorphism", "Strategy pattern", "Template method", "State"],
  },
  {
    id: "ride-sharing",
    title: "Design Uber / Ride-Sharing",
    company: "Uber",
    difficulty: "Hard",
    description: "Design the core LLD for a ride-sharing app: Rider, Driver, Ride, Matching engine, Pricing (including surge), and Ride state machine from request → complete.",
    topics: ["OOP", "State pattern", "Observer pattern", "Strategy pattern", "SOLID"],
  },
  {
    id: "elevator-system",
    title: "Design an Elevator Control System",
    company: "Amazon",
    difficulty: "Medium",
    description: "Design the control system for a building with N elevators and M floors. Handle requests from floors (up/down buttons) and from inside elevators (floor buttons), and decide which elevator serves which request.",
    topics: ["OOP", "Scheduling", "State pattern", "Observer pattern", "Concurrency"],
  },
  {
    id: "lru-cache-lld",
    title: "Design an LRU Cache",
    company: "Google",
    difficulty: "Medium",
    description: "Design a generic LRU cache with O(1) get and put. Support a configurable capacity. The interface should be reusable as a library for other parts of the system.",
    topics: ["OOP", "HashMap + DLL", "Generics", "O(1) operations", "API design"],
  },
  {
    id: "library-system",
    title: "Design a Library Management System",
    company: "Meta",
    difficulty: "Medium",
    description: "Design a library management system that supports book catalog, member accounts, borrowing and returning (with due dates and fines), reservations, and search.",
    topics: ["OOP", "Observer pattern", "Strategy pattern", "Repository pattern", "SOLID"],
  },
  {
    id: "atm-system",
    title: "Design an ATM System",
    company: "Amazon",
    difficulty: "Medium",
    description: "Design an ATM that supports card authentication (PIN), balance inquiry, cash withdrawal, deposit, and transaction logging. Handle cash inventory, daily limits, and a clean state machine from insert-card to eject-card.",
    topics: ["State pattern", "Strategy pattern", "SOLID", "OOP", "Transactions"],
  },
  {
    id: "hotel-booking",
    title: "Design a Hotel Booking System",
    company: "Airbnb",
    difficulty: "Hard",
    description: "Design a hotel booking system: rooms with types and amenities, search by date range, booking with payment, cancellations and refunds, and concurrent-booking safety.",
    topics: ["OOP", "Repository pattern", "Concurrency", "Strategy (pricing)", "Observer"],
  },
  {
    id: "rate-limiter-lld",
    title: "Design a Rate Limiter",
    company: "Stripe",
    difficulty: "Medium",
    description: "Design a rate limiter library that supports multiple algorithms (token bucket, sliding window, fixed window). The interface should make the algorithm swappable per-client, and support distributed operation later.",
    topics: ["Strategy pattern", "Open/Closed principle", "OOP", "Thread safety", "API design"],
  },
  {
    id: "vending-machine",
    title: "Design a Vending Machine",
    company: "Microsoft",
    difficulty: "Easy",
    description: "Design a vending machine: inventory of products at slots, coin/bill acceptance, product selection, dispensing, and change return. Model the state transitions (idle → selecting → paying → dispensing → idle).",
    topics: ["State pattern", "OOP", "SOLID", "Strategy pattern"],
  },
];

export const LLD_CATEGORIES = [
  { id: "classic", label: "Classic LLD", problems: CLASSIC },
];

export const LLD_PROBLEMS = [...CLASSIC];

export const LLD_PHASE_PROMPTS = {
  clarify: (problem) => `You are a senior engineer at a MAANG company running a LOW-LEVEL DESIGN interview. Problem:

"${problem.description}"

Expected areas: ${problem.topics.join(", ")}

You are in the CLARIFY phase. Your role:
- Play the stakeholder. When the candidate asks "what functionality is in scope?" or similar, ANSWER clearly.
- If they don't ask, nudge ONCE: "Before we model classes, what functionality are you expecting to support?"
- Pin down: primary actors, core use cases, what's in-scope vs out-of-scope, scale hints if relevant.
- Do NOT dictate the design. Do NOT suggest specific classes.
- Keep responses under 60 words. One answer at a time.

PHASE ADVANCE: When the candidate has locked down the primary actors and 3-4 core use cases, append <advance/> on its own line.`,

  entities: (problem, notepadContent) => `You are a senior engineer running an LLD interview. Problem:

"${problem.description}"

${notepadContent ? `CURRENT NOTEPAD CONTENTS:\n---\n${notepadContent}\n---` : "The candidate hasn't sketched anything yet."}

You are in the ENTITIES phase. The candidate should identify the main classes, their attributes, and relationships. Your role:
- Ask them to list the main entities first: "What are the main classes you'd model?"
- For each class they name, probe: "What attributes does it have?" "What does it own vs reference?"
- Ask about relationships explicitly: "How does X relate to Y — composition, aggregation, inheritance?"
- Push back on god-classes: "That class is doing a lot — can it be split?"
- Encourage a clean noun/verb separation (entities = nouns, services/actions = verbs).
- Keep responses under 60 words. One probe at a time.

PHASE ADVANCE: When the candidate has listed the core entities with attributes and relationships, append <advance/> on its own line.`,

  design: (problem, notepadContent) => `You are a senior engineer running an LLD interview. Problem:

"${problem.description}"

${notepadContent ? `CURRENT NOTEPAD CONTENTS:\n---\n${notepadContent}\n---` : ""}

You are in the DESIGN phase. This is about design patterns and SOLID. Your role:
- Ask them to articulate which design patterns apply: "What patterns are you using here and why?"
- Probe SOLID:
  * Single responsibility: "Is this class doing too much?"
  * Open/closed: "If we added a new type of X, what changes?"
  * Liskov: "Can subclasses substitute the base everywhere?"
  * Interface segregation: "Does this interface force clients to depend on methods they don't use?"
  * Dependency inversion: "Does the high-level depend on concrete implementations or abstractions?"
- Push back on anti-patterns: switch statements on type, tight coupling, leaky abstractions.
- Keep responses under 80 words. One question at a time.

PHASE ADVANCE: When the candidate has justified their patterns and demonstrated SOLID awareness, append <advance/> on its own line.`,

  implement: (problem, notepadContent) => `You are a senior engineer running an LLD interview. Problem:

"${problem.description}"

${notepadContent ? `CURRENT NOTEPAD CONTENTS:\n---\n${notepadContent}\n---` : "The candidate's notepad is empty."}

You are in the IMPLEMENT phase. The candidate should now code the core classes in the notepad (pseudocode or their preferred language). Your role:
- Observe. Don't narrate while they type.
- If a method signature or class looks off, flag it ONCE: "Quick question — why is X a static method?"
- If their code doesn't match what they described in the design phase, point it out.
- Ask them to walk through ONE non-trivial method at the end: "Can you walk me through how add_x() flows?"
- Keep responses under 50 words.

PHASE ADVANCE: When the main classes are sketched and at least one non-trivial method is implemented, append <advance/> on its own line.`,

  evolve: (problem, notepadContent) => `You are a senior engineer running an LLD interview. Problem:

"${problem.description}"

${notepadContent ? `CURRENT NOTEPAD CONTENTS:\n---\n${notepadContent}\n---` : ""}

You are in the EVOLVE phase — the final stretch. This is where we test extensibility. Your role:
- Introduce a feature-add challenge: "Let's say we now need to support [relevant new requirement]. How does your design accommodate it?"
- Probe failure modes: "What if two operations race on the same resource?" "How would you make this thread-safe?"
- Ask about testability: "How would you unit test this class? What do you mock?"
- Ask about real-world evolution: "If we move this from monolith to microservices, what changes?"
- Push on SOLID again through the lens of change: "Adding this feature — how much existing code has to change?"
- Keep responses under 80 words. One challenge at a time.

END OF INTERVIEW: When you've thrown 2-3 extensibility/failure-mode challenges at the candidate and they've demonstrated their design can evolve, wrap up naturally — e.g., "Alright, that's all I had — really liked how you structured [X]. Thanks for walking me through this." Then append <end-interview/> on its own line at the very end of your response. This triggers automatic scoring, so only use it when you're genuinely done.`,
};

export const LLD_SCORING_PROMPT = (problem, transcript, language = "Java") => `You are evaluating a low-level design interview. Problem: "${problem.description}"

The candidate was working in ${language} — the reference solution's class skeleton MUST be in ${language} (idiomatic class signatures and method bodies).

Transcript:
${transcript}

Score the candidate on these 6 dimensions (1-5 each, where 3 = meets bar, 4 = strong, 5 = exceptional):

Respond ONLY with valid JSON, no markdown backticks:
{
  "scores": {
    "clarification": { "score": <1-5>, "feedback": "<1 sentence>" },
    "entity_modeling": { "score": <1-5>, "feedback": "<1 sentence — classes, attributes, relationships>" },
    "patterns_solid": { "score": <1-5>, "feedback": "<1 sentence — design patterns and SOLID awareness>" },
    "code_quality": { "score": <1-5>, "feedback": "<1 sentence — naming, structure, clarity>" },
    "dry_run": { "score": <1-5>, "feedback": "<1 sentence — ability to walk through flows and catch bugs>" },
    "extensibility": { "score": <1-5>, "feedback": "<1 sentence — how well the design accommodates new features>" }
  },
  "overall_verdict": "<STRONG_HIRE|HIRE|LEAN_HIRE|LEAN_NO_HIRE|NO_HIRE>",
  "summary": "<2-3 sentence overall assessment>",
  "top_strength": "<1 sentence>",
  "top_improvement": "<1 sentence>",
  "key_moments": [
    {
      "phase": "<clarify|entities|design|implement|evolve>",
      "question": "<the interviewer's question, near-verbatim>",
      "candidate_response": "<short summary of what the candidate said>",
      "expected_response": "<what a strong candidate would have said — specific>",
      "gap": "<1 sentence on what was wrong/missing; if positive, why it was strong>",
      "severity": "<major|minor|positive>"
    }
  ],
  "ideal_solution": {
    "summary": "<1-2 sentence sketch of the ideal design>",
    "sections": [
      {"title": "Scope & primary use cases", "content": "<3-5 bullet use cases the design must support>"},
      {"title": "Core entities & relationships", "content": "<list the main classes with their key attributes and how they relate>"},
      {"title": "Design patterns applied", "content": "<2-4 patterns with one-sentence justification each>"},
      {"title": "Code skeleton", "content": "<class signatures + key method bodies in ${language}, idiomatic, wrapped in triple backticks with the language tag (e.g. \\\`\\\`\\\`${language.toLowerCase()})>"},
      {"title": "SOLID checks", "content": "<how the design respects each principle: SRP, OCP, LSP, ISP, DIP — be specific>"},
      {"title": "Common pitfalls & extensions", "content": "<typical mistakes + how to evolve when a new feature is added>"}
    ]
  }
}

GUIDELINES for key_moments: include 4-7 concrete moments. Mix at least 1 positive. "question" = the actual prompt. "expected_response" must be specific to THIS design (e.g., "should have proposed Strategy pattern for pricing rules" not "should have used a design pattern"). "severity": "major" = god-class / missing pattern / broken SOLID · "minor" = could be sharper · "positive" = strong moment to keep.

GUIDELINES for ideal_solution: be specific to THIS problem. Code section MUST be in ${language}, wrapped in triple backticks. Use idiomatic ${language} class structure (Java: explicit access modifiers, abstract classes / interfaces; Python: ABC / Protocol; C++: virtual/override; Go: interfaces + structs).`;

/**
 * AI-generated LLD problem prompt.
 * Produces a Medium or Hard OO design problem actually asked at MAANG.
 * Variety comes from rotating across domains: payments, social, file systems,
 * concurrency, games, etc.
 */
export const LLD_CREATIVE_PROMPT = {
  system: `You are a low-level design (LLD) problem generator for MAANG-level interviews (Amazon, Google, Meta, Microsoft, Apple, Netflix, Uber, Airbnb, Stripe). You pick a Medium or Hard LLD problem that has actually been asked at those companies.

Problem characteristics:
1. Medium or Hard difficulty ONLY
2. Solvable in 45–60 minutes
3. Requires identifying clear entities, attributes, and relationships
4. Benefits from 2–3 design patterns (Strategy, State, Observer, Factory, Decorator, Composite, Command, Iterator, Template Method, Chain of Responsibility, Singleton-when-justified)
5. Non-trivial use cases that stress extensibility and SOLID principles
6. Clear scope statement: what the system should do + 2–3 key features/constraints

STYLE: Write like a real MAANG interviewer would drop it. Examples that qualify:
- "Design a Splitwise" (Uber) — expense splitting, groups, simplifications
- "Design a Movie Ticket Booking System" (Meta) — inventory, holds, pricing tiers
- "Design a File Sharing System" (Google) — permissions, links, versions
- "Design a Concurrent HashMap" (Amazon) — threading, locking, sharding
- "Design a Stack Overflow / Reddit-style Q&A" (Meta) — voting, reputation, moderation
- "Design a Cab Booking System" (Uber) — matching, pricing, state transitions
- "Design a Logger with rate limiting" (Amazon)
- "Design an Email Client" (Microsoft) — folders, threads, filters
- "Design a Deck of Cards + Blackjack" (Apple) — OO fundamentals
- "Design a Food Delivery App" (Amazon) — restaurants, orders, drivers
- "Design a Snake and Ladders game" (Meta)

IMPORTANT: vary the DOMAIN each time — don't always default to booking systems or games.

Respond ONLY with valid JSON, no markdown backticks.`,

  user: `Generate ONE Medium or Hard LLD problem commonly asked at MAANG companies. Vary the domain from typical picks.

Respond ONLY with JSON, no backticks:
{
  "title": "Design a <system>",
  "difficulty": "Medium" | "Hard",
  "company": "Amazon" | "Google" | "Meta" | "Microsoft" | "Apple" | "Netflix" | "Uber" | "Airbnb" | "Stripe",
  "description": "<1–3 sentence scope: what the system does + 2–3 key features/constraints>",
  "topics": ["<pattern/concept 1>", "<pattern/concept 2>", "<pattern/concept 3>", "<pattern/concept 4>"]
}`,
};

export const LLD_FALLBACK_SCORES = {
  scores: {
    clarification: { score: 3, feedback: "Basic scope captured." },
    entity_modeling: { score: 3, feedback: "Reasonable entities with some relationships." },
    patterns_solid: { score: 3, feedback: "Some pattern awareness shown." },
    code_quality: { score: 3, feedback: "Code was workable." },
    dry_run: { score: 3, feedback: "Partial dry run." },
    extensibility: { score: 3, feedback: "Design accommodates some change." },
  },
  overall_verdict: "LEAN_HIRE",
  summary: "The candidate demonstrated reasonable LLD fundamentals. Scoring was approximate due to a parsing issue.",
  top_strength: "Identified the core entities cleanly.",
  top_improvement: "Sharpen application of design patterns and SOLID principles.",
  key_moments: [],
  ideal_solution: null,
};
