import express from "express";
import fetch from "node-fetch";
import { config } from "dotenv";

config(); // Load .env

const app = express();
app.use(express.json({ limit: "1mb" }));

// Allow requests from Firebase Hosting and local dev
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",");
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes("*")) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PORT || 3001; // Cloud Run injects PORT

if (!ANTHROPIC_API_KEY) {
  // Warn but keep running — Cloud Run env vars may load after startup
  console.warn("[WARNING] ANTHROPIC_API_KEY is not set. API calls will fail until it is configured.");
}

// Proxy endpoint for Claude API
app.post("/api/chat", async (req, res) => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(500).json({ error: { message: "Proxy server error" } });
  }
});

app.listen(PORT, () => {
  console.log(`\n\x1b[32m✓ API proxy running on http://localhost:${PORT}\x1b[0m`);
  console.log(`  Proxying requests to Anthropic API\n`);
});
