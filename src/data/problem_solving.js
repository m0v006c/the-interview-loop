/**
 * Problem Solving Track
 *
 * Questions grouped by company focus — each company asks specific patterns:
 *  - Amazon   → Graphs, BFS/DFS, trees
 *  - Google   → Dynamic programming, arrays, hard puzzles
 *  - Meta     → Arrays, strings, intervals, heavy string manipulation
 *  - Microsoft → Trees, BST, linked lists
 *  - Apple    → Design-style problems, OOP data structures
 *
 * Phases: clarify → approach → implement → test → optimize
 */

const AMAZON = [
  {
    id: "number-of-islands",
    title: "Number of Islands",
    company: "Amazon",
    difficulty: "Medium",
    description: "Given an m x n 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
    topics: ["BFS/DFS", "Graph", "Connected components", "Matrix traversal"],
  },
  {
    id: "clone-graph",
    title: "Clone Graph",
    company: "Amazon",
    difficulty: "Medium",
    description: "Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph.",
    topics: ["Graph", "DFS/BFS", "HashMap", "Recursion"],
  },
  {
    id: "course-schedule",
    title: "Course Schedule",
    company: "Amazon",
    difficulty: "Medium",
    description: "There are numCourses you have to take, labeled from 0 to numCourses-1. You are given an array prerequisites where prerequisites[i] = [ai, bi] means you must take course bi first if you want to take course ai. Return true if you can finish all courses.",
    topics: ["Topological sort", "Graph", "Cycle detection", "DFS/BFS"],
  },
  {
    id: "word-ladder",
    title: "Word Ladder",
    company: "Amazon",
    difficulty: "Hard",
    description: "Given two words, beginWord and endWord, and a dictionary wordList, return the length of the shortest transformation sequence from beginWord to endWord, such that only one letter changes at a time and each intermediate word must exist in wordList.",
    topics: ["BFS", "Graph", "Shortest path", "String manipulation"],
  },
  {
    id: "rotting-oranges",
    title: "Rotting Oranges",
    company: "Amazon",
    difficulty: "Medium",
    description: "You are given an m x n grid where each cell is 0 (empty), 1 (fresh orange), or 2 (rotten orange). Every minute, any fresh orange adjacent to a rotten orange becomes rotten. Return the minimum number of minutes until no fresh orange remains, or -1 if impossible.",
    topics: ["BFS", "Multi-source BFS", "Graph", "Matrix"],
  },
];

const GOOGLE = [
  {
    id: "two-sum",
    title: "Two Sum",
    company: "Google",
    difficulty: "Easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input has exactly one solution, and you may not use the same element twice.",
    topics: ["HashMap", "Array", "One-pass"],
  },
  {
    id: "longest-palindromic-substring",
    title: "Longest Palindromic Substring",
    company: "Google",
    difficulty: "Medium",
    description: "Given a string s, return the longest palindromic substring in s.",
    topics: ["DP", "Expand from center", "Manacher's algorithm", "Strings"],
  },
  {
    id: "word-break",
    title: "Word Break",
    company: "Google",
    difficulty: "Medium",
    description: "Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.",
    topics: ["DP", "Trie", "HashSet", "Strings"],
  },
  {
    id: "trapping-rain-water",
    title: "Trapping Rain Water",
    company: "Google",
    difficulty: "Hard",
    description: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    topics: ["Two pointers", "Monotonic stack", "DP", "Array"],
  },
  {
    id: "regex-matching",
    title: "Regular Expression Matching",
    company: "Google",
    difficulty: "Hard",
    description: "Given an input string s and a pattern p, implement regular expression matching with support for '.' (matches any single character) and '*' (matches zero or more of the preceding element). The matching should cover the entire input string.",
    topics: ["DP", "Recursion", "Strings", "Memoization"],
  },
];

const META = [
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    company: "Meta",
    difficulty: "Easy",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if brackets are properly closed in the correct order.",
    topics: ["Stack", "Strings", "HashMap"],
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals",
    company: "Meta",
    difficulty: "Medium",
    description: "Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    topics: ["Sorting", "Intervals", "Array"],
  },
  {
    id: "add-two-numbers",
    title: "Add Two Numbers",
    company: "Meta",
    difficulty: "Medium",
    description: "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each node contains a single digit. Add the two numbers and return the sum as a linked list.",
    topics: ["Linked list", "Math", "Two pointers"],
  },
  {
    id: "kth-largest",
    title: "Kth Largest Element in an Array",
    company: "Meta",
    difficulty: "Medium",
    description: "Given an integer array nums and an integer k, return the kth largest element in the array. Note that it is the kth largest element in sorted order, not the kth distinct element.",
    topics: ["Heap", "Quickselect", "Sorting", "Array"],
  },
  {
    id: "min-window-substring",
    title: "Minimum Window Substring",
    company: "Meta",
    difficulty: "Hard",
    description: "Given two strings s and t of lengths m and n respectively, return the minimum window substring of s such that every character in t (including duplicates) is included in the window. If there is no such substring, return an empty string.",
    topics: ["Sliding window", "HashMap", "Strings", "Two pointers"],
  },
];

const MICROSOFT = [
  {
    id: "reverse-linked-list",
    title: "Reverse Linked List",
    company: "Microsoft",
    difficulty: "Easy",
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    topics: ["Linked list", "Recursion", "Iteration"],
  },
  {
    id: "lca-bt",
    title: "Lowest Common Ancestor of a Binary Tree",
    company: "Microsoft",
    difficulty: "Medium",
    description: "Given a binary tree, find the lowest common ancestor (LCA) of two given nodes in the tree. The lowest common ancestor is the lowest node that has both given nodes as descendants (where we allow a node to be a descendant of itself).",
    topics: ["Binary tree", "DFS", "Recursion"],
  },
  {
    id: "validate-bst",
    title: "Validate Binary Search Tree",
    company: "Microsoft",
    difficulty: "Medium",
    description: "Given the root of a binary tree, determine if it is a valid binary search tree (BST). A valid BST has each node's value strictly greater than all values in its left subtree and strictly less than all values in its right subtree.",
    topics: ["BST", "DFS", "In-order traversal", "Recursion"],
  },
  {
    id: "serialize-deserialize-bt",
    title: "Serialize and Deserialize Binary Tree",
    company: "Microsoft",
    difficulty: "Hard",
    description: "Design an algorithm to serialize and deserialize a binary tree. Serialization is converting a tree to a string; deserialization converts the string back. There is no restriction on how your algorithm should work.",
    topics: ["Tree traversal", "BFS/DFS", "String parsing", "Recursion"],
  },
];

const APPLE = [
  {
    id: "first-unique-char",
    title: "First Unique Character in a String",
    company: "Apple",
    difficulty: "Easy",
    description: "Given a string s, find the first non-repeating character in it and return its index. If it does not exist, return -1.",
    topics: ["HashMap", "Counting", "String"],
  },
  {
    id: "lru-cache",
    title: "LRU Cache",
    company: "Apple",
    difficulty: "Medium",
    description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement LRUCache class with get(key) and put(key, value) methods, both running in O(1) average time.",
    topics: ["HashMap + Doubly Linked List", "Design", "O(1) operations"],
  },
  {
    id: "copy-random-pointer",
    title: "Copy List with Random Pointer",
    company: "Apple",
    difficulty: "Medium",
    description: "A linked list of length n is given such that each node contains an additional random pointer that could point to any node in the list or null. Construct a deep copy of the list.",
    topics: ["Linked list", "HashMap", "Two-pass", "Cloning"],
  },
  {
    id: "basic-calculator",
    title: "Basic Calculator",
    company: "Apple",
    difficulty: "Hard",
    description: "Given a string s representing a valid expression, implement a basic calculator to evaluate it. The expression may contain '(', ')', '+', '-', non-negative integers, and empty spaces. You may NOT use any built-in eval.",
    topics: ["Stack", "Recursion", "String parsing", "Math"],
  },
];

export const PROBLEM_SOLVING_CATEGORIES = [
  { id: "amazon", label: "Amazon · Graphs", problems: AMAZON },
  { id: "google", label: "Google · DP", problems: GOOGLE },
  { id: "meta", label: "Meta · Arrays/Strings", problems: META },
  { id: "microsoft", label: "Microsoft · Trees", problems: MICROSOFT },
  { id: "apple", label: "Apple · Design DS", problems: APPLE },
];

export const PROBLEM_SOLVING_PROBLEMS = [...AMAZON, ...GOOGLE, ...META, ...MICROSOFT, ...APPLE];

export const PROBLEM_SOLVING_PHASE_PROMPTS = {
  clarify: (problem) => `You are a senior engineer at a MAANG company running a CODING (problem-solving) interview. The candidate was just handed:

"${problem.description}"

Expected topics/patterns: ${problem.topics.join(", ")}

You are in the CLARIFY phase. Your role:
- Play the interviewer who knows the problem. When the candidate asks a clarifying question, ANSWER it clearly (input format, constraints, edge cases, expected size of input, valid character sets, etc.).
- If the candidate restates the problem or confirms their understanding, acknowledge briefly.
- If they jump straight to coding/approach without clarifying, gently redirect: "Before we dive in, what would you like to clarify about the problem?"
- Do NOT reveal the optimal approach. Do NOT give hints.
- Keep responses under 50 words. Answer their question, nothing more.

PHASE ADVANCE: When the candidate has a clear grasp of input/output/constraints and at least one edge case, append <advance/> on its own line at the very end.`,

  approach: (problem) => `You are a senior engineer running a coding interview. Problem:

"${problem.description}"

Expected patterns: ${problem.topics.join(", ")}

You are in the APPROACH phase. This phase covers both the approach discussion AND optimization — do not treat them as separate. Your role:

APPROACH DISCUSSION:
- If the candidate hasn't started, ask: "What's your initial thought?"
- Let them describe their algorithm and data structures.
- Ask "What's the time and space complexity?" for every approach they mention.
- If they give a brute-force, ask: "Can we do better?" — probe once.
- Nudge them to name the pattern explicitly ("so this is BFS?" / "this is a sliding window?").

OPTIMIZATION — handle intelligently based on what the candidate already said:
- If the candidate ALREADY proposed an optimal solution in their initial approach (skipping brute-force), DO NOT ask "can we do better?" — they already showed that thinking. Instead, probe trade-offs: "Why this approach over [alternative]?" or "What's the bottleneck in the optimal solution?"
- If they reached the optimal via brute-force → optimal progression, acknowledge it: "Good, that's the optimal. What drove you from O(n²) to O(n)?"
- Probe real-world considerations ONCE: "How would this change if input were streaming?" or "Any space optimization possible?"
- NEVER penalize a candidate for reaching the optimal solution early. Reward it.

CRITICAL: Do NOT ask ONE question at a time when covering separate concerns. Cover approach → complexity → trade-offs → optimization considerations within this same phase.
Keep responses under 80 words.

PHASE ADVANCE RULES — follow strictly:
- Do NOT advance if the candidate is on a clearly suboptimal solution and a better one is known to exist. Keep probing: "Can we do better than O(n²)?" or "Is there a way to avoid scanning the array twice?" until they reach optimal or near-optimal.
- Do NOT advance just because the candidate stated complexity — complexity awareness alone is not enough if the solution is suboptimal.
- DO advance when: (a) the candidate is on the optimal or near-optimal approach, (b) they have correctly stated both time AND space complexity, and (c) they have discussed at least one trade-off or why this approach is preferred over a simpler one.
- If the candidate seems stuck on a suboptimal solution after 2-3 nudges, give one gentle hint ("Think about what data structure gives O(1) lookup") then advance if they still can't get there — don't block the interview indefinitely.

When advancing, append <advance/> on its own line at the very end of your response.`,

  implement: (problem, notepadContent) => `You are a senior engineer running a coding interview. Problem:

"${problem.description}"

${notepadContent ? `CURRENT NOTEPAD CONTENTS:\n---\n${notepadContent}\n---` : "The candidate's notepad is empty — they haven't started coding yet."}

You are in the IMPLEMENT phase. The candidate is writing code in the notepad. Your role:
- Observe but don't hover. Let them code. Keep responses minimal.
- If they pause and ask a question, answer briefly.
- If you spot a clear bug or typo in their notepad (from CURRENT NOTEPAD CONTENTS above), you can flag it ONCE: "I'm looking at your code — did you mean X on line Y?"
- If their code looks correct and complete, acknowledge: "Looks good. Let's test it."
- Do NOT rewrite their code. Do NOT write pseudocode for them.
- Keep responses under 50 words.

PHASE ADVANCE: When the code in the notepad looks complete (implements the discussed approach and compiles mentally), append <advance/> on its own line.`,

  test: (problem, notepadContent) => `You are a senior engineer running a coding interview. Problem:

"${problem.description}"

${notepadContent ? `CURRENT NOTEPAD CONTENTS:\n---\n${notepadContent}\n---` : ""}

You are in the TEST phase — the final phase. The candidate has written code. Your role:
- Ask them to trace through with a specific test case: "Let's run this with input X. Walk me through what happens."
- Push for edge cases: "What about empty input?" "What if the input is already sorted?" "What about duplicates?" "Integer overflow?"
- If they miss a bug while dry-running, point it out: "Hmm, walk me through that line again — what's the value of X there?"
- If their code handles all cases well, confirm briefly.
- Ask ONE question at a time. Keep responses under 60 words.

END OF INTERVIEW: When the candidate has dry-run the primary case and covered at least 2 edge cases (or found and fixed bugs), wrap up naturally — e.g., "Great session — solid approach and clean implementation." Then append <end-interview/> on its own line at the very end. This triggers automatic scoring.`,
};

export const PROBLEM_SOLVING_SCORING_PROMPT = (problem, transcript, language = "Java", notepadContent = null) => `You are evaluating a coding problem-solving interview. The problem was: "${problem.description}"

The candidate was working in ${language} — the reference solution you produce MUST be in ${language} (idiomatic, compiles mentally).

Interview transcript:
${transcript}${notepadContent ? `

Candidate's notepad (their actual code at end of interview):
\`\`\`${language.toLowerCase()}
${notepadContent}
\`\`\`

IMPORTANT: The notepad above IS the candidate's implementation — evaluate code_quality based on this code even if it wasn't fully discussed in the transcript. A candidate may paste or write code without narrating every line. Do NOT mark code_quality as "no code provided" if the notepad contains code.` : ""}

Score the candidate on these 5 dimensions (1-5 each, where 3 = meets bar, 4 = strong, 5 = exceptional):

Respond ONLY with valid JSON, no markdown backticks:
{
  "scores": {
    "clarification": { "score": <1-5>, "feedback": "<1 sentence>" },
    "approach_complexity": { "score": <1-5>, "feedback": "<1 sentence — approach quality and whether they correctly stated time/space complexity>" },
    "code_quality": { "score": <1-5>, "feedback": "<1 sentence — naming, structure, bugs>" },
    "testing_edge_cases": { "score": <1-5>, "feedback": "<1 sentence — dry run quality and edge case coverage>" },
    "optimization_depth": { "score": <1-5>, "feedback": "<1 sentence — IMPORTANT: reward candidates who discussed optimization DURING the approach phase, not just at the end. A candidate who immediately proposed the optimal solution and explained why should score 4-5. Only penalize if the candidate had no awareness of optimization at any point in the interview.>" }
  },
  "overall_verdict": "<STRONG_HIRE|HIRE|LEAN_HIRE|LEAN_NO_HIRE|NO_HIRE>",
  "summary": "<2-3 sentence overall assessment>",
  "top_strength": "<1 sentence>",
  "top_improvement": "<1 sentence>",
  "key_moments": [
    {
      "phase": "<clarify|approach|implement|test>",
      "question": "<the interviewer's question, near-verbatim>",
      "candidate_response": "<short summary of what the candidate said>",
      "expected_response": "<what a strong candidate would have said — specific and actionable>",
      "gap": "<1 sentence on what was wrong/missing; if positive, why it was strong>",
      "severity": "<major|minor|positive>"
    }
  ],
  "ideal_solution": {
    "summary": "<1-2 sentence sketch of the ideal solution>",
    "sections": [
      {"title": "Clarifying questions", "content": "<2-4 questions the candidate should ask before coding>"},
      {"title": "Approach", "content": "<the optimal algorithmic approach in 3-5 sentences, naming the data structure / pattern>"},
      {"title": "Code", "content": "<a clean reference solution in ${language}, idiomatic, wrapped in triple backticks with the language tag (e.g. \\\`\\\`\\\`${language.toLowerCase()})>"},
      {"title": "Complexity", "content": "<correct time and space complexity with one-line justification each>"},
      {"title": "Edge cases", "content": "<5-7 boundary cases worth testing>"},
      {"title": "Common pitfalls", "content": "<3-5 mistakes candidates typically make on this problem>"}
    ]
  }
}

GUIDELINES for key_moments: include 4-7 concrete moments. Mix at least 1 positive. "question" = the interviewer's actual prompt. "candidate_response" = short paraphrased summary. "expected_response" = specific (e.g., "should have stated O(m × n)" not "should have given correct complexity"). "severity": "major" = clearly wrong (e.g., wrong complexity, missing big edge case) · "minor" = partial / could be sharper · "positive" = strong moment to keep doing.

GUIDELINES for ideal_solution: be specific to THIS problem. Code section MUST be in ${language}, wrapped in triple backticks. Match idioms of ${language} (e.g. Java: explicit types, ArrayList/HashMap; Python: list comprehensions, type hints optional; C++: STL containers; Go: slices, maps with make).`;

/**
 * AI-generated coding problem prompt.
 * Produces a Medium or Hard DS/algo problem that's actually asked at MAANG —
 * NOT out-of-the-box creative (that's the SD track's thing). Variety comes
 * from rotating across patterns: DP, graphs, sliding window, trees, etc.
 */
export const PROBLEM_SOLVING_CREATIVE_PROMPT = {
  system: `You are a coding-interview problem generator for MAANG-level (Amazon, Google, Meta, Microsoft, Apple, Netflix, Uber, Stripe) interviews. You select a Medium or Hard problem that has actually been asked at those companies — NOT something exotic.

Problem characteristics:
1. Medium or Hard difficulty ONLY (never Easy)
2. Solvable in 30–45 minutes
3. Tests a specific DS/algo pattern — examples: BFS/DFS, topological sort, DP, sliding window, two pointers, binary search, tree traversal, BST, heap, graph, trie, greedy, monotonic stack, backtracking, union-find, bit manipulation
4. Clear problem statement WITH input/output format and 1–2 small examples

STYLE: Write like a real MAANG screener would. Examples of problems that qualify:
- "Longest Substring Without Repeating Characters" (Amazon) — sliding window
- "Course Schedule II" (Meta) — topological sort
- "Word Break II" (Google) — DP + backtracking
- "Meeting Rooms II" (Meta) — intervals + heap
- "Serialize and Deserialize Binary Tree" (Microsoft) — tree traversal
- "K Closest Points to Origin" (Amazon) — heap / quickselect
- "Decode Ways" (Meta) — DP
- "Number of Connected Components" (Amazon) — union-find
- "Sliding Window Maximum" (Google) — monotonic deque
- "Partition Equal Subset Sum" (Microsoft) — 0/1 knapsack DP

IMPORTANT: vary the pattern each time — don't default to graph traversal or DP every time. Pick from the full pattern list above.

Respond ONLY with valid JSON, no markdown backticks.`,

  user: `Generate ONE Medium or Hard coding problem that has been commonly asked at MAANG companies. Pick a DS/algo pattern you haven't picked recently and vary the company.

Respond ONLY with JSON, no backticks:
{
  "title": "<problem title>",
  "difficulty": "Medium" | "Hard",
  "company": "Amazon" | "Google" | "Meta" | "Microsoft" | "Apple" | "Netflix" | "Uber" | "Stripe",
  "description": "<full problem statement including input/output format and 1-2 short examples>",
  "topics": ["<pattern 1>", "<pattern 2>", "<pattern 3>", "<pattern 4>"]
}`,
};

export const PROBLEM_SOLVING_FALLBACK_SCORES = {
  scores: {
    clarification: { score: 3, feedback: "Decent clarification of constraints." },
    approach_complexity: { score: 3, feedback: "Approach was reasonable; complexity analysis was partial." },
    code_quality: { score: 3, feedback: "Code was workable with minor issues." },
    testing_edge_cases: { score: 3, feedback: "Some edge cases covered." },
    optimization_depth: { score: 3, feedback: "Discussed some optimizations." },
  },
  overall_verdict: "LEAN_HIRE",
  summary: "The candidate demonstrated reasonable problem-solving. Scoring was approximate due to a parsing issue.",
  top_strength: "Engaged well with the problem.",
  top_improvement: "Strengthen complexity analysis and edge-case coverage.",
  key_moments: [],
  ideal_solution: null,
};
