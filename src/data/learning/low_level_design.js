/**
 * LLD Learning — Content Blueprint
 * Core journey: Design a Ride-Sharing System (Uber/Ola)
 */

export const LLD_LEARNING = {
  track: "low_level_design",
  journeyTitle: "Core journey: Design a Ride-Sharing System (Uber/Ola)",
  journeyDesc: "Decompose a ride-sharing app into 10 sub-problems. Each naturally introduces OOP principles, design patterns, algorithms, and clean code — with the 'why' always grounded in a concrete need.",
  evolutionChips: ["Requirements","Entities","Relationships","State machine","Matching","Fare calc","Notifications","Payments","Concurrency","Architecture"],

  stages: [
    {
      num: 1, title: "Requirements & Use Case Analysis",
      subtitle: "What should the ride-sharing system do? Who are the actors?",
      problem: "Before writing any code, systematically identify what the system must do. Who are the users? What are the core flows? What's out of scope? This stage teaches the structured thinking that interviewers value most.",
      topics: [
        { name: "Requirement gathering methodology", desc: "Functional vs non-functional requirements, clarifying questions framework for interviews." },
        { name: "Use case modeling", desc: "Actors (Rider, Driver, Admin, Payment Gateway), use cases, primary vs alternate flows." },
        { name: "Prioritization", desc: "MoSCoW method, scope control. In a 45-min interview, what do you build first?" },
        { name: "System boundary", desc: "What's in scope vs out (maps API, payment gateway are external). Interface contracts." },
      ],
      comparisons: [
        { text: "Functional vs non-functional reqs", type: "concept" },
        { text: "Use case vs user story", type: "concept" },
      ],
    },
    {
      num: 2, title: "Entity Identification & Class Design",
      subtitle: "Core objects, data, behavior. SOLID principles applied.",
      problem: "Identify the core objects in the system. What data does each own? What behavior? How do SOLID principles guide the design so it stays extensible as features are added?",
      topics: [
        { name: "OOP fundamentals applied", desc: "Encapsulation (private fields + public methods), abstraction levels, information hiding — not textbook, applied to ride-sharing." },
        { name: "SOLID principles deep-dive", desc: "Each principle with ride-sharing examples: SRP (FareCalculator doesn't notify), OCP (new vehicle types without changing RideManager), LSP (Car/Auto/Bike as Vehicle), ISP (small focused interfaces), DIP (depend on abstractions)." },
        { name: "Class identification techniques", desc: "Noun extraction from requirements, CRC cards, responsibility assignment." },
        { name: "Key entities with responsibilities", desc: "User→Rider/Driver, Vehicle→Car/Auto/Bike, Ride (lifecycle), Location, Fare, Payment, Rating." },
      ],
      comparisons: [
        { text: "Inheritance vs composition", type: "concept" },
        { text: "Abstract class vs interface", type: "concept" },
        { text: "Anemic vs rich domain model", type: "pattern" },
      ],
    },
    {
      num: 3, title: "Entity Relationships & Schema Design",
      subtitle: "How entities relate. Composition vs aggregation. Class diagrams.",
      problem: "Entities don't exist in isolation. A rider has many rides. A ride has exactly one route. How do we model ownership, lifecycle dependencies, and cardinality correctly?",
      topics: [
        { name: "Relationship types", desc: "Association, aggregation, composition — with examples. Ride↔Route = composition (route dies with ride). Rider↔Ride = association." },
        { name: "Cardinality", desc: "1:1 (Driver↔active Vehicle), 1:N (Rider↔Rides), M:N (Ride↔Coupons)." },
        { name: "UML class diagrams", desc: "Attributes, methods, visibility (+/-/#), relationship arrows, multiplicities. The essentials for interviews." },
        { name: "Schema design patterns", desc: "Soft deletes, audit fields (created_at, updated_at), polymorphic associations, status enums vs state tables." },
      ],
      comparisons: [
        { text: "Composition vs aggregation", type: "concept" },
        { text: "Normalization vs denormalization", type: "concept" },
        { text: "Enum vs state table for status", type: "pattern" },
      ],
    },
    {
      num: 4, title: "State Machine & Ride Lifecycle",
      subtitle: "Rides go through states. Enforce valid transitions. No illegal jumps.",
      problem: "A ride moves through REQUESTED → MATCHED → DRIVER_EN_ROUTE → STARTED → COMPLETED. But what if someone tries to go from COMPLETED back to STARTED? Or cancel after completion? We need to enforce valid transitions cleanly.",
      topics: [
        { name: "State pattern", desc: "State interface, concrete states (RequestedState, InProgressState, etc.), context class. Each state knows its allowed transitions and behavior." },
        { name: "Implementation approaches", desc: "State objects (full OOP), transition table (data-driven), enum with switch (simpler). Trade-offs in extensibility vs simplicity." },
        { name: "Event-driven state changes", desc: "Commands trigger transitions, domain events record what happened. onEnter/onExit hooks." },
        { name: "Guard conditions & invariants", desc: "Pre-conditions before transition (driver must be assigned before IN_PROGRESS). Post-conditions after (notification sent on COMPLETED)." },
      ],
      comparisons: [
        { text: "State vs Strategy pattern", type: "pattern" },
        { text: "State objects vs transition table", type: "pattern" },
        { text: "if-else chain vs State pattern", type: "concept" },
      ],
    },
    {
      num: 5, title: "Driver Matching — Strategy & Algorithms",
      subtitle: "Find the best driver. Multiple algorithms, interchangeable, A/B testable.",
      problem: "When a rider requests a ride, how do we pick the best driver? Nearest? Highest-rated? Best acceptance rate? The business wants to experiment with different algorithms. We need them to be interchangeable without touching the caller.",
      topics: [
        { name: "Strategy pattern", desc: "DriverMatchingStrategy interface → NearestFirstStrategy, HighestRatedStrategy, BalancedStrategy, SurgeAwareStrategy. Swap without changing client." },
        { name: "Spatial data structures", desc: "Quadtree for 2D space partitioning, geohash-based bucketing, R-tree. Finding nearby drivers efficiently." },
        { name: "Multi-criteria scoring", desc: "Weighted function: proximity (40%) + rating (30%) + acceptance rate (20%) + vehicle match (10%). Configurable weights." },
        { name: "Why Strategy here", desc: "Business A/B tests algorithms. Strategy makes swapping trivial. New algorithm = new class, zero changes to existing code." },
      ],
      comparisons: [
        { text: "Strategy vs Template Method", type: "pattern" },
        { text: "Quadtree vs geohash vs R-tree", type: "algo" },
        { text: "Greedy vs optimal matching", type: "algo" },
      ],
    },
    {
      num: 6, title: "Fare Calculation — Factory & Decorator",
      subtitle: "Base fare + surge + coupons + tolls. Rules keep adding. No subclass explosion.",
      problem: "Fare = f(distance, time, vehicle_type, surge_multiplier, coupons, tolls, peak_hour). New pricing rules keep getting added. Creating a subclass for every combination (SurgeTollCouponCalculator) is madness. We need composable pricing.",
      topics: [
        { name: "Factory pattern", desc: "FareCalculatorFactory.create(rideType) returns the right calculator without exposing instantiation logic." },
        { name: "Decorator pattern", desc: "BaseFare → wrapped by SurgePricingDecorator → CouponDecorator → TollDecorator. Each adds its component. Compose freely." },
        { name: "Why Decorator beats subclassing", desc: "Surge + toll + coupon = 8 combinations as subclasses. Decorators compose N rules with N classes, not 2^N." },
        { name: "Builder pattern for fare breakdown", desc: "Build the fare receipt step by step: baseFare().withSurge(1.5).withCoupon('FIRST50').withToll(25). Clear, readable construction." },
      ],
      comparisons: [
        { text: "Decorator vs Chain of Responsibility", type: "pattern" },
        { text: "Factory Method vs Abstract Factory", type: "pattern" },
        { text: "Decorator vs subclass explosion", type: "concept" },
      ],
    },
    {
      num: 7, title: "Notifications — Observer & Events",
      subtitle: "Ride changes → notify rider, driver, analytics, ETA. Decouple all reactions.",
      problem: "When a ride state changes, multiple things must happen: rider notification, driver notification, analytics logging, ETA update, fraud check. These shouldn't know about each other. Adding a new reaction shouldn't require modifying existing code.",
      topics: [
        { name: "Observer pattern", desc: "RideEventPublisher (subject) notifies RiderNotifier, DriverNotifier, AnalyticsLogger, ETAUpdater. Register/unregister observers." },
        { name: "Domain events", desc: "RIDE_REQUESTED, DRIVER_MATCHED, RIDE_STARTED, RIDE_COMPLETED, PAYMENT_PROCESSED. Each observer handles only events it cares about." },
        { name: "In-memory event bus", desc: "EventBus.publish(event), registered handlers invoked. Sync vs async dispatch. When to use external broker vs in-process." },
        { name: "Why Observer here", desc: "Adding fraud detection = register new observer. Zero changes to ride logic, notification logic, or analytics logic." },
      ],
      comparisons: [
        { text: "Observer vs Mediator", type: "pattern" },
        { text: "Push vs pull observer model", type: "concept" },
        { text: "In-memory bus vs message broker", type: "pattern" },
      ],
    },
    {
      num: 8, title: "Payment Processing — Command & Template Method",
      subtitle: "Validate → authorize → capture → settle. Different payment types, same skeleton.",
      problem: "Payments have multiple steps. Card, wallet, and UPI all follow the same high-level flow but differ in authorization details. We also need to queue payments, retry failures, support refunds (undo), and log every attempt.",
      topics: [
        { name: "Command pattern", desc: "PaymentCommand with execute() and undo(). ProcessPaymentCommand, RefundCommand. Queue, retry, log — all enabled by wrapping request as object." },
        { name: "Template Method pattern", desc: "PaymentProcessor defines process() skeleton: validate→authorize→capture→notify. CardProcessor, WalletProcessor, UPIProcessor override specific steps." },
        { name: "Idempotency", desc: "Payment charged twice = disaster. Idempotency keys, exactly-once processing, deduplication strategies." },
        { name: "Error handling strategies", desc: "Retry with exponential backoff, compensating transactions (if capture fails after authorize, release the hold), dead-letter for unrecoverable failures." },
      ],
      comparisons: [
        { text: "Command vs Strategy", type: "pattern" },
        { text: "Template Method vs Strategy", type: "pattern" },
        { text: "Pessimistic vs optimistic payment locking", type: "concept" },
      ],
    },
    {
      num: 9, title: "Concurrency & Thread Safety",
      subtitle: "Two riders, same driver. Race conditions. Atomic operations.",
      problem: "Multiple riders request rides simultaneously, potentially targeting the same driver. Fare calculations run concurrently. The driver availability pool is shared mutable state. Without careful concurrency control, we get double-bookings and corrupted state.",
      topics: [
        { name: "Race conditions in matching", desc: "Two requests target same driver → only one should win. Compare-and-set on driver status. Optimistic locking with version numbers." },
        { name: "Locking strategies", desc: "Pessimistic (mutex/synchronized) vs optimistic (CAS, version-based). Read-write locks for driver location (many reads, few writes)." },
        { name: "Singleton pattern (thread-safe)", desc: "DriverAvailabilityManager — one instance managing shared state. Double-checked locking, enum singleton. Why Singleton is often an anti-pattern and when it's justified." },
        { name: "Producer-consumer", desc: "Ride request queue with multiple matching workers. Backpressure when queue fills. BlockingQueue, bounded buffers." },
        { name: "Thread pool design", desc: "Fixed pool for matching workers, cached pool for notifications, scheduled pool for ETA updates. Rejection policies when overloaded." },
      ],
      comparisons: [
        { text: "Singleton vs dependency injection", type: "pattern" },
        { text: "synchronized vs ReentrantLock vs CAS", type: "concept" },
        { text: "Pessimistic vs optimistic locking", type: "concept" },
      ],
    },
    {
      num: 10, title: "Clean Architecture & Assembly",
      subtitle: "How all pieces fit. Package structure, dependencies, testability.",
      problem: "We have entities, patterns, algorithms — but how do we structure the actual codebase? Which layer depends on which? How do we ensure the domain logic is testable without spinning up databases or HTTP servers?",
      topics: [
        { name: "Clean / Hexagonal Architecture", desc: "Domain layer (entities, business rules) has zero external dependencies. Use cases orchestrate. Adapters bridge to DB, HTTP, messaging." },
        { name: "Dependency injection", desc: "Constructor injection for testability. RideService receives DriverMatcher, FareCalculator, RideRepository — all as interfaces. Swap real/mock/test implementations." },
        { name: "Repository pattern", desc: "RideRepository interface in domain layer. MySQLRideRepository in infrastructure. Domain speaks business language (findActiveRidesNearLocation), not SQL." },
        { name: "Package structure", desc: "By feature (ride/, payment/, notification/) vs by layer (controller/, service/, repository/). By-feature scales better for large codebases." },
        { name: "Facade pattern", desc: "RideService as simplified interface to complex subsystem (matching + fare + payment + notification). Client code interacts with one clean API." },
        { name: "GRASP principles", desc: "Information Expert, Creator, Controller, Low Coupling, High Cohesion — guiding who holds what responsibility." },
      ],
      comparisons: [
        { text: "Repository vs DAO", type: "pattern" },
        { text: "By-feature vs by-layer packaging", type: "concept" },
        { text: "Facade vs service layer", type: "pattern" },
        { text: "Clean vs onion vs hexagonal architecture", type: "concept" },
      ],
    },
  ],

  standalone: [
    { num: 1, title: "Adapter Pattern", subtitle: "Wrap third-party APIs to match your interface — geocoding, payment gateways." },
    { num: 2, title: "Bridge Pattern", subtitle: "Decouple abstraction from implementation — Notification × Channel (Firebase/APNS)." },
    { num: 3, title: "Composite Pattern", subtitle: "Tree structures: org hierarchy, menu systems, file systems. Uniform treatment." },
    { num: 4, title: "Flyweight Pattern", subtitle: "Share common state: map tiles, character rendering, game objects." },
    { num: 5, title: "Proxy Pattern", subtitle: "Lazy-loading, caching, logging, access-control proxies." },
    { num: 6, title: "Chain of Responsibility", subtitle: "Validation pipeline: each handler checks one thing, passes to next." },
    { num: 7, title: "Interpreter Pattern", subtitle: "DSL parsers, rule engines, expression evaluators." },
    { num: 8, title: "Visitor Pattern", subtitle: "Add operations to hierarchies without modifying them — report generation." },
    { num: 9, title: "Memento Pattern", subtitle: "Undo/redo, state snapshots, version history." },
    { num: 10, title: "Iterator Pattern", subtitle: "Custom traversal, lazy evaluation, filtered iteration." },
    { num: 11, title: "Prototype Pattern", subtitle: "Clone expensive objects — pre-configured templates." },
    { num: 12, title: "Abstract Factory", subtitle: "Families of related objects — cross-platform UI toolkits." },
    { num: 13, title: "Null Object Pattern", subtitle: "NullLogger, NullNotifier — avoid null checks, conform to interface." },
    { num: 14, title: "Specification Pattern", subtitle: "Combinable rules: isPremium.and(hasMinRides(10)).or(isNew)" },
    { num: 15, title: "CQRS at Code Level", subtitle: "Separate command/query models, different DTOs, different repos." },
    { num: 16, title: "Event Sourcing at Code Level", subtitle: "State as events, replay, audit trail, temporal queries." },
    { num: 17, title: "DDD Concepts in Code", subtitle: "Entities, value objects, aggregates, aggregate roots, domain events." },
  ],
};
