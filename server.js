// server.js  (Node 18+ on Replit includes global fetch)
import express from "express";
import cors from "cors";

// -------------- CONFIG --------------
const app = express();

// Allow your CV site to call this API.
// Add your domains here (GitHub Pages, custom domain, etc.)
const ALLOW_ORIGINS = [
  "http://localhost:5500",                 // local dev (if you serve your CV locally)
  "https://juliabaucher.github.io/lab2/",        // your GitHub Pages site (example)
  "https://your-custom-domain.example"     // replace/add as needed
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOW_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Headers", "Content-Type, X-Client-Token");
  res.header("Access-Control-Allow-Methods", "OPTIONS, POST, GET");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

app.use(express.json({ limit: "1mb" }));

// Optional: simple shared secret to avoid public abuse
const CLIENT_TOKEN = process.env.CLIENT_TOKEN || ""; // set in Secrets tab

// -------------- ROUTES --------------

// Health check
app.get("/", (req, res) => {
  res.type("text/plain").send("OK: cv-chat-backend is running");
});

// Proxy endpoint to OpenAI
app.post("/chat", async (req, res) => {
  try {
    // Simple token check (optional but recommended)
    if (CLIENT_TOKEN) {
      const t =
        req.header("X-Client-Token") ||
        req.header("x-client-token") ||
        "";
      if (t !== CLIENT_TOKEN) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    const { messages, model = "gpt-4o-mini", temperature = 0.3, max_tokens = 500 } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not set on the server" });
    }

    // Call OpenAI
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens
      })
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data.error?.message || "OpenAI error" });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------- START SERVER --------------
// Replit provides PORT; must listen on 0.0.0.0 for the web preview to work.
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
