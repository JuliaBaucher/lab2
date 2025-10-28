import express from "express";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.static("."));

const chatLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 50,
  message: { error: "Too many requests, please try again tomorrow" }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/chat", chatLimiter, async (req, res) => {
  try {
    const { messages, model = "gpt-4o-mini", temperature = 0.7, max_tokens = 800 } = req.body || {};
    
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not set on the server" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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

    const data = await response.json();
    
    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.status(response.status).json({ 
        error: data.error?.message || "OpenAI API error" 
      });
    }

    const reply = data.choices?.[0]?.message?.content || "No response from AI";
    res.json({ message: reply });
    
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ CV Chatbot server running on port ${PORT}`);
  console.log(`📄 Serving index.html at http://localhost:${PORT}`);
  console.log(`🤖 Chat API available at /api/chat`);
});
