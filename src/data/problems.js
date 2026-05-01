/**
 * Problem Bank — 50+ problems across 5 categories
 *
 * All problems are intentionally VAGUE — stated the way a real MAANG
 * interviewer would drop them. The candidate drives scope/clarification.
 *
 * Categories:
 *  - classic   → Frequently asked MAANG staples
 *  - infra     → Infrastructure / platform problems
 *  - data      → Data-intensive systems
 *  - realtime  → Real-time / low-latency systems
 *  - creative  → Unusual, scenario-based, out-of-the-box problems
 */

const CLASSIC = [
  { id: "url-shortener", title: "Design a URL Shortener", company: "Google", difficulty: "Medium", description: "Design a URL shortener.", topics: ["Hashing", "Database design", "Caching", "Load balancing", "Analytics"] },
  { id: "news-feed", title: "Design a News Feed", company: "Meta", difficulty: "Hard", description: "Design a news feed.", topics: ["Fan-out", "Message queues", "Caching", "Ranking", "Real-time updates"] },
  { id: "chat-system", title: "Design a Chat System", company: "Meta", difficulty: "Hard", description: "Design a chat application.", topics: ["WebSockets", "Message queues", "Delivery guarantees", "Presence", "Encryption"] },
  { id: "rate-limiter", title: "Design a Rate Limiter", company: "Amazon", difficulty: "Medium", description: "Design a rate limiter.", topics: ["Distributed systems", "Redis", "Algorithms", "Consistency", "Fault tolerance"] },
  { id: "search-engine", title: "Design a Search Engine", company: "Google", difficulty: "Hard", description: "Design a web search engine.", topics: ["Distributed storage", "MapReduce", "Inverted index", "Ranking", "Crawling"] },
  { id: "video-streaming", title: "Design a Video Platform", company: "Google", difficulty: "Hard", description: "Design a video streaming platform.", topics: ["CDN", "Transcoding", "Object storage", "Streaming protocols", "Recommendations"] },
  { id: "notification-system", title: "Design a Notification System", company: "Apple", difficulty: "Medium", description: "Design a notification system.", topics: ["Message queues", "Priority systems", "Rate limiting", "Template engine", "Analytics"] },
  { id: "ride-sharing", title: "Design a Ride-Sharing Service", company: "Uber", difficulty: "Hard", description: "Design a ride-sharing service.", topics: ["Geospatial", "Real-time systems", "Matching algorithms", "Location services", "Pricing"] },
  { id: "typeahead", title: "Design Typeahead Suggestions", company: "Google", difficulty: "Medium", description: "Design a typeahead suggestion system.", topics: ["Trie", "Caching", "Ranking", "Low latency", "Personalization"] },
  { id: "web-crawler", title: "Design a Web Crawler", company: "Google", difficulty: "Hard", description: "Design a web crawler.", topics: ["Distributed crawling", "URL frontier", "Politeness", "Deduplication", "Scheduling"] },
  { id: "pastebin", title: "Design Pastebin", company: "Amazon", difficulty: "Easy", description: "Design a pastebin service.", topics: ["Object storage", "Key generation", "Expiration", "Rate limiting", "CDN"] },
  { id: "instagram", title: "Design Instagram", company: "Meta", difficulty: "Hard", description: "Design a photo-sharing social network.", topics: ["Image storage", "News feed", "CDN", "Recommendations", "Search"] },
  { id: "dropbox", title: "Design Dropbox", company: "Google", difficulty: "Hard", description: "Design a file storage and sync service.", topics: ["Chunking", "Deduplication", "Sync protocol", "Conflict resolution", "Object storage"] },
  { id: "twitter-search", title: "Design Twitter Search", company: "Twitter", difficulty: "Hard", description: "Design a real-time tweet search system.", topics: ["Inverted index", "Real-time indexing", "Ranking", "Sharding", "Geosearch"] },
];

const INFRA = [
  { id: "distributed-cache", title: "Design a Distributed Cache", company: "Amazon", difficulty: "Hard", description: "Design a distributed caching system.", topics: ["Consistent hashing", "Replication", "Eviction policies", "Cache coherence", "Fault tolerance"] },
  { id: "task-scheduler", title: "Design a Task Scheduler", company: "Google", difficulty: "Hard", description: "Design a distributed task scheduler.", topics: ["Job queues", "Priority", "Exactly-once", "Failure recovery", "Cron scheduling"] },
  { id: "logging-system", title: "Design a Logging System", company: "Amazon", difficulty: "Medium", description: "Design a centralized logging and monitoring system.", topics: ["Log aggregation", "Time-series DB", "Alerting", "Sampling", "Distributed tracing"] },
  { id: "api-gateway", title: "Design an API Gateway", company: "Amazon", difficulty: "Medium", description: "Design an API gateway.", topics: ["Rate limiting", "Authentication", "Routing", "Load balancing", "Circuit breaker"] },
  { id: "ci-cd", title: "Design a CI/CD Pipeline", company: "Google", difficulty: "Medium", description: "Design a continuous integration and deployment system.", topics: ["Build orchestration", "Artifact storage", "Rollback", "Canary deploys", "Testing"] },
  { id: "feature-flags", title: "Design a Feature Flag System", company: "Meta", difficulty: "Medium", description: "Design a feature flag and configuration management system.", topics: ["Consistency", "Low latency reads", "Rollout strategies", "A/B testing", "Audit trail"] },
  { id: "service-discovery", title: "Design Service Discovery", company: "Netflix", difficulty: "Hard", description: "Design a service discovery and registration system.", topics: ["Health checking", "DNS", "Consistency", "Load balancing", "Failure detection"] },
  { id: "blob-storage", title: "Design Blob Storage", company: "Microsoft", difficulty: "Hard", description: "Design a blob storage service.", topics: ["Object storage", "Replication", "Metadata", "Erasure coding", "Multi-tenancy"] },
];

const DATA = [
  { id: "analytics-platform", title: "Design an Analytics Platform", company: "Google", difficulty: "Hard", description: "Design a real-time analytics platform.", topics: ["Stream processing", "OLAP", "Data pipeline", "Aggregation", "Visualization"] },
  { id: "recommendation-engine", title: "Design a Recommendation Engine", company: "Netflix", difficulty: "Hard", description: "Design a recommendation system.", topics: ["Collaborative filtering", "ML pipeline", "Feature store", "A/B testing", "Cold start"] },
  { id: "data-warehouse", title: "Design a Data Warehouse", company: "Amazon", difficulty: "Hard", description: "Design a data warehouse.", topics: ["Columnar storage", "ETL pipelines", "Partitioning", "Query optimization", "Schema design"] },
  { id: "time-series-db", title: "Design a Time-Series Database", company: "Datadog", difficulty: "Hard", description: "Design a time-series database for metrics.", topics: ["Write optimization", "Compression", "Downsampling", "Query patterns", "Retention"] },
  { id: "fraud-detection", title: "Design a Fraud Detection System", company: "Stripe", difficulty: "Hard", description: "Design a real-time fraud detection system.", topics: ["Stream processing", "ML inference", "Feature store", "Rules engine", "False positives"] },
  { id: "content-ranking", title: "Design a Content Ranking System", company: "TikTok", difficulty: "Hard", description: "Design a content ranking and discovery system.", topics: ["ML ranking", "Engagement prediction", "Exploration", "Cold start", "Feedback loops"] },
  { id: "search-ranking", title: "Design Search Ranking", company: "Google", difficulty: "Hard", description: "Design a search ranking and relevance system.", topics: ["ML ranking", "Feature engineering", "Online learning", "Evaluation metrics", "Personalization"] },
];

const REALTIME = [
  { id: "multiplayer-game", title: "Design a Multiplayer Game Backend", company: "Riot Games", difficulty: "Hard", description: "Design the backend for a real-time multiplayer game.", topics: ["State sync", "Tick rate", "Lag compensation", "Matchmaking", "Anti-cheat"] },
  { id: "live-comments", title: "Design Live Comments", company: "Meta", difficulty: "Medium", description: "Design a live comments system for streaming video.", topics: ["WebSockets", "Fan-out", "Spam filtering", "Rate limiting", "Ordering"] },
  { id: "stock-exchange", title: "Design a Stock Exchange", company: "Goldman Sachs", difficulty: "Hard", description: "Design a stock exchange matching engine.", topics: ["Order matching", "Low latency", "Sequencing", "Market data", "Fault tolerance"] },
  { id: "collaborative-editor", title: "Design a Collaborative Editor", company: "Google", difficulty: "Hard", description: "Design a real-time collaborative document editor.", topics: ["CRDT", "Operational transform", "Conflict resolution", "Presence", "Version history"] },
  { id: "auction-system", title: "Design an Auction System", company: "eBay", difficulty: "Hard", description: "Design a real-time auction platform.", topics: ["Concurrency", "Real-time bidding", "Consistency", "Timer management", "Fraud prevention"] },
  { id: "live-sports", title: "Design Live Sports Scores", company: "ESPN", difficulty: "Medium", description: "Design a live sports scoring platform.", topics: ["Real-time updates", "Fan-out", "CDN", "Push notifications", "Data ingestion"] },
  { id: "live-location", title: "Design Live Location Sharing", company: "Google", difficulty: "Medium", description: "Design a live location sharing system.", topics: ["Geospatial indexing", "WebSockets", "Battery optimization", "Privacy", "Proximity alerts"] },
];

const CREATIVE = [
  { id: "password-recovery", title: "Recover a Forgotten Password", company: "Twitter", difficulty: "Hard", description: "You forgot your password. There's an API that takes a userid and password and tells you if it's correct. Design a system to find your password as fast as possible.", topics: ["Distributed computing", "Partitioning", "Optimization", "Rate limiting", "Cost analysis"] },
  { id: "submarine-sync", title: "Submarine Data Sync", company: "Navy", difficulty: "Hard", description: "A submarine surfaces for 3 minutes every 6 hours. Design a system to sync all its data with HQ in that window.", topics: ["Intermittent connectivity", "Data prioritization", "Compression", "Conflict resolution", "Reliability"] },
  { id: "election-counting", title: "National Election Counter", company: "Government", difficulty: "Hard", description: "100 million people just voted. Design the counting system. You have 4 hours.", topics: ["Consistency", "Audit trail", "Fault tolerance", "Tamper resistance", "Real-time reporting"] },
  { id: "last-ticket", title: "The Last Concert Ticket", company: "Ticketmaster", difficulty: "Hard", description: "Two data centers need to sell the same last concert ticket without overselling. Design how.", topics: ["Distributed consensus", "Consistency", "Latency", "Conflict resolution", "Inventory"] },
  { id: "card-counter-detection", title: "Detect Card Counters", company: "Casino", difficulty: "Hard", description: "A casino wants to detect card counters in real-time across 500 blackjack tables. Design it.", topics: ["Stream processing", "Pattern detection", "Real-time analytics", "Edge computing", "ML inference"] },
  { id: "drone-gps-loss", title: "Drone Loses GPS", company: "Amazon", difficulty: "Hard", description: "A delivery drone just lost GPS signal over a city. Design the system that handles this.", topics: ["Fallback systems", "Dead reckoning", "Safety protocols", "Communication", "Recovery"] },
  { id: "six-degrees", title: "Six Degrees of Separation", company: "Meta", difficulty: "Hard", description: "Design a system that can tell you if any two people on Earth are within 6 handshakes of each other.", topics: ["Graph processing", "BFS at scale", "Sharding", "Distributed graph", "Approximation"] },
  { id: "vaccine-distribution", title: "Vaccine Distribution", company: "Government", difficulty: "Hard", description: "10 million vaccine doses just arrived. 50 million people are eligible. Design the distribution system.", topics: ["Supply chain", "Scheduling", "Prioritization", "Cold chain tracking", "Equity"] },
  { id: "elevator-system", title: "Smart Elevator System", company: "Amazon", difficulty: "Medium", description: "Design the elevator control system for a 100-floor building with 20 elevators.", topics: ["Scheduling algorithms", "Optimization", "Real-time", "Load balancing", "Failure handling"] },
  { id: "plagiarism-detector", title: "Plagiarism Across Billions of Docs", company: "Google", difficulty: "Hard", description: "A student submitted a paper. Check if any sentence was copied from any of 10 billion documents on the internet.", topics: ["Fingerprinting", "MinHash", "Distributed comparison", "Indexing", "Similarity"] },
  { id: "disaster-alert", title: "30-Second Disaster Alert", company: "Government", difficulty: "Hard", description: "An earthquake just hit. Design a system that alerts everyone in the affected area within 30 seconds.", topics: ["Geofencing", "Push notification", "Redundancy", "Broadcast", "Priority"] },
  { id: "music-royalty", title: "Music Royalty Splitter", company: "Spotify", difficulty: "Hard", description: "Every time a song plays, 6 different people need to get paid. Design the system.", topics: ["Event streaming", "Attribution", "Ledger", "Eventual consistency", "Reconciliation"] },
  { id: "hospital-scheduler", title: "Operating Room Scheduler", company: "Hospital", difficulty: "Hard", description: "A hospital has 50 operating rooms. Surgeries run long, get cancelled, and emergencies come in. Design the scheduling system.", topics: ["Priority queues", "Real-time rescheduling", "Resource allocation", "Conflict resolution", "Notification"] },
  { id: "airline-overbooking", title: "Airline Seat Chaos", company: "Amazon", difficulty: "Hard", description: "10 million people are trying to book seats on the same flight at the same moment. Design a system that doesn't oversell.", topics: ["Concurrency", "Distributed locks", "Inventory", "Overbooking strategy", "Consistency"] },
  { id: "deep-sea-monitoring", title: "Deep Sea Sensor Network", company: "NASA", difficulty: "Hard", description: "Sensors on the ocean floor send data through underwater acoustic modems at 100 bytes/second with 40% packet loss. Design the monitoring system.", topics: ["Lossy networks", "Compression", "Store-and-forward", "Anomaly detection", "Edge computing"] },
  { id: "genome-search", title: "DNA Pattern Search", company: "Google", difficulty: "Hard", description: "Search for a specific gene pattern across a 3-billion base pair human genome in under a second.", topics: ["Pattern matching", "Indexing", "Compression", "Distributed search", "Bioinformatics"] },
  { id: "food-waste-tracker", title: "Food Waste Reducer", company: "Amazon", difficulty: "Medium", description: "A grocery chain has 10,000 stores. Food is expiring on shelves. Design a system to minimize waste.", topics: ["IoT ingestion", "Time-based alerts", "Prediction", "Supply chain routing", "Pricing"] },
  { id: "escape-room", title: "Online Escape Room", company: "Netflix", difficulty: "Medium", description: "Four strangers on different continents need to solve puzzles together in real-time. Design the platform.", topics: ["Real-time sync", "State management", "Timers", "Matchmaking", "Puzzle engine"] },
  { id: "carbon-tracker", title: "Carbon Footprint Per Transaction", company: "Stripe", difficulty: "Medium", description: "Calculate the carbon footprint of every single credit card transaction in real-time.", topics: ["Event processing", "Third-party APIs", "Estimation models", "Aggregation", "Reporting"] },
  { id: "traffic-light-ai", title: "Smart Traffic Lights", company: "Google", difficulty: "Medium", description: "Every traffic light in a city of 5 million people needs to coordinate. Design the system.", topics: ["Sensor networks", "Optimization", "Real-time", "Edge computing", "Simulation"] },
];

// ─── Exports ───────────────────────────────────────────────────────────

export const PROBLEM_CATEGORIES = [
  { id: "classic", label: "Classic MAANG", problems: CLASSIC },
  { id: "infra", label: "Infrastructure", problems: INFRA },
  { id: "data", label: "Data-Intensive", problems: DATA },
  { id: "realtime", label: "Real-Time", problems: REALTIME },
  { id: "creative", label: "Creative / Scenario", problems: CREATIVE },
];

export const ALL_PROBLEMS = [...CLASSIC, ...INFRA, ...DATA, ...REALTIME, ...CREATIVE];

export function getRandomProblem({ category, difficulty } = {}) {
  let pool = ALL_PROBLEMS;
  if (category) {
    const cat = PROBLEM_CATEGORIES.find((c) => c.id === category);
    if (cat) pool = cat.problems;
  }
  if (difficulty) pool = pool.filter((p) => p.difficulty === difficulty);
  if (pool.length === 0) pool = ALL_PROBLEMS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * AI creative problem generation prompt.
 * Produces UNUSUAL scenario-based problems, not generic "Design a ___" questions.
 */
export const CREATIVE_PROBLEM_PROMPT = {
  system: `You are a creative system design interview problem generator for MAANG-level interviews. You create problems that are UNUSUAL, SURPRISING, and SCENARIO-BASED.

Your problems should NOT sound like textbook system design questions. Instead, they should:
1. Start from an unexpected real-world scenario or constraint
2. Hide a deep distributed systems / optimization problem inside a simple-sounding setup
3. Force the candidate to discover the hard parts themselves
4. Be stated in 1-2 SHORT sentences, deliberately vague

STYLE GUIDE — your problems should sound like these:
- "You forgot your password. There's an API that tells you if a guess is correct. Design a system to find your password."
- "A submarine surfaces once every 6 hours for 3 minutes. Design a system to sync its data with HQ."
- "100 million people just voted. Design the counting system. You have 4 hours."
- "A hospital has 50 operating rooms. Surgeries can run long or get cancelled. Design the scheduling system."
- "You have a fleet of drones delivering packages. One just lost GPS signal over a city. Design the system that handles this."
- "A casino wants to detect card counters in real-time across 500 tables. Design it."
- "Two data centers need to sell the same last concert ticket without overselling. Design how."
- "Design a system that can tell you whether any two people on Earth are within 6 handshakes of each other."

CRITICAL: NEVER generate these overused problems — URL shortener, Twitter/feed, chat app, ride-sharing, video streaming, notification system, rate limiter, search engine, or anything that starts with "Design a [well-known product]." You must be creative and original.

Respond ONLY with valid JSON.`,

  user: `Generate one creative system design interview problem. Requirements:
1. It must be a SCENARIO — paint a vivid situation in 1-2 sentences
2. It should hide a genuinely hard distributed systems challenge inside a surprising setup
3. Keep it vague — do NOT list features, scale, or constraints
4. It must NOT resemble any common textbook problem
5. Think about unusual domains: underwater, space, biology, casinos, disasters, logistics, sports, music, legal, medical, military, IoT, agriculture, etc.

Respond ONLY with JSON, no backticks:
{"title": "<short catchy title>", "description": "<1-2 sentence scenario>", "difficulty": "Hard", "topics": ["topic1", "topic2", "topic3", "topic4", "topic5"]}`,
};
