require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
  console.error('GEMINI_API_KEY is not set in .env file');
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

app.use('/api', require('./routes/api'));

app.listen(PORT, () => {
  console.log(`RoastMyCV running on http://localhost:${PORT}`);
});