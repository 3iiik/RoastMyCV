const CATEGORY_SCORE_PROMPT = `Analyze this resume and provide detailed category scores. Rate each category from 0 to 100. Base scores solely on the resume content provided. Do NOT fabricate or assume experience. Respond ONLY with valid JSON in this exact format (no other text, no markdown):
{
  "overall": 72,
  "categories": {
    "content": {"score": 82, "note": "Brief specific note about content quality"},
    "formatting": {"score": 74, "note": "Brief specific note about formatting"},
    "impact": {"score": 68, "note": "Brief specific note about bullet point impact"},
    "ats": {"score": 81, "note": "Brief specific note about keyword presence"},
    "readability": {"score": 90, "note": "Brief specific note about readability"}
  },
  "tips": ["4 concise actionable tips based on actual resume content"],
  "strengths": ["2-3 genuine strengths found in the resume"],
  "recruiterVerdict": {"wouldInterview": "YES or NO or MAYBE", "reason": "Concise reason based on actual content", "biggestReason": "Single biggest factor", "changeMyDecision": "What would change the verdict"}
}`;

const KEYWORD_MATCH_PROMPT = `Analyze this resume against the job description. Identify which keywords from the job description appear in the resume and which are missing. Base analysis solely on actual resume content. Do NOT fabricate keywords or match rates. Respond ONLY with valid JSON in this exact format (no other text, no markdown):
{
  "matched": ["React", "Node.js"],
  "missing": [
    {"keyword": "Docker", "why": "Reason this keyword matters based on the job description"},
    {"keyword": "AWS", "why": "Reason this keyword matters based on the job description"}
  ],
  "matchRate": 60
}`;

module.exports = { CATEGORY_SCORE_PROMPT, KEYWORD_MATCH_PROMPT };