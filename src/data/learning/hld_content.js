/**
 * HLD sub-topic content
 * Key: "stageNum-topicIndex" (1-based stage, 0-based topic)
 *
 * Teaching philosophy:
 * - Every concept is introduced by a FEATURE that demands it
 * - Start with a problem, introduce the concept as the solution
 * - Code always applies to the running social media app — never generic examples
 * - Each topic ends by showing what it enables AND what breaks next (drives the next topic)
 */

export const HLD_CONTENT = {

  // ══════════════════════════════════════════════════════════════
  // STAGE 1: The Monolith — Post & Follow MVP
  // ══════════════════════════════════════════════════════════════

  "1-0": [ // Monolithic architecture
    { t: "callout", variant: "info", title: "What we're building", text: "A simple social app: users sign up, write text posts (280 chars), and follow other users to see their posts in a feed. Nothing more. Just enough to prove the idea works." },
    { t: "h3", text: "The first decision: how do we structure this?" },
    { t: "p", text: "Before writing a single line of code, we have to decide: do we build one big application, or split everything into separate services from day one?" },
    { t: "p", text: "The honest answer: start with a monolith. One codebase. One server. One database. All the features — auth, posting, following, feed — live together and deploy together." },
    { t: "code", lang: "text", code: `Our social app — monolith structure:

  [Mobile App]  [Web Browser]
        │              │
        └──────┬────────┘
               │ HTTP
    ┌──────────▼──────────────┐
    │      App Server         │
    │  ┌──────────────────┐   │
    │  │  Auth module     │   │
    │  ├──────────────────┤   │
    │  │  Posts module    │   │
    │  ├──────────────────┤   │
    │  │  Follow module   │   │
    │  ├──────────────────┤   │
    │  │  Feed module     │   │
    │  └──────────────────┘   │
    └──────────┬──────────────┘
               │
    ┌──────────▼──────────────┐
    │      PostgreSQL         │
    └─────────────────────────┘` },
    { t: "h3", text: "Why not microservices from the start?" },
    { t: "p", text: "It's tempting to split the app into separate Feed Service, User Service, and Post Service right away. Don't. Here's what you'd be signing up for on day one:" },
    { t: "bullet-list", items: [
      "Network calls between services — a simple feed load now makes 3 HTTP calls instead of 3 function calls. Latency, failures, and timeouts all multiply.",
      "Distributed transactions — when a user posts, both the Posts DB and the Feed DB need to update atomically. In a monolith this is a single SQL transaction. In microservices it requires a saga pattern, which is a significant engineering problem.",
      "Operational overhead — separate deployments, separate logs, separate health checks. You'd spend more time on infrastructure than on features.",
      "Team coupling isn't a problem yet — microservices solve team scaling. One team can ship a monolith faster.",
    ]},
    { t: "h3", text: "When does the monolith start hurting?" },
    { t: "p", text: "Not immediately. The monolith works fine until one of these happens:" },
    { t: "numbered-list", items: [
      { title: "A component needs to scale independently", text: "Image transcoding burns CPU. You want more CPU for that module only — but with a monolith, you have to scale the entire app. At 5 million users you'll notice this. We'll fix it in Stage 7 (Microservices)." },
      { title: "Teams block each other", text: "Once you have 4+ teams, they constantly conflict on the same codebase. Merge conflicts, test suite slowdowns, coordinated deployments. This is the real trigger for breaking up the monolith." },
      { title: "A subsystem needs a different tech stack", text: "The recommendations team wants Python/PyTorch. The monolith is Java. Impossible without extraction." },
    ]},
    { t: "callout", variant: "tip", title: "The 3-team rule", text: "Microservices start paying off when you have 3+ independent teams and 2+ components that need to scale differently. Before that, a well-structured monolith ships faster and costs less to operate. Most successful startups (Instagram, Twitter, Shopify) stayed monolithic far longer than people expect." },
    { t: "interview-tip", text: "If an interviewer asks 'Design Instagram', don't open with microservices. Say: 'I'll start with a monolith — single Rails/Spring app, single PostgreSQL database. This is what Instagram actually ran on for the first two years and it handled 30M users. I'll evolve the architecture as specific bottlenecks appear.' That answer shows engineering judgment, not just pattern matching." },
  ],

  "1-1": [ // Relational schema design
    { t: "callout", variant: "info", title: "Feature: Sign up, post, and follow", text: "Users need to create accounts, write posts, and follow other users. We need to store all of this. Let's design the database schema starting from what users actually do — then derive the tables from the actions." },
    { t: "h3", text: "Start with the actions, then derive the tables" },
    { t: "p", text: "Rather than guessing at tables, list every action a user takes and what data it needs to store or retrieve:" },
    { t: "bullet-list", items: [
      "Sign up → store username, email, hashed password",
      "Write a post → store the text, who wrote it, when",
      "Follow a user → store who is following whom",
      "See my feed → retrieve posts from people I follow, newest first",
    ]},
    { t: "p", text: "From these four actions, exactly three tables emerge: users, posts, and follows." },
    { t: "h3", text: "Building the schema piece by piece" },
    { t: "code", lang: "sql", code: `-- Action: Sign up
-- Need to store: name, email (must be unique), password, join date
CREATE TABLE users (
  id           BIGINT       PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  username     VARCHAR(30)  NOT NULL UNIQUE,
  email        VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,   -- never plaintext (Topic 1-3)
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Action: Write a post
-- Need to store: the text, who wrote it, when
-- author_id links back to users — ON DELETE CASCADE means
-- if a user deletes their account, all their posts go too
CREATE TABLE posts (
  id         BIGINT       PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  author_id  BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT         NOT NULL CHECK (char_length(content) <= 280),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);` },
    { t: "h3", text: "Modeling the follow relationship — the junction table" },
    { t: "p", text: "The follow action is a many-to-many relationship: user A can follow many users, and can be followed by many users. You can't store this in either the users or posts table. You need a separate junction table:" },
    { t: "code", lang: "sql", code: `-- Action: Follow a user
-- A follow is a relationship between two users.
-- This is a many-to-many: one user can follow thousands, and be followed by thousands.
CREATE TABLE follows (
  follower_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),  -- composite key prevents duplicate follows
  CHECK (follower_id <> followee_id)        -- you can't follow yourself
);` },
    { t: "h3", text: "Building the feed query" },
    { t: "p", text: "Now the key query: when a user opens the app, show them the latest posts from everyone they follow. Let's build this step by step:" },
    { t: "code", lang: "sql", code: `-- Step 1: Who does user 42 follow?
SELECT followee_id FROM follows WHERE follower_id = 42;
-- Returns: [7, 19, 55, 103, 210, ...]

-- Step 2: Get their latest posts
SELECT p.id, p.content, p.created_at, u.username
FROM   posts p
JOIN   users u ON u.id = p.author_id
WHERE  p.author_id IN (
         SELECT followee_id FROM follows WHERE follower_id = 42
       )
ORDER BY p.created_at DESC
LIMIT 20;` },
    { t: "h3", text: "Adding indexes — making the queries fast" },
    { t: "p", text: "Without indexes, every feed query scans the entire posts table. With 10 million posts and 100K users hitting the feed per second, this immediately kills the database. We add indexes for every query pattern:" },
    { t: "code", lang: "sql", code: `-- Feed query: posts by a specific author, sorted by time
CREATE INDEX idx_posts_author_created ON posts (author_id, created_at DESC);

-- "Who does user X follow?" — used in the feed subquery
CREATE INDEX idx_follows_follower ON follows (follower_id);

-- "Who follows user X?" — used for follower count and notifications
CREATE INDEX idx_follows_followee ON follows (followee_id);` },
    { t: "h3", text: "The first scaling problem: pagination" },
    { t: "p", text: "The feed query returns 20 posts. The user scrolls down and wants the next 20. How do we fetch page 2? There are two approaches — one that breaks at scale, and one that doesn't." },
    { t: "code", lang: "sql", code: `-- ❌ OFFSET pagination — simple but broken at scale
SELECT ... FROM posts WHERE author_id IN (...)
ORDER BY created_at DESC
LIMIT 20 OFFSET 200;   -- Page 11. DB scans 220 rows to return 20.
                        -- At page 1000, it scans 20,020 rows. Gets worse every page.

-- ✅ CURSOR pagination — fast at any depth
-- First page: returns normally, include the last post's (created_at, id) as cursor
SELECT ... FROM posts WHERE author_id IN (...)
ORDER BY created_at DESC
LIMIT 20;
-- → Return to client: { posts: [...], next_cursor: "2024-01-15T10:30:00|9854" }

-- Next page: use the cursor as a WHERE condition
SELECT ... FROM posts
WHERE  author_id IN (...)
  AND  (created_at, id) < ('2024-01-15T10:30:00', 9854)  -- keyset condition
ORDER BY created_at DESC
LIMIT 20;
-- Uses the index directly — O(log N) regardless of page depth.` },
    { t: "callout", variant: "warning", title: "What breaks next", text: "The feed query works when a user follows 10 people. When a user follows 500 people, the IN (...) subquery returns 500 IDs and the JOIN becomes expensive. At 100K concurrent users, each running this query hits the single database simultaneously. This is exactly the bottleneck Stage 2 (Caching) solves." },
    { t: "interview-tip", text: "When asked about schema design, always walk through your reasoning: 'I start with the user actions, derive the tables, then add indexes for each query pattern.' Also mention cursor vs offset pagination — it shows you've thought beyond the happy path. Saying 'I'd use cursor pagination because OFFSET degrades linearly with page depth' is a detail that stands out." },
  ],

  "1-2": [ // API design fundamentals
    { t: "callout", variant: "info", title: "Feature: Clients talking to the server", text: "We have a database schema. Now our mobile app and web browser need to create users, write posts, follow people, and load the feed. We need an API — a contract that defines exactly how clients talk to the server." },
    { t: "h3", text: "REST: organizing the API around resources" },
    { t: "p", text: "We'll use REST, where every URL is a resource (a thing) and HTTP methods express the action on it. Let's build the API endpoints from our four features, one feature at a time." },
    { t: "h3", text: "Feature: User registration and profile" },
    { t: "code", lang: "text", code: `POST /users
Request:  { "username": "alice", "email": "alice@example.com", "password": "..." }
Response: 201 Created
          { "id": 42, "username": "alice", "created_at": "2024-01-15T10:30:00Z" }
          Location: /users/42    ← tells client where the new resource lives

GET /users/:id
Response: 200 OK
          { "id": 42, "username": "alice", "bio": "...", "follower_count": 1203 }` },
    { t: "h3", text: "Feature: Posting" },
    { t: "code", lang: "text", code: `POST /posts
Authorization: Bearer <token>   ← must be logged in to post
Request:  { "content": "Hello world! Building a social app." }
Response: 201 Created
          { "id": 9854, "content": "...", "author": { "id": 42, "username": "alice" },
            "created_at": "2024-01-15T10:30:00Z" }

GET /posts/:id
Response: 200 OK   { "id": 9854, "content": "...", "author": {...} }

DELETE /posts/:id
Authorization: Bearer <token>   ← only the author can delete
Response: 204 No Content        ← success with no body` },
    { t: "h3", text: "Feature: Following and the feed" },
    { t: "code", lang: "text", code: `POST /users/:id/follows
Authorization: Bearer <token>
Request:  { "followee_id": 103 }
Response: 201 Created   { "follower_id": 42, "followee_id": 103 }

DELETE /users/:id/follows/:followee_id
Authorization: Bearer <token>
Response: 204 No Content

GET /feed
Authorization: Bearer <token>
Query params: ?limit=20&cursor=2024-01-15T10:30:00|9854
Response: 200 OK
          {
            "posts": [
              { "id": 9853, "content": "...", "author": {...}, "created_at": "..." },
              ...
            ],
            "next_cursor": "2024-01-14T08:15:00|9201"  ← null when no more pages
          }` },
    { t: "h3", text: "Idempotency: handling retries safely" },
    { t: "p", text: "Mobile networks drop. The app retries. Without idempotency, a retry on 'POST /posts' creates the post twice. The fix: the client generates a unique key for each intended action and sends it as a header. The server uses it to deduplicate." },
    { t: "code", lang: "text", code: `POST /posts
Idempotency-Key: a8f3-d2c1-4b9e  ← client-generated UUID for this specific action
{ "content": "Hello world!" }

Server logic:
  1. Check Redis: have we seen "a8f3-d2c1-4b9e" before?
  2. YES → return the original response (no new post created)
  3. NO  → create the post, store (key → post_id) in Redis with 24h TTL, return 201` },
    { t: "h3", text: "HTTP status codes — use them correctly" },
    { t: "bullet-list", items: [
      "201 Created — POST that creates a resource (include Location header)",
      "204 No Content — DELETE or PUT with no response body",
      "400 Bad Request — validation failed (e.g., post over 280 chars) — include error details",
      "401 Unauthorized — missing or invalid auth token",
      "403 Forbidden — authenticated but not allowed (trying to delete someone else's post)",
      "409 Conflict — resource already exists (following someone you already follow)",
      "429 Too Many Requests — rate limited (include Retry-After header)",
    ]},
    { t: "callout", variant: "warning", title: "Common mistake: 200 with error in body", text: "Never return HTTP 200 with { 'error': 'validation failed' } in the body. Clients check the HTTP status code first. A 200 with error body breaks every HTTP middleware, logging system, and mobile SDK that exists. Use the right status code." },
    { t: "interview-tip", text: "Two things that impress interviewers in API design: (1) Idempotency keys for non-idempotent operations — shows you've thought about retries and distributed systems. (2) Versioning strategy: 'I'd put the version in the URL (/v1/posts) so breaking changes in v2 don't affect existing clients.' Both show that you design APIs for production, not just for demos." },
  ],

  "1-3": [ // Authentication basics
    { t: "callout", variant: "info", title: "Feature: Login", text: "Users have accounts. Now they need to log in. The server has to answer: 'Is this person who they say they are?' — and then remember the answer for every subsequent request without them typing their password again." },
    { t: "h3", text: "Problem 1: Storing passwords safely" },
    { t: "p", text: "If we store passwords as plaintext and the database is leaked, every user's password is immediately compromised — and since people reuse passwords, it compromises their other accounts too. We never store the password itself, only a one-way hash of it." },
    { t: "code", lang: "java", code: `// ❌ NEVER do any of these
store(password);           // plaintext — if DB leaks, everyone is exposed
store(md5(password));      // MD5 is too fast — 10 billion guesses/sec on modern GPU
store(sha256(password));   // still too fast — same problem

// ✅ bcrypt: deliberately slow, includes a random salt per password
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12); // cost factor 12

// Registration: hash before storing
String hash = encoder.encode("user_raw_password");
// → "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCkgkDe9hVbJB9wJL..." (60 chars)
// The hash includes the salt — every hash is different even for same password

// Login: verify
boolean correct = encoder.matches("user_raw_password", storedHash); // true or false

// Cost factor 12 = ~250ms per hash on modern hardware
// Brute-forcing 100M common passwords takes 250ms × 100M = ~290 days
// On MD5: same 100M guesses takes ~10 milliseconds` },
    { t: "h3", text: "Problem 2: Staying logged in — sessions" },
    { t: "p", text: "HTTP is stateless — the server has no memory between requests. After login, the user hits 'GET /feed' and the server has forgotten who they are. We need a way to identify them on every request without them re-entering their password." },
    { t: "p", text: "Sessions solve this: on login, the server creates a session record, gives the client a session ID in a cookie, and the client sends that cookie on every request." },
    { t: "code", lang: "text", code: `LOGIN FLOW:
POST /auth/login { email: "alice@example.com", password: "secret" }

Server:
  1. Find user by email
  2. Verify password: bcrypt.matches(password, user.password_hash) → true
  3. Create session in Redis:
     SET session:abc123xyz { user_id: 42, expires: "+7d" }
  4. Return cookie:
     Set-Cookie: session=abc123xyz; HttpOnly; Secure; SameSite=Strict; Max-Age=604800

SUBSEQUENT REQUESTS:
GET /feed
Cookie: session=abc123xyz   ← browser sends this automatically

Server:
  1. Extract session ID from cookie: "abc123xyz"
  2. Redis GET session:abc123xyz → { user_id: 42 }
  3. User is authenticated as user 42. Continue.

LOGOUT:
DELETE /auth/session

Server:
  1. Redis DEL session:abc123xyz  ← session is immediately invalid
  2. Clear the cookie` },
    { t: "h3", text: "Why HttpOnly cookies — not localStorage" },
    { t: "p", text: "Many tutorials store tokens in JavaScript's localStorage. This is a security mistake. Any JavaScript on the page — including third-party analytics or ads — can read localStorage. If there's an XSS vulnerability anywhere on the site, attackers steal every user's token." },
    { t: "p", text: "HttpOnly cookies are inaccessible to JavaScript entirely. Even if XSS code runs, it cannot read the cookie. The browser handles cookie attachment automatically on every request." },
    { t: "callout", variant: "info", title: "Sessions vs JWT tokens", text: "JWT tokens are an alternative: the server signs a token containing the user ID, and the client sends it in the Authorization header. The server verifies the signature — no Redis lookup needed. Tradeoff: JWT tokens can't be invalidated before expiry. If a user's account is compromised and you want to force-logout, you can't with pure JWTs. For a social app where you need account suspension and forced logout, sessions win. JWT makes sense for stateless APIs (mobile SDKs, third-party integrations)." },
    { t: "interview-tip", text: "When discussing auth, mention two security details that most candidates miss: (1) SameSite=Strict on cookies prevents CSRF attacks — a malicious site can't make requests to your API using the user's cookies. (2) Bcrypt cost factor — explain that it's deliberately slow, and that the cost factor should be tuned so hashing takes ~100-300ms on your hardware, making offline brute-force attacks impractical." },
  ],

  "1-4": [ // Estimation & capacity planning
    { t: "callout", variant: "info", title: "Before we scale: check the numbers", text: "We have a working monolith. But can it actually handle the load? Before adding any complexity, we should understand what load we're designing for. This tells us which components to worry about first — and which optimizations are premature." },
    { t: "h3", text: "Step 1: Define the scale" },
    { t: "p", text: "Let's say we're building for 10 million daily active users (DAU). That's a meaningful scale — bigger than most apps, small enough that we're not yet at Google scale. All numbers flow from this." },
    { t: "h3", text: "Step 2: Calculate read and write QPS" },
    { t: "p", text: "Social media is heavily read-skewed. Users read their feed many times but post infrequently. A typical ratio is 100 reads per write." },
    { t: "code", lang: "text", code: `Users: 10M DAU

Post writes:
  Assumption: average user posts once per day
  10M posts/day ÷ 86,400 sec/day = ~116 posts/sec (average)
  Peak (3× average)             = ~350 posts/sec

Feed reads (100:1 read:write ratio):
  10M DAU × ~10 feed loads/day  = 100M feed requests/day
  100M ÷ 86,400                 = ~1,160 feed reads/sec (average)
  Peak (3× average)             = ~3,500 feed reads/sec

Follow actions:
  Smaller — maybe 0.1 per user per day
  10M × 0.1 ÷ 86,400 = ~12 follow actions/sec` },
    { t: "h3", text: "Step 3: Calculate storage" },
    { t: "code", lang: "text", code: `Post text:
  116 posts/sec × 200 bytes/post × 86,400 sec = ~2 GB/day
  × 365 days = ~730 GB/year  → a single SSD handles this easily

User profiles:
  10M users × 500 bytes/user = 5 GB  → trivial

Profile images (if we add them later):
  10M users × 200 KB average = 2 TB  → needs object storage (S3)

Video posts:
  Even if only 1% of posts are 30-sec videos at 10 MB each:
  116 posts/sec × 1% × 10 MB = 11.6 MB/sec = ~1 TB/day
  → This is a Stage 4 problem (Media Pipeline)` },
    { t: "h3", text: "Step 4: Check what our monolith can handle" },
    { t: "code", lang: "text", code: `Our components at peak load (3,500 feed reads/sec):

PostgreSQL (single node):
  Can handle: ~5,000 simple reads/sec
  Our feed read: complex JOIN + subquery
  Realistic throughput for feed query: ~500-1,000/sec
  Our demand: 3,500/sec  → ❌ DATABASE IS THE BOTTLENECK

App server (single node):
  Can handle: ~10,000 HTTP requests/sec (simple endpoints)
  Our demand: 3,500/sec  → ✅ Fine for now

Network (1 Gbps NIC):
  Feed response: ~5 KB (20 posts × 250 bytes)
  3,500 req/sec × 5 KB = 17.5 MB/sec = 140 Mbps  → ✅ Fine` },
    { t: "callout", variant: "warning", title: "The diagnosis: database is the bottleneck", text: "At 10M DAU, our single PostgreSQL instance gets hit with 3,500 complex feed queries per second. It can only handle ~500/sec before response times spike. The fix: a caching layer that intercepts the 90% of reads that are for the same popular content. That's exactly what Stage 2 (Redis Caching) adds." },
    { t: "interview-tip", text: "In an interview, estimation isn't about getting exact numbers — it's about identifying the bottleneck. Walk through: users → QPS → compare against component limits → find what breaks first → that's your first architectural problem to solve. Always end with: 'This tells me the [database / network / app server] is the first thing I need to address.' The numbers justify the architecture, not the other way around." },
  ],


  // ══════════════════════════════════════════════════════════════
  // STAGE 2: Scaling Reads — Caching Layer
  // ══════════════════════════════════════════════════════════════

  "2-0": [ // Caching strategies
    { t: "callout", variant: "info", title: "The problem from Stage 1", text: "Our estimation showed: the database gets 3,500 feed reads/sec at peak. PostgreSQL maxes out at ~500/sec for complex feed queries. The app is already slow for users. We need to stop hitting the database for every single read." },
    { t: "h3", text: "The insight: most reads are for the same data" },
    { t: "p", text: "On a social app, the same content gets read over and over. A popular post by a celebrity gets fetched by millions of followers. A user's profile is loaded every time someone views them. The database does identical work for each of those reads. A cache breaks that pattern — compute once, serve from memory many times." },
    { t: "h3", text: "Strategy 1: Cache-aside (the default choice)" },
    { t: "p", text: "The application controls the cache explicitly. On a read: check cache first. If the data is there (cache hit), return it. If not (cache miss), read from the database, store in cache, return. This is what we'll use for our social app." },
    { t: "code", lang: "java", code: `// Cache-aside for user profiles
public User getUser(Long userId) {
    String cacheKey = "user:" + userId;

    // 1. Check cache first
    User cached = redis.get(cacheKey, User.class);
    if (cached != null) {
        return cached;  // cache hit — no DB call
    }

    // 2. Cache miss: read from DB
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new NotFoundException("User not found"));

    // 3. Store in cache with a TTL (time-to-live)
    redis.set(cacheKey, user, Duration.ofMinutes(30));

    return user;
}

// Cache hit ratio on user profiles: ~95%+
// If 1M requests/hour hit getUser(), only ~50K reach the DB` },
    { t: "h3", text: "Strategy 2: Write-through" },
    { t: "p", text: "Every write goes to the cache AND the database simultaneously. The cache is always warm. Cost: slower writes (two round-trips). Benefit: zero cache misses after first write. Good for data that's written infrequently but read constantly (user preferences, settings)." },
    { t: "code", lang: "java", code: `public User updateUserBio(Long userId, String newBio) {
    // Write to DB and cache at the same time
    User user = userRepository.updateBio(userId, newBio);
    redis.set("user:" + userId, user, Duration.ofMinutes(30)); // update cache immediately
    return user;
    // Next read hits cache — not the DB. No stale data.
}` },
    { t: "h3", text: "Which strategy fits our social app?" },
    { t: "bullet-list", items: [
      "User profiles → cache-aside with 30-minute TTL. Profiles change rarely. A stale bio for 30 minutes is acceptable.",
      "Post content → cache-aside. Posts are immutable after creation — set a long TTL (24h).",
      "Feed (list of post IDs) → cache-aside, but with Redis sorted sets — we'll cover this in the Redis deep-dive.",
      "Follower/following counts → write-through. Counts change on every follow/unfollow and users expect them to update immediately.",
      "Auth sessions → always in Redis (not a cache, but Redis as primary store). Sessions don't exist in the DB.",
    ]},
    { t: "callout", variant: "tip", title: "TTL is your safety net", text: "Even if cache invalidation logic has a bug, a TTL ensures data eventually becomes fresh. Think of TTL as your last line of defense against stale data. Short TTL = more DB reads but fresher data. Long TTL = fewer DB reads but more staleness. For a social feed, 5-minute staleness is usually acceptable. For a bank balance, 0 seconds." },
    { t: "interview-tip", text: "When discussing caching strategy, always connect it to the access pattern: 'For profiles, cache-aside with a 30-min TTL — they're read 100× for every 1 write, and brief staleness is acceptable. For follower counts, write-through — users notice when these lag.' That kind of specificity shows you're reasoning about the actual product, not just reciting patterns." },
  ],

  "2-1": [ // Redis deep-dive
    { t: "callout", variant: "info", title: "Why Redis, and what it actually is", text: "Redis is an in-memory data structure server — not just a key-value store. The key insight is that it stores your data in the right data structure for your query pattern, not as a blob you have to parse. This is why it's so fast for social media use cases." },
    { t: "h3", text: "Data structure 1: Strings — for profiles and post content" },
    { t: "p", text: "The simplest structure. A key maps to a value. We use JSON serialization for structured objects:" },
    { t: "code", lang: "java", code: `// Store a user profile (JSON string in Redis)
String key = "user:42";
String json = objectMapper.writeValueAsString(user);
redis.set(key, json, Duration.ofMinutes(30));  // expires in 30 minutes

// Read back
String cached = redis.get("user:42");
User user = objectMapper.readValue(cached, User.class);

// Post content (immutable after creation — long TTL)
redis.set("post:9854", postJson, Duration.ofHours(24));

// Simple counter (atomic increment — no race conditions)
redis.incr("post:9854:like_count");   // atomic: like
redis.decr("post:9854:like_count");   // atomic: unlike
Long count = redis.get("post:9854:like_count", Long.class);` },
    { t: "h3", text: "Data structure 2: Sorted Sets — for the feed" },
    { t: "p", text: "The feed is a ranked list of post IDs, ordered by timestamp. Sorted sets store members with a score — perfect for this. The score is the timestamp (as Unix epoch), the member is the post ID. We get time-ordered retrieval for free." },
    { t: "code", lang: "java", code: `// When user 42 publishes post 9854:
// → Add post ID to each follower's feed sorted set
// score = timestamp (Unix epoch), member = post ID
double score = Instant.now().getEpochSecond();
redis.zadd("feed:follower_1", score, "9854");
redis.zadd("feed:follower_2", score, "9854");
// ... for each of user 42's followers

// When follower loads their feed (newest first):
// ZREVRANGEBYSCORE returns members with highest score first
List<String> postIds = redis.zrevrange("feed:42", 0, 19);
// → ["9902", "9895", "9854", "9821", ...]  (20 most recent post IDs)

// Cursor pagination: use the score (timestamp) of the last item
double lastScore = Double.parseDouble(lastTimestamp);
List<String> nextPage = redis.zrevrangebyscore(
    "feed:42", lastScore - 1, 0, 0, 20);  // next 20 older than cursor

// Trim feed to 800 entries — don't let sorted sets grow forever
redis.zremrangebyrank("feed:42", 0, -801);  // keep newest 800` },
    { t: "h3", text: "Data structure 3: Sets — for follower/following lists" },
    { t: "code", lang: "java", code: `// Who does user 42 follow?
redis.sadd("following:42", "7", "19", "55", "103");

// Who follows user 42?
redis.sadd("followers:42", "100", "201", "503");

// Does user 42 follow user 7? (O(1) lookup)
boolean follows = redis.sismember("following:42", "7");

// Mutual friends between user 42 and user 100: set intersection
Set<String> mutual = redis.sinter("following:42", "following:100");

// Follower count (O(1) — don't COUNT(*) from DB)
Long count = redis.scard("followers:42");` },
    { t: "h3", text: "Data structure 4: Hashes — for user settings" },
    { t: "code", lang: "java", code: `// Store individual fields — update one field without re-serializing entire object
redis.hset("user:42:settings",
    "notifications_email", "true",
    "notifications_push", "false",
    "theme", "dark");

// Read one field (much more efficient than reading and deserializing full JSON)
String emailPref = redis.hget("user:42:settings", "notifications_email");

// Update one field without touching others
redis.hset("user:42:settings", "theme", "light");` },
    { t: "h3", text: "TTL and eviction — keeping memory bounded" },
    { t: "code", lang: "text", code: `TTL strategy for our social app:
  user profiles:     30 min   (rarely change, short enough to stay fresh)
  post content:      24 hours (immutable after creation)
  feed sorted sets:  no TTL   (managed by trimming to 800 entries)
  auth sessions:     7 days   (explicit logout or expiry)
  rate limit counters: 60 sec (sliding window, key expires naturally)

Eviction policy (set in redis.conf):
  maxmemory-policy allkeys-lru
  → When Redis hits memory limit, evict least-recently-used keys
  → Hot data stays cached; cold data gets evicted automatically` },
    { t: "interview-tip", text: "The sorted set for feeds is almost always asked in social media system design interviews. Explain: 'I store post IDs (not full post content) in a sorted set per user, scored by timestamp. Retrieval is O(log N + K) where K is the page size. I trim the set to 800 entries — for older history the user would pull from DB.' The distinction between storing IDs vs full content is a key detail." },
  ],

  "2-2": [ // Cache invalidation
    { t: "callout", variant: "info", title: "The problem: stale data", text: "User Alice updates her profile bio. But millions of her followers have her profile cached. Now some see the old bio, some see the new one — depending on whether their cache has expired yet. This is the cache invalidation problem — arguably the hardest problem in distributed systems." },
    { t: "h3", text: "Strategy 1: TTL-based expiry (simplest)" },
    { t: "p", text: "Don't invalidate anything. Just let entries expire naturally. After 30 minutes, the cached profile is gone and the next read fetches fresh data from the DB." },
    { t: "code", lang: "java", code: `// Profile update — only writes to DB
public User updateBio(Long userId, String newBio) {
    User user = userRepository.updateBio(userId, newBio);
    // Don't touch the cache — let the TTL expire it naturally
    return user;
}
// Cost: up to 30 minutes of stale data visible to some users
// Benefit: zero complexity, no cache-DB race conditions` },
    { t: "p", text: "This works well for tolerating eventual consistency — profile bios, follower counts, post like counts. It breaks down when staleness is unacceptable (banking, inventory, seat availability)." },
    { t: "h3", text: "Strategy 2: Event-based invalidation (explicit)" },
    { t: "p", text: "When data changes, immediately delete or update the cache entry. The next read will fetch fresh data from DB." },
    { t: "code", lang: "java", code: `// Profile update — invalidate cache immediately on write
public User updateBio(Long userId, String newBio) {
    User user = userRepository.updateBio(userId, newBio);
    redis.delete("user:" + userId);  // ← cache entry deleted
    // Next request for this user will miss the cache, hit DB, repopulate cache
    return user;
}

// Or: update the cache entry instead of deleting it (write-through variant)
public User updateBio(Long userId, String newBio) {
    User user = userRepository.updateBio(userId, newBio);
    redis.set("user:" + userId, user, Duration.ofMinutes(30)); // refresh cache
    return user;
}` },
    { t: "h3", text: "The cache invalidation race condition" },
    { t: "p", text: "Event-based invalidation introduces a subtle bug. Imagine two concurrent requests: one updating the profile, one reading it. The order of operations can leave stale data in the cache even after invalidation." },
    { t: "code", lang: "text", code: `Race condition — two concurrent requests:

Thread A (UPDATE bio to "New bio"):    Thread B (READ profile):
1. Write to DB ✓
                                        2. Cache miss
                                        3. Read OLD value from DB (not yet committed)
                                        4. Store OLD value in cache ← stale!
5. Delete from cache ← too late!

Result: cache now contains the OLD bio, will serve stale data until TTL expires.

Fix: short TTL as safety net
  → Even if the race condition occurs, the stale entry expires in 30 minutes
  → Use delete-on-write (not update-on-write) to minimize the window
  → For truly critical data: use database read replicas with synchronous invalidation` },
    { t: "h3", text: "Strategy 3: Versioned cache keys" },
    { t: "p", text: "Instead of invalidating, change the key. Old entries become unreachable and expire naturally. New writes use the new key. Zero race conditions." },
    { t: "code", lang: "java", code: `// Store a version number per user in DB
public User updateBio(Long userId, String newBio) {
    // Atomically update bio and increment version
    User user = userRepository.updateBioAndVersion(userId, newBio);
    // New key includes version: "user:42:v3"
    redis.set("user:" + userId + ":v" + user.getVersion(), user, Duration.ofMinutes(30));
    return user;
}

public User getUser(Long userId) {
    Long version = userRepository.getVersion(userId);  // cheap DB read (or itself cached)
    String key = "user:" + userId + ":v" + version;
    User cached = redis.get(key, User.class);
    if (cached == null) {
        cached = userRepository.findById(userId).orElseThrow();
        redis.set(key, cached, Duration.ofMinutes(30));
    }
    return cached;
}
// Old keys (user:42:v1, user:42:v2) are never deleted — they just expire via TTL
// Cost: extra DB lookup for the version number (unless that's also cached)` },
    { t: "callout", variant: "tip", title: "Cache invalidation rule of thumb", text: "Use TTL for data where brief staleness is acceptable (profiles, counts, post content). Use explicit delete-on-write for data where staleness causes visible bugs (feed after someone follows/unfollows). Never try to keep every cache entry perfectly in sync — the complexity isn't worth it for most social features." },
    { t: "interview-tip", text: "Cache invalidation is the most commonly underestimated problem in system design. When an interviewer asks 'how do you keep the cache fresh?', walk through the race condition scenario — it shows you understand why this is hard. Then say: 'For this app, TTL-based expiry with a 30-minute window is the right trade-off. The complexity of perfect invalidation isn't worth it for profile data.'" },
  ],

  "2-3": [ // Thundering herd / cache stampede
    { t: "callout", variant: "info", title: "The problem: a cache miss that brings down the database", text: "Beyoncé posts a new photo. It's in the cache — 2 million users load it instantly. Then the cache entry expires at exactly 8:00pm. At 8:00:00.001, 50,000 users simultaneously request the photo. All 50,000 get a cache miss. All 50,000 hit the database at the same moment. The DB falls over." },
    { t: "h3", text: "Why this happens: synchronized expiry" },
    { t: "p", text: "When you set a TTL, all users who have that entry in cache will miss at the same moment after it expires. Popular content — a celebrity's post, a trending article — can have millions of simultaneous readers who all miss together. This is called the thundering herd or cache stampede." },
    { t: "code", lang: "text", code: `Timeline of a cache stampede:

08:00:00.000 — "post:celebrity:99" TTL expires in Redis
08:00:00.001 — 50,000 concurrent users request post 99
08:00:00.001 — All 50,000 get cache miss
08:00:00.001 — All 50,000 issue SELECT to PostgreSQL
08:00:00.002 — PostgreSQL connection pool exhausted (max 200 connections)
08:00:00.003 — Connection timeout errors cascade to other queries
08:00:00.005 — Other tables become slow due to DB lock contention
08:00:00.010 — App server starts returning 500 errors
08:00:00.100 — Site appears down to users` },
    { t: "h3", text: "Fix 1: Mutex lock (request coalescing)" },
    { t: "p", text: "Only one request rebuilds the cache. All others wait for it to finish, then read from the cache." },
    { t: "code", lang: "java", code: `public Post getPost(Long postId) {
    String cacheKey = "post:" + postId;
    String lockKey  = "lock:post:" + postId;

    // Try cache first
    Post cached = redis.get(cacheKey, Post.class);
    if (cached != null) return cached;

    // Cache miss — try to acquire a distributed lock
    boolean acquired = redis.set(lockKey, "1",
        SetArgs.Builder.nx().ex(5));  // NX = only set if not exists, 5s TTL

    if (acquired) {
        try {
            // I won the lock — rebuild the cache
            Post post = postRepository.findById(postId).orElseThrow();
            redis.set(cacheKey, post, Duration.ofHours(24));
            return post;
        } finally {
            redis.delete(lockKey);  // release lock
        }
    } else {
        // Someone else is rebuilding — wait and retry
        Thread.sleep(50);  // small wait
        return getPost(postId);  // recursive retry (now usually hits cache)
    }
}
// Result: 50,000 requests hit DB — only 1. Other 49,999 wait ~50ms then read from cache.` },
    { t: "h3", text: "Fix 2: Probabilistic early recomputation (no lock needed)" },
    { t: "p", text: "Rather than letting the cache expire then scrambling to rebuild it, start rebuilding it probabilistically while it's still valid. As expiry approaches, random requests 'decide' to refresh early — spreading the load over time instead of concentrating it at expiry." },
    { t: "code", lang: "java", code: `// Store creation time alongside the cached value
record CachedPost(Post post, long cachedAt, long ttlSeconds) {}

public Post getPost(Long postId) {
    CachedPost entry = redis.get("post:" + postId, CachedPost.class);

    if (entry != null) {
        long age = Instant.now().getEpochSecond() - entry.cachedAt();
        long remaining = entry.ttlSeconds() - age;

        // Probability of early refresh increases as expiry approaches
        // XFetch algorithm: refresh if random > exp(-beta * remaining)
        double beta = 1.0;
        if (-Math.log(Math.random()) * beta > remaining) {
            // Refresh early — only this one request rebuilds, no lock needed
            return refreshCache(postId);
        }
        return entry.post();  // still valid
    }

    return refreshCache(postId);  // genuine miss
}` },
    { t: "h3", text: "Fix 3: Jittered TTLs (spread out expiry times)" },
    { t: "p", text: "The simplest fix: add random jitter to TTLs. Instead of every copy of the cache expiring at exactly the same second, they expire within a random window. No two requests expire simultaneously." },
    { t: "code", lang: "java", code: `// Without jitter: if you cache 10,000 posts at the same moment with TTL=24h,
// they ALL expire at the same moment 24h later → thundering herd

// With jitter: spread expiry over a 1-hour window
Duration ttl = Duration.ofHours(23)
    .plusMinutes(ThreadLocalRandom.current().nextInt(60));  // 23h to 24h

redis.set("post:" + postId, post, ttl);

// Now the 10,000 posts expire gradually over 1 hour
// Max ~10,000/3600 ≈ 3 misses/second instead of 10,000 at once` },
    { t: "callout", variant: "tip", title: "Which fix to use?", text: "For most cases, jittered TTLs are enough and require zero extra code at read time. Add the mutex lock for your highest-traffic content (celebrity posts, viral articles) where even a few simultaneous misses could cause DB pressure. Probabilistic early recomputation is elegant but adds complexity — use it when you absolutely cannot afford any DB spike." },
    { t: "interview-tip", text: "Thundering herd is a classic follow-up question: 'What happens when your cache entry expires?' Describing the stampede scenario and then offering three solutions at different complexity levels (jitter → mutex → probabilistic) shows depth. Most candidates only know to 'add caching' — demonstrating you know the failure modes of caching itself is what separates you." },
  ],

  "2-4": [ // Multi-level caching
    { t: "callout", variant: "info", title: "The problem: Redis is fast but not instant", text: "Redis lives on a separate server. Every cache read is a network round-trip — about 0.5-1ms on the same network. Our feed endpoint makes ~5 Redis calls (profile, 20 posts). That's 5-10ms of Redis latency alone, before any business logic. For a sub-50ms API response, we need to cut this further." },
    { t: "h3", text: "The solution: L1 cache in the app server memory" },
    { t: "p", text: "Add a small in-process cache in the app server itself. Data that's already on the same JVM heap is accessed in nanoseconds — 1,000× faster than Redis. The trade-off: each app server instance has its own L1, so the data may be slightly stale and the cache size is small (limited to JVM heap)." },
    { t: "code", lang: "text", code: `Multi-level cache hierarchy:

  Request
     │
  ┌──▼──────────────────────────────┐
  │  L1: In-process (Caffeine)       │  ~0.1ms, 100MB RAM, per-server instance
  │  small & short TTL (1-5 min)     │  NOT shared between servers
  └──┬──────────────────────────────┘
     │ miss
  ┌──▼──────────────────────────────┐
  │  L2: Redis (distributed)         │  ~1ms, 10-50GB RAM, shared by all servers
  │  medium size & TTL (30 min)      │  consistent across the fleet
  └──┬──────────────────────────────┘
     │ miss
  ┌──▼──────────────────────────────┐
  │  L3: PostgreSQL (source of truth)│  ~5-20ms (indexed), unlimited storage
  └─────────────────────────────────┘

Typical hit rates:
  L1: ~60-70%  (hot content repeated within seconds by different users on same server)
  L2: ~25-35%  (warm content from recent minutes)
  L3: ~5-10%   (cold content, cache misses)

Combined: ~90-95% of requests never touch the database` },
    { t: "h3", text: "Implementing L1 with Caffeine" },
    { t: "code", lang: "java", code: `import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

@Service
public class UserService {

    // L1: small in-process cache, max 10,000 entries, 2-minute TTL
    private final Cache<Long, User> l1Cache = Caffeine.newBuilder()
        .maximumSize(10_000)        // LRU eviction when full
        .expireAfterWrite(2, TimeUnit.MINUTES)
        .recordStats()              // expose hit rate metrics
        .build();

    private final RedisService redis;
    private final UserRepository userRepository;

    public User getUser(Long userId) {
        // L1 check (no network, no serialization — direct heap access)
        User user = l1Cache.getIfPresent(userId);
        if (user != null) return user;  // ~0.1ms

        // L2 Redis check
        user = redis.get("user:" + userId, User.class);
        if (user != null) {
            l1Cache.put(userId, user);  // promote to L1 for next time
            return user;               // ~1ms
        }

        // L3 Database
        user = userRepository.findById(userId).orElseThrow();
        redis.set("user:" + userId, user, Duration.ofMinutes(30));  // populate L2
        l1Cache.put(userId, user);                                   // populate L1
        return user;  // ~10ms
    }
}` },
    { t: "h3", text: "The consistency challenge: L1 is per-server" },
    { t: "p", text: "The fleet has 10 app servers. Each has its own L1 cache. When Alice updates her bio, we invalidate Redis (L2). But all 10 servers still have the old bio in their L1 for up to 2 minutes. Users hitting different servers see different bios." },
    { t: "code", lang: "text", code: `Consistency model for each cache level:

  L1 (in-process):
    → TTL-based invalidation only (2-5 min)
    → Acceptable for: profile data, post content (slight staleness ok)
    → NOT acceptable for: session data, inventory, financial data

  L2 (Redis):
    → TTL + explicit invalidation on write
    → Broadcast invalidation via Redis Pub/Sub when needed:
      Publisher (after user updates bio):
        redis.publish("cache:invalidate", "user:42")
      Subscriber (on every app server):
        redis.subscribe("cache:invalidate", (msg) -> l1Cache.invalidate(msg))
    → This evicts the key from all L1 caches within milliseconds

  L3 (DB):
    → Single source of truth — always consistent` },
    { t: "callout", variant: "tip", title: "Keep L1 small and short-lived", text: "L1's value is speed, not capacity. Keep it under 100MB (JVM heap pressure) and under 5-minute TTL. Trying to cache too much in L1 causes GC pressure and can slow the entire JVM. Rule of thumb: L1 for your top 1% hottest objects, L2 for everything else." },
    { t: "interview-tip", text: "Multi-level caching shows up in performance-focused questions. The key insight to communicate: 'I'd add a small in-process Caffeine cache with a 2-min TTL for the hottest objects. At 3,500 requests/sec across 10 servers, each server handles 350 req/sec — an L1 hit rate of 60% saves 210 Redis round-trips per second per server, reducing response time from ~10ms to ~1ms on those requests.' The quantification is what makes the answer strong." },
  ],

};
