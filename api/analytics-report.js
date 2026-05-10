// Vercel serverless function — AI-generated weekly analytics report

const TRACK_LABELS = {
  system_design: "System Design",
  behavioral: "Behavioral",
  problem_solving: "Problem Solving",
  low_level_design: "Low-Level Design",
};

function buildContext(dimensionAverages, recentFeedback, trendDirections, sessionCounts) {
  let ctx = "";
  for (const [track, dims] of Object.entries(dimensionAverages)) {
    const count = sessionCounts?.[track] || 0;
    const trend = trendDirections?.[track] || "unknown";
    ctx += `\n## ${TRACK_LABELS[track] || track} — ${count} session${count !== 1 ? "s" : ""}, trend: ${trend}\n`;
    for (const { avg, label } of Object.values(dims)) {
      ctx += `- ${label}: ${avg.toFixed(1)}/5\n`;
    }
  }
  if (recentFeedback?.length) {
    ctx += "\n## Recent Session Feedback\n";
    for (const fb of recentFeedback.slice(0, 10)) {
      ctx += `\n[${TRACK_LABELS[fb.track] || fb.track} — ${fb.date}]\n`;
      if (fb.summary)         ctx += `Summary: ${fb.summary}\n`;
      if (fb.top_improvement) ctx += `Key improvement area: ${fb.top_improvement}\n`;
      if (fb.top_strength)    ctx += `Top strength: ${fb.top_strength}\n`;
    }
  }
  return ctx;
}

const SYSTEM_PROMPT = `You are an expert software engineering interview coach. You analyze real interview performance data and generate personalized, specific weekly improvement plans.

Return ONLY a valid JSON object with this exact structure — no markdown, no explanation:
{
  "overall_summary": "2-3 sentences on the candidate's current state and #1 opportunity. Be direct and specific — reference actual scores.",
  "this_week_focus": "One specific, high-impact action for this week. Concrete, not generic.",
  "tracks": {
    "<track_id>": {
      "assessment": "1-2 sentence track-specific assessment referencing actual scores and feedback patterns.",
      "trend": "improving | declining | stable | insufficient_data",
      "gaps": [
        {
          "dimension_key": "<exact key from input>",
          "diagnosis": "2-3 sentences explaining WHY they score low here. Reference the actual feedback if present. Name the specific behavior to change.",
          "action_steps": [
            "Concrete step 1 — what to do in their very next interview",
            "Concrete step 2 — a specific practice technique",
            "Concrete step 3 — what to study or rehearse"
          ]
        }
      ],
      "strength_keys": ["<dimension_key>"]
    }
  }
}

Rules:
- Only include tracks that appear in the input
- Gaps: only dimensions scoring below 3.5, sorted by urgency (lowest score first), max 3 per track
- Strengths: dimensions scoring 4.0 or above
- Make diagnosis SPECIFIC to the feedback provided — do not give generic advice
- action_steps must be immediately actionable in the next interview session
- Return only the JSON object`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: "API key not configured" });

  const { dimensionAverages, recentFeedback, trendDirections, sessionCounts } = req.body || {};
  if (!dimensionAverages || !Object.keys(dimensionAverages).length) {
    return res.status(400).json({ error: "No performance data provided" });
  }

  try {
    const dataContext = buildContext(dimensionAverages, recentFeedback, trendDirections, sessionCounts);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Candidate performance data:\n${dataContext}\n\nGenerate the weekly improvement plan.`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);

    const text = data.content?.[0]?.text || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: "Could not parse AI response" });

    res.json({ report: JSON.parse(match[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
