const express = require('express');
const router = express.Router();
const { callGemini } = require('../services/gemini');
const { getRoastPrompt } = require('../prompts/roast');
const { getFixPrompt } = require('../prompts/fix');
const { CATEGORY_SCORE_PROMPT, KEYWORD_MATCH_PROMPT } = require('../prompts/score');
const { validateResumeText, validateJobDescription } = require('../validators/resume');

async function handleApiCall(req, res, promptFn) {
  try {
    const { resumeText, jobDescription } = req.body;
    const validation = validateResumeText(resumeText);
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    const jdValidation = validateJobDescription(jobDescription);
    const prompt = typeof promptFn === 'function' ? promptFn(!!jdValidation.valid) : promptFn;

    const text = await callGemini(prompt, validation.text, jdValidation.valid ? jdValidation.text : null);
    res.json({ text: text.trim() });
  } catch (err) {
    console.error('API error:', err.message);
    if (err.response?.status === 429) {
      return res.status(429).json({ error: 'Gemini is a bit busy right now. Please wait 1-2 minutes and try again.' });
    }
    if (err.response?.status === 403) {
      return res.status(500).json({ error: 'Invalid API key. Please check your GEMINI_API_KEY in .env' });
    }
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Request timed out. Gemini took too long to respond. Please try again.' });
    }
    if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'Cannot reach Gemini API. Check your internet connection or VPN settings.' });
    }
    res.status(500).json({ error: 'Failed to analyze resume. Please try again.' });
  }
}

router.post('/roast', async (req, res) => {
  const level = req.body.roastLevel || 'brutal';
  return handleApiCall(req, res, getRoastPrompt(level));
});

router.post('/fix', async (req, res) => handleApiCall(req, res, getFixPrompt));

router.post('/analyze', async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    const validation = validateResumeText(resumeText);
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    const jdValidation = validateJobDescription(jobDescription);
    const hasJD = jdValidation.valid;

    const [scoreText, keywordText] = await Promise.all([
      callGemini(CATEGORY_SCORE_PROMPT, validation.text, hasJD ? jdValidation.text : null),
      hasJD ? callGemini(KEYWORD_MATCH_PROMPT, validation.text, jdValidation.text) : Promise.resolve(null),
    ]);

    const jsonMatch = scoreText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse score response');
    const parsed = JSON.parse(jsonMatch[0]);

    let keywordData = null;
    if (keywordText) {
      const kwMatch = keywordText.match(/\{[\s\S]*\}/);
      if (kwMatch) keywordData = JSON.parse(kwMatch[0]);
    }

    res.json({
      score: Math.max(0, Math.min(100, Math.round(parsed.overall || parsed.score))),
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 4) : [],
      categories: parsed.categories || null,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      recruiterVerdict: parsed.recruiterVerdict || null,
      keywords: keywordData,
    });
  } catch (err) {
    console.error('Analyze API error:', err.message);
    if (err.response?.status === 429) {
      return res.status(429).json({ error: 'Gemini is a bit busy right now. Please wait 1-2 minutes and try again. ⏳' });
    }
    return res.status(500).json({
      score: null, tips: null, categories: null,
      strengths: [], recruiterVerdict: null, keywords: null,
    });
  }
});

module.exports = router;