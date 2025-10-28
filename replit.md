# Julia Baucher CV with AI Chatbot

## Overview
This is an interactive CV/resume website for Julia Baucher with an integrated AI chatbot powered by OpenAI. Visitors can read the CV and ask questions about Julia's experience, skills, and background through a chat interface.

## Recent Changes
- **2025-10-28**: Created backend server with OpenAI integration
  - Backend serves the CV HTML file
  - API endpoint `/api/chat` connects frontend to OpenAI
  - Secure API key management using Replit secrets
  - Rate limiting to prevent abuse (50 requests per day per user)

## Project Architecture

### Frontend (`index.html`)
- Professional CV layout with dark theme
- Language switcher (English/French)
- Embedded chatbot UI (bottom-right launcher button)
- JavaScript handles chat interactions and calls backend API

### Backend (`server.js`)
- Express.js server on port 5000
- Serves static HTML file
- `/api/chat` endpoint proxies requests to OpenAI API
- Rate limiting with express-rate-limit
- Secure secret management for OPENAI_API_KEY

### Key Features
1. **Bilingual CV**: Toggle between English and French versions
2. **AI Chatbot**: Ask questions about Julia's experience
3. **Secure API**: OpenAI key stored server-side in Replit secrets
4. **Rate Limiting**: 50 chat requests per day per user
5. **Responsive Design**: Works on desktop and mobile

## Environment Variables
- `OPENAI_API_KEY`: Required. Set in Replit Secrets tab
- `PORT`: Automatically set by Replit (defaults to 5000)

## How It Works

1. User visits the site and sees Julia's CV
2. User clicks the chat button (bottom-right corner)
3. User types a question about Julia's experience
4. Frontend sends request to `/api/chat` endpoint
5. Backend forwards request to OpenAI with system prompt
6. OpenAI generates response based on CV information
7. Backend returns formatted response to frontend
8. Chat displays the AI's answer

## Technologies
- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Backend**: Node.js, Express.js
- **AI**: OpenAI GPT-4o-mini
- **Security**: express-rate-limit, environment variables
- **Hosting**: Replit

## User Preferences
- Professional, concise responses
- Clean, modern design aesthetic
- Bilingual support (EN/FR)
