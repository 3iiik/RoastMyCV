# 🔥 RoastMyCV

Upload your resume (PDF), get it brutally roasted by AI, then receive a professionally rewritten version — all for free.

## Setup

1. Clone the repo:
   ```bash
   git clone <repo-url>
   cd RoastMyCV
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file and add your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. Start the server:
   ```bash
   node server.js
   ```

5. Open your browser:
   ```
   http://localhost:3000
   ```

## How It Works

1. Upload a PDF resume (max 10MB)
2. PDF.js extracts text directly in your browser
3. Click **"Roast My Resume"** → text is sent to `POST /api/roast`
4. Backend calls Google Gemini 1.5 Flash securely (API key stays on the server)
5. The brutal roast appears — then click **"Fix My Resume"**
6. Same text is sent to `POST /api/fix` → polished resume appears
7. Ko-fi support banner is shown after both results are revealed

## API Endpoints

| Method | Path         | Description                              |
|--------|-------------|------------------------------------------|
| POST   | `/api/roast` | Send `{ resumeText: "..." }`, get `{ text: "..." }` (roast) |
| POST   | `/api/fix`   | Send `{ resumeText: "..." }`, get `{ text: "..." }` (fixed) |

Rate limited to **10 requests per IP per hour** (each endpoint counts separately).

## Tech Stack

- **Frontend:** Vanilla HTML + CSS + JavaScript, PDF.js
- **Backend:** Node.js + Express
- **AI:** Google Gemini 1.5 Flash
- **Security:** API key stored in `.env`, never exposed to the client

## License

MIT
