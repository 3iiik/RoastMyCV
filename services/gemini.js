const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

async function callGemini(prompt, resumeText, jobDescription) {
  let fullPrompt = prompt;
  let context = resumeText;
  if (jobDescription && jobDescription.trim()) {
    context = `Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}`;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const response = await axios.post(url, {
    contents: [{ parts: [{ text: fullPrompt + '\n\n---\n' + context }] }]
  }, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 60000,
  });
  if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response from Gemini API');
  }
  return response.data.candidates[0].content.parts[0].text;
}

module.exports = { callGemini };