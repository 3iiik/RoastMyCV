require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// NEVER hardcode - loaded from .env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
  console.error('❌ GEMINI_API_KEY is not set in .env file. Please add your API key.');
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: { error: '⏳ Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
// app.use('/api/', limiter);

async function callGemini(prompt, resumeText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const response = await axios.post(url, {
    contents: [{
      parts: [{ text: prompt + '\n\n---\n' + resumeText }]
    }]
  }, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 60000,
  });

  if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response from Gemini API');
  }
  return response.data.candidates[0].content.parts[0].text;
}

const ROAST_PROMPT = `You are a brutally honest, funny career coach. Roast this resume with specific harsh but helpful criticism. Be funny, be mean but constructive. Point out every weakness, gap, vague description, cliche and red flag. Use emojis. Format with clear bold sections using markdown like: **Overall Impression**, **Work Experience**, **Skills**, **Education**, **Red Flags**.`;

const FIX_PROMPT = `You are an expert resume writer with 20 years of experience. Take this resume and completely rewrite it to be professional, ATS-friendly, impactful and impressive. Improve every bullet point using the STAR method, write a powerful summary, strengthen the skills section, fix formatting issues. Return the complete improved resume ready to copy and use. Use markdown formatting with clear sections.`;

async function handleApiCall(req, res, prompt) {
  try {
    const { resumeText } = req.body;

    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide a valid resume with at least 20 characters.' });
    }

    const text = await callGemini(prompt, resumeText);
    res.json({ text: text.trim() });
  } catch (err) {
    console.error('API error:', err.message);
    if (err.response?.status === 429) {
      return res.status(429).json({ error: 'Gemini is a bit busy right now. Please wait 1-2 minutes and try again. ⏳' });
    }
    if (err.response?.status === 403) {
      return res.status(500).json({ error: 'Invalid API key. Please check your GEMINI_API_KEY in .env' });
    }
    res.status(500).json({ error: 'Failed to analyze resume. Please try again.' });
  }
}

app.post('/api/roast', (req, res) => handleApiCall(req, res, ROAST_PROMPT));
app.post('/api/fix', (req, res) => handleApiCall(req, res, FIX_PROMPT));

app.listen(PORT, () => {
  console.log(`🔥 RoastMyCV server running on http://localhost:${PORT}`);
});
