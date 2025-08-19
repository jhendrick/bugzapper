const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// In-memory storage for top scores
let scores = [];

// In-memory storage for player statistics
let playerStats = [];

// Starting number of bullets fired
let bulletsfired = 0;

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

// Add a new score
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

// Clear all scores
app.get('/api/clearScores', (req, res) => {
  let scores = [];
  console.log('All scores cleared successfully');
  res.json({ message: 'All scores cleared successfully' });
});

// Add player statistics
app.post('/api/playerStats', (req, res) => {
  const { playerName, bulletsFired, asteroidsDestroyed, levelReached, timePlayed, score } = req.body;
  
  if (!playerName || typeof bulletsFired !== 'number' || typeof asteroidsDestroyed !== 'number' || 
      typeof levelReached !== 'number' || typeof timePlayed !== 'number' || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid player statistics data' });
  }

  let accuracy = null;

  // Make sure we don't divide by zero
  try {
    if (bulletsfired === 0) {
      throw new Error("Cannot divide by zero!"); // Throws a new Error object
    }
    accuracy = Math.max(0, Math.floor(asteroidsDestroyed / bulletsfired * 100));
  } catch (error) {
    console.error('Error calculating accuracy:', error);
  }

  // Add new player statistics with timestamp
  const newStats = {
    id: Date.now() + Math.random(),
    playerName: playerName.substring(0, 20), // Limit name length
    bulletsFired: Math.max(0, Math.floor(bulletsFired)),
    asteroidsDestroyed: Math.max(0, Math.floor(asteroidsDestroyed)),
    levelReached: Math.max(1, Math.floor(levelReached)),
    timePlayed: Math.max(0, Math.floor(timePlayed)), // in seconds
    score: Math.max(0, Math.floor(score)), // Ensure positive integer
    accuracy: accuracy,
    timestamp: new Date().toISOString()
  };
  
  playerStats.push(newStats);
  
  // Keep only the most recent 100 player statistics to prevent memory issues
  if (playerStats.length > 100) {
    playerStats = playerStats.slice(-100);
  }
  
  res.json(newStats);
});

// Get player statistics (most recent first)
app.get('/api/playerStats', (req, res) => {
  const recentStats = playerStats
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);
  res.json(recentStats);
});

app.listen(PORT, () => {
  console.log(`Asteroids game server running on http://localhost:${PORT}`);
});