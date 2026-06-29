function validateResumeText(text) {
  if (!text || typeof text !== 'string' || text.trim().length < 20) {
    return { valid: false, error: 'Please provide a valid resume with at least 20 characters.' };
  }
  return { valid: true, text: text.trim() };
}

function validateJobDescription(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return { valid: false };
  }
  if (text.trim().length < 10) {
    return { valid: false, error: 'Job description is too short. Please provide more details.' };
  }
  return { valid: true, text: text.trim() };
}

module.exports = { validateResumeText, validateJobDescription };