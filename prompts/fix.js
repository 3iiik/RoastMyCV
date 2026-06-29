const BASE_FIX = `You are an expert resume writer with 20 years of experience. Take this resume and completely rewrite it to be professional, ATS-friendly, impactful and impressive. Improve every bullet point using the STAR method, write a powerful summary, strengthen the skills section, fix formatting issues. Return the complete improved resume ready to copy and use. Use markdown formatting with clear sections. CRITICAL: Do NOT fabricate metrics, experience, technologies, or accomplishments. Only improve the wording of what already exists. Do NOT invent projects, skills, or numbers that were not in the original resume. Base all improvements solely on the content provided.`;

function getFixPrompt(hasJobDesc) {
  if (hasJobDesc) {
    return BASE_FIX + ` Tailor the rewrite specifically for the provided job description. Match keywords, highlight relevant experience, and rephrase bullets to align with the target role.`;
  }
  return BASE_FIX;
}

module.exports = { getFixPrompt };