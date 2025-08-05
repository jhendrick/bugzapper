const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// In-memory storage for scores
let scores = [];

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/api/scores', (req, res) => {
  // Return top 10 scores sorted by score (descending)
  const topScores = scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  res.json(topScores);
});

app.post('/api/scores', (req, res) => {
  const { playerName, score } = req.body;
  
  if (!playerName || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid player name or score' });
  }
  
  // Add new score with timestamp
  const newScore = {
    id: Date.now() + Math.random(),
    playerName: playerName.substring(0, 20), // Limit name length
    score: Math.max(0, Math.floor(score)), // Ensure positive integer
    timestamp: new Date().toISOString()
  };
  
  scores.push(newScore);
  
  // Keep only top 100 scores to prevent memory issues
  if (scores.length > 100) {
    scores = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);
  }
  
  res.json(newScore);
});

app.listen(PORT, () => {
  console.log(`Asteroids game server running on http://localhost:${PORT}`);
});