# AI-Powered CV Chatbot with OpenAI and Replit

A professional CV website with an integrated AI chatbot that allows visitors to ask questions about your experience, skills, and background. The chatbot uses OpenAI's GPT models and is hosted securely on Replit, while your CV can be hosted on GitHub Pages.

## Overview

This project demonstrates how to create an interactive resume/CV with an AI assistant that:
- Displays your professional information in a clean, responsive design
- Provides a chat interface for visitors to ask questions
- Keeps your OpenAI API key secure on a backend server
- Works seamlessly between GitHub Pages (frontend) and Replit (backend)
- Includes rate limiting to control API usage costs

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  GitHub Pages   │────────>│  Replit Backend  │────────>│   OpenAI    │
│   (Frontend)    │  HTTPS  │   (API Server)   │   API   │     API     │
│   index.html    │<────────│   server.js      │<────────│             │
└─────────────────┘         └──────────────────┘         └─────────────┘
```

- **Frontend (GitHub Pages)**: Your CV HTML with embedded chatbot UI
- **Backend (Replit)**: Express.js server that securely calls OpenAI API
- **OpenAI API**: Generates intelligent responses based on your CV content

## Prerequisites

Before you begin, you need:

1. **GitHub Account** - To host your CV on GitHub Pages
2. **Replit Account** - Free account at [replit.com](https://replit.com)
3. **OpenAI API Key** - Get one at [platform.openai.com](https://platform.openai.com/api-keys)
4. Basic knowledge of editing HTML files

## Part 1: Setting Up the Replit Backend

### Step 1: Create a New Replit Project

1. Go to [replit.com](https://replit.com) and sign in
2. Click **"+ Create Repl"**
3. Select **"Node.js"** as the template
4. Name your project (e.g., "cv-chatbot-backend")
5. Click **"Create Repl"**

### Step 2: Install Required Packages

In the Replit Shell (terminal), run:

```bash
npm install express cors express-rate-limit
```

### Step 3: Add Your OpenAI API Key to Secrets

1. In your Replit project, find the **"Secrets"** tool (lock icon in the left sidebar)
2. Click **"+ New Secret"**
3. Set **Key**: `OPENAI_API_KEY`
4. Set **Value**: Your OpenAI API key (starts with `sk-...`)
5. Click **"Add Secret"**

**Important**: Never share this key or put it in your code!

### Step 4: Create the Backend Server

Create a file named `server.js` with this code:

```javascript
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration - allows GitHub Pages and other domains to call this API
const ALLOWED_ORIGINS = [
  "https://juliabaucher.github.io",  // Replace with YOUR GitHub Pages domain
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.static("."));

// Rate limiting: 50 requests per day per user
const chatLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 50,
  message: { error: "Too many requests, please try again tomorrow" }
});

app.get("/", (req, res) => {
  res.type("text/plain").send("CV Chatbot Backend is running");
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
  console.log(`🤖 Chat API available at /api/chat`);
});
```

**Important**: Replace `"https://juliabaucher.github.io"` with your actual GitHub Pages domain!

### Step 5: Update package.json

Make sure your `package.json` has this configuration:

```json
{
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5"
  }
}
```

### Step 6: Configure the Workflow

1. Click the **"Run"** or **"Deploy"** button in Replit
2. Your server should start and show: `✅ CV Chatbot server running on port 5000`
3. Copy your Replit domain (looks like: `https://xxxxx.replit.dev`)

### Step 7: Get Your Backend URL

Run this in the Replit Shell to get your domain:

```bash
echo $REPLIT_DEV_DOMAIN
```

Your backend URL will be: `https://[your-domain].replit.dev`

**Save this URL - you'll need it for the frontend!**

## Part 2: Setting Up the Frontend (GitHub Pages)

### Step 8: Add Chatbot to Your HTML

In your `index.html` file (on GitHub), add this chatbot code before the closing `</body>` tag:

```html
<!-- Chatbot Launcher Button -->
<div id="cv-cbLauncher" aria-label="Open chat" role="button" tabindex="0">
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 4h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9.5l-4.2 3.5a.75.75 0 0 1-1.3-.57V15H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM7 8.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm5 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm5 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z"/>
  </svg>
</div>
<div id="cv-cbOverlay" class="cv-cb-hidden" aria-hidden="true"></div>

<section id="cv-cbWindow" class="cv-cb-hidden" role="dialog" aria-label="AI chat" aria-modal="true">
  <header id="cv-cbHeader">
    <div id="cv-cbTitle">Chat with AI Assistant</div>
    <button id="cv-cbClose" aria-label="Close chat">
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path d="M6.4 6.4a1 1 0 0 1 1.4 0L12 10.6l4.2-4.2a1 1 0 0 1 1.4 1.4L13.4 12l4.2 4.2a1 1 0 1 1-1.4 1.4L12 13.4l-4.2 4.2a1 1 0 0 1-1.4-1.4L10.6 12 6.4 7.8a1 1 0 0 1 0-1.4z"/>
      </svg>
    </button>
  </header>
  
  <div id="cv-cbBody">
    <div id="cv-cbMsgs" aria-live="polite"></div>
    <form id="cv-cbForm">
      <input id="cv-cbInput" type="text" placeholder="Ask about experience, skills, availability…" required />
      <button id="cv-cbSend" type="submit">Send</button>
    </form>
  </div>
</section>

<script>
(function () {
  // REPLACE THIS WITH YOUR REPLIT BACKEND URL
  const BACKEND_URL = 'https://YOUR-REPLIT-DOMAIN.replit.dev/api/chat';
  
  // System prompt - customize this with your CV information
  const SYSTEM_PROMPT = \`You are an AI assistant for [YOUR NAME].
Speak professionally and concisely. Key facts:
- [Add your key experience points here]
- [Add your education here]
- [Add your skills here]
Answer questions about experience, skills, and background.\`;

  const d = document;
  const launcher = d.getElementById('cv-cbLauncher');
  const overlay = d.getElementById('cv-cbOverlay');
  const win = d.getElementById('cv-cbWindow');
  const closeBtn = d.getElementById('cv-cbClose');
  const msgsEl = d.getElementById('cv-cbMsgs');
  const formEl = d.getElementById('cv-cbForm');
  const inputEl = d.getElementById('cv-cbInput');
  const sendBtn = d.getElementById('cv-cbSend');

  const history = [{ role: 'system', content: SYSTEM_PROMPT }];

  function openChat() {
    launcher.classList.add('cv-cb-hidden');
    overlay.classList.remove('cv-cb-hidden');
    win.classList.remove('cv-cb-hidden');
    setTimeout(() => inputEl.focus(), 50);
  }

  function closeChat() {
    win.classList.add('cv-cb-hidden');
    overlay.classList.add('cv-cb-hidden');
    launcher.classList.remove('cv-cb-hidden');
  }

  function addBubble(role, text) {
    const wrap = d.createElement('div');
    wrap.className = \`cv-cb-bubble \${role}\`;
    const b = d.createElement('div');
    b.className = 'b';
    b.textContent = text;
    wrap.appendChild(b);
    msgsEl.appendChild(wrap);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  launcher.addEventListener('click', () => {
    openChat();
    if (history.length === 1) {
      addBubble('assistant', 'Hi! How can I help you today?');
    }
  });
  
  closeBtn.addEventListener('click', closeChat);
  overlay.addEventListener('click', closeChat);

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userText = inputEl.value.trim();
    if (!userText) return;

    addBubble('user', userText);
    history.push({ role: 'user', content: userText });
    inputEl.value = '';
    inputEl.disabled = true;
    sendBtn.disabled = true;

    try {
      const r = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Request failed');
      
      const reply = data.message || '(No reply)';
      addBubble('assistant', reply);
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      console.error(err);
      addBubble('assistant', 'Sorry, there was an error. Please try again.');
    } finally {
      inputEl.disabled = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  });
})();
</script>

<style>
/* Chatbot Styles */
:root {
  --cv-cb-accent: #3b82f6;
  --cv-cb-bg: #ffffff;
  --cv-cb-shadow: 0 10px 30px rgba(0,0,0,0.2);
  --cv-cb-z: 2147483000;
}

.cv-cb-hidden { display: none !important; }

#cv-cbLauncher {
  position: fixed;
  right: 16px;
  bottom: 16px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--cv-cb-bg);
  box-shadow: var(--cv-cb-shadow);
  z-index: var(--cv-cb-z);
  cursor: pointer;
  display: grid;
  place-items: center;
  border: 1px solid rgba(0,0,0,0.08);
}

#cv-cbLauncher svg { width: 28px; height: 28px; fill: #333; }

#cv-cbOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: calc(var(--cv-cb-z) + 1);
}

#cv-cbWindow {
  position: fixed;
  z-index: calc(var(--cv-cb-z) + 2);
  display: grid;
  grid-template-rows: auto 1fr;
  width: min(420px, 92vw);
  height: min(600px, 80vh);
  right: 16px;
  bottom: 84px;
  background: var(--cv-cb-bg);
  border-radius: 20px;
  box-shadow: var(--cv-cb-shadow);
  overflow: hidden;
}

#cv-cbHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f8fafc;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

#cv-cbTitle { font-weight: 600; font-size: 16px; color: #0f172a; }

#cv-cbClose {
  all: unset;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
}

#cv-cbBody {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

#cv-cbMsgs {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  font-size: 14px;
}

.cv-cb-bubble {
  margin: 8px 0;
  display: flex;
}

.cv-cb-bubble .b {
  max-width: 85%;
  padding: 10px 12px;
  border-radius: 12px;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.cv-cb-bubble.user {
  justify-content: flex-end;
}

.cv-cb-bubble.user .b {
  background: #111;
  color: #fff;
}

.cv-cb-bubble.assistant .b {
  background: #f1f5f9;
  color: #111;
}

#cv-cbForm {
  display: flex;
  gap: 8px;
  border-top: 1px solid #eee;
  padding: 12px;
}

#cv-cbInput {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

#cv-cbSend {
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  background: #111;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

#cv-cbSend:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
```

### Step 9: Update the Backend URL

In the script you just added, find this line:

```javascript
const BACKEND_URL = 'https://YOUR-REPLIT-DOMAIN.replit.dev/api/chat';
```

Replace `YOUR-REPLIT-DOMAIN.replit.dev` with your actual Replit domain from Step 7.

### Step 10: Customize the System Prompt

Update the `SYSTEM_PROMPT` with your actual CV information so the AI knows how to respond about you.

### Step 11: Commit and Push to GitHub

```bash
git add .
git commit -m "Add AI chatbot"
git push origin main
```

## Testing Your Chatbot

1. **Make sure your Replit server is running** (you should see it in your Replit workspace)
2. **Visit your GitHub Pages site** (e.g., `https://yourusername.github.io`)
3. **Click the chat button** in the bottom-right corner
4. **Ask a question** like "What is your experience?"
5. **You should get an AI-generated response!**

## Troubleshooting

### Problem: "Failed to fetch" error

**Solution**: Check that:
- Your Replit server is running
- The `BACKEND_URL` in your HTML matches your Replit domain exactly
- Your GitHub Pages domain is listed in `ALLOWED_ORIGINS` in `server.js`

### Problem: "CORS error" in browser console

**Solution**: Make sure your GitHub Pages URL is added to the `ALLOWED_ORIGINS` array in `server.js`:

```javascript
const ALLOWED_ORIGINS = [
  "https://YOUR-GITHUB-USERNAME.github.io",  // Add your domain here
];
```

### Problem: "OPENAI_API_KEY is not set"

**Solution**: 
1. Go to Replit Secrets (lock icon)
2. Verify `OPENAI_API_KEY` exists and has the correct value
3. Restart your Replit server

### Problem: Chatbot works in Replit but not on GitHub Pages

**Solution**:
1. Open browser Developer Tools (F12)
2. Check the Console tab for errors
3. Verify the fetch URL is correct
4. Make sure CORS is properly configured in `server.js`

### Problem: Push rejected by GitHub

**Solution**: Pull changes first, then push:

```bash
git pull --rebase origin main
git push origin main
```

## Cost Management

### Rate Limiting
The backend limits each user to 50 requests per day. Adjust this in `server.js`:

```javascript
const chatLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,  // 24 hours
  max: 50,  // Change this number
  message: { error: "Too many requests, please try again tomorrow" }
});
```

### Choose a Cheaper Model
In the fetch request, you can use `gpt-3.5-turbo` instead of `gpt-4o-mini` for lower costs:

```javascript
body: JSON.stringify({
  model: 'gpt-3.5-turbo',  // Cheaper alternative
  messages: history
})
```

### Monitor Usage
Check your OpenAI usage at: [platform.openai.com/usage](https://platform.openai.com/usage)

## Keeping Replit Running

**Important**: Free Replit projects sleep after inactivity. To keep your chatbot working:

1. **Upgrade to Replit Hacker plan** (recommended for production)
2. **Or use a service like UptimeRobot** to ping your Replit URL every 5 minutes

## Security Best Practices

✅ **DO**:
- Keep your OpenAI API key in Replit Secrets
- Use rate limiting to prevent abuse
- Monitor your OpenAI usage regularly
- Keep CORS restricted to your domains only

❌ **DON'T**:
- Put your API key directly in code
- Commit secrets to GitHub
- Allow unlimited API requests
- Share your API key with anyone

## Support

If you encounter issues:

1. Check the browser console for errors (F12 → Console tab)
2. Check Replit logs for server errors
3. Verify all URLs and domains are correct
4. Make sure your OpenAI API key is valid and has credits

## License

This project is open source and available for personal and commercial use.

## Credits

Built with:
- [OpenAI API](https://openai.com)
- [Replit](https://replit.com)
- [Express.js](https://expressjs.com)
- [GitHub Pages](https://pages.github.com)

---

**Happy coding! 🚀**