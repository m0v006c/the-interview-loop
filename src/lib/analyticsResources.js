/**
 * Curated learning resources keyed by topic.
 * Resources are attached to AI-generated gap analysis by dimension key.
 * All URLs are publicly accessible without login.
 */

export const RESOURCES = {
  // ── System Design ──────────────────────────────────────────────
  sd_primer: {
    title: "System Design Primer",
    url: "https://github.com/donnemartin/system-design-primer",
    description: "The most comprehensive open-source guide to system design — 200k+ stars, covers every major topic",
  },
  cap_theorem: {
    title: "CAP Theorem Explained — IBM",
    url: "https://www.ibm.com/topics/cap-theorem",
    description: "Consistency, availability, and partition tolerance trade-offs with real database examples",
  },
  sql_vs_nosql: {
    title: "SQL vs NoSQL — MongoDB",
    url: "https://www.mongodb.com/nosql-explained/nosql-vs-sql",
    description: "When to choose relational vs document, graph, or time-series databases",
  },
  scalability_guide: {
    title: "Scalability for Dummies",
    url: "https://www.lecloud.net/tagged/scalability",
    description: "Step-by-step evolution from a single server to global-scale architecture",
  },
  aws_well_arch: {
    title: "AWS Well-Architected Framework",
    url: "https://aws.amazon.com/architecture/well-architected/",
    description: "Cloud architecture best practices: reliability, performance, security, and cost optimization",
  },
  gaurav_sen: {
    title: "System Design by Gaurav Sen — YouTube",
    url: "https://www.youtube.com/@gkcs",
    description: "Visual walkthroughs of real systems: WhatsApp, Netflix, Uber, Hotstar — explained clearly",
  },
  high_scalability: {
    title: "High Scalability Blog",
    url: "http://highscalability.com/",
    description: "Real-world architecture case studies from YouTube, Twitter, Amazon, Discord, and more",
  },
  requirements_guide: {
    title: "How to Gather System Requirements — System Design School",
    url: "https://systemdesignschool.io/fundamentals/requirement-gathering",
    description: "Structured approach to functional vs non-functional requirements in design interviews",
  },
  hld_guide: {
    title: "High-Level Design Patterns — ByteByteGo",
    url: "https://bytebytego.com/",
    description: "Visual, bite-sized explanations of API gateways, CDN, message queues, and component selection",
  },
  database_internals: {
    title: "Use The Index, Luke — SQL indexing guide",
    url: "https://use-the-index-luke.com/",
    description: "Deep dive into how databases use indexes — essential for data modeling and scaling discussions",
  },

  // ── Behavioral ─────────────────────────────────────────────────
  star_method: {
    title: "STAR Method Guide — Indeed",
    url: "https://www.indeed.com/career-advice/interviewing/how-to-use-the-star-interview-response-technique",
    description: "How to structure Situation, Task, Action, Result for any behavioral question with examples",
  },
  amazon_lp: {
    title: "Amazon Leadership Principles",
    url: "https://www.amazon.jobs/content/en/our-workplace/leadership-principles",
    description: "The 16 principles used across behavioral interviews at Amazon, Meta, Google, and beyond",
  },
  lenny_leadership: {
    title: "Lenny's Newsletter — Influence & Leadership",
    url: "https://www.lennysnewsletter.com/p/how-to-get-things-done-cross-functionally",
    description: "How senior engineers lead cross-functional work without authority — influence through data and empathy",
  },
  behavioral_interview: {
    title: "Behavioral Interview Prep — Tech Interview Handbook",
    url: "https://www.techinterviewhandbook.org/behavioral-interview/",
    description: "Free guide with sample answers for ownership, conflict, failure, and ambiguity questions",
  },
  self_awareness_prep: {
    title: "Handling Failure Questions — Exponent",
    url: "https://www.tryexponent.com/guides/failure-questions",
    description: "How to frame failure stories honestly while showing growth and self-reflection",
  },

  // ── Problem Solving ────────────────────────────────────────────
  neetcode_roadmap: {
    title: "NeetCode Roadmap",
    url: "https://neetcode.io/roadmap",
    description: "Structured coding interview prep organized by pattern — free solutions and video explanations",
  },
  big_o_cheat: {
    title: "Big-O Cheat Sheet",
    url: "https://www.bigocheatsheet.com/",
    description: "Quick reference for time and space complexity of all major algorithms and data structures",
  },
  visualgo: {
    title: "VisuAlgo — Algorithm Visualization",
    url: "https://visualgo.net/en",
    description: "Interactive animations of sorting, graph traversal, DP, and more — builds strong intuition",
  },
  leetcode_patterns: {
    title: "LeetCode Patterns — Sean Prashad",
    url: "https://seanprashad.com/leetcode-patterns/",
    description: "250+ problems grouped by pattern: sliding window, two pointers, DP, graphs, and more",
  },
  algo_monster: {
    title: "AlgoMonster — Interview Patterns",
    url: "https://algo.monster/problems/stats",
    description: "Frequency-ranked problems with pattern identification — focuses on what actually appears in FAANG interviews",
  },
  clean_code: {
    title: "Clean Code Principles — Refactoring Guru",
    url: "https://refactoring.guru/refactoring",
    description: "Code smells and refactoring techniques: when and how to write readable, maintainable code",
  },
  edge_cases_guide: {
    title: "Testing Edge Cases — Coding Interview Tips",
    url: "https://www.techinterviewhandbook.org/coding-interview-techniques/",
    description: "Systematic checklist for edge cases: null, empty, duplicates, overflow, max input size",
  },

  // ── Low-Level Design ───────────────────────────────────────────
  refactoring_guru: {
    title: "Design Patterns — Refactoring Guru",
    url: "https://refactoring.guru/design-patterns",
    description: "All 23 GoF patterns with diagrams, code in multiple languages, and real-world use cases",
  },
  solid_principles: {
    title: "SOLID Principles — freeCodeCamp",
    url: "https://www.freecodecamp.org/news/solid-principles-explained-in-plain-english/",
    description: "Plain-English walkthrough of SRP, OCP, LSP, ISP, DIP — with examples and counterexamples",
  },
  grokking_lld: {
    title: "Grokking LLD Interview — Design Gurus",
    url: "https://www.designgurus.io/course/grokking-the-low-level-design-interview-using-ood-principles",
    description: "Parking lot, chess, Splitwise, and 20+ classic LLD problems with full class diagrams",
  },
  uml_guide: {
    title: "UML Class Diagrams Tutorial — Lucidchart",
    url: "https://www.lucidchart.com/pages/uml-class-diagram",
    description: "How to model entities, relationships, and inheritance — essential skill for LLD interviews",
  },
  head_first_patterns: {
    title: "Head First Design Patterns — O'Reilly",
    url: "https://www.oreilly.com/library/view/head-first-design/0596007124/",
    description: "Visual, story-driven introduction to design patterns — best for building intuition",
  },
  oop_guide: {
    title: "OOP Concepts — GeeksforGeeks",
    url: "https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/",
    description: "Encapsulation, inheritance, polymorphism, and abstraction with concrete examples",
  },
};

/**
 * Maps each scoring dimension to 2-3 most relevant resources.
 * Used to attach reading material to AI-generated gap analysis.
 */
export const DIMENSION_RESOURCES = {
  // System Design
  requirements:      ["requirements_guide", "sd_primer", "hld_guide"],
  high_level_design: ["hld_guide", "sd_primer", "gaurav_sen"],
  deep_dive_depth:   ["sd_primer", "database_internals", "high_scalability"],
  trade_offs:        ["cap_theorem", "sql_vs_nosql", "sd_primer"],
  scaling_evolution: ["scalability_guide", "aws_well_arch", "high_scalability"],
  scalability:       ["scalability_guide", "gaurav_sen", "sd_primer"],
  // Behavioral
  star_structure:    ["star_method", "behavioral_interview"],
  specificity:       ["star_method", "behavioral_interview", "amazon_lp"],
  ownership_impact:  ["amazon_lp", "lenny_leadership"],
  collaboration:     ["lenny_leadership", "amazon_lp", "behavioral_interview"],
  self_awareness:    ["self_awareness_prep", "star_method", "amazon_lp"],
  // Problem Solving
  clarification:     ["neetcode_roadmap", "edge_cases_guide"],
  approach_complexity:["big_o_cheat", "neetcode_roadmap", "algo_monster"],
  code_quality:      ["clean_code", "neetcode_roadmap"],
  testing_edge_cases:["edge_cases_guide", "neetcode_roadmap", "leetcode_patterns"],
  optimization_depth:["big_o_cheat", "visualgo", "algo_monster"],
  // Low-Level Design
  entity_modeling:   ["uml_guide", "grokking_lld", "oop_guide"],
  patterns_solid:    ["refactoring_guru", "solid_principles", "grokking_lld"],
  dry_run:           ["grokking_lld", "refactoring_guru"],
  extensibility:     ["solid_principles", "refactoring_guru", "head_first_patterns"],
  // Shared
  communication:     ["star_method", "behavioral_interview"],
};

/** Look up resources for a dimension key. Returns 2-3 resource objects. */
export function getResourcesForDimension(dimensionKey) {
  const keys = DIMENSION_RESOURCES[dimensionKey] || [];
  return keys.map((k) => RESOURCES[k]).filter(Boolean);
}
