const express = require('express');
const router = express.Router();
const db = require('../db');

// @route   GET /api/courses
// @desc    Get all subjects and their topics
router.get('/', async (req, res) => {
  try {
    const subjects = await db.query('SELECT * FROM subjects');
    res.json(subjects.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server xatoligi');
  }
});

// @route   GET /api/courses/search
// @desc    Uzbek normalized fuzzy search (x/h, q/k handling)
router.get('/search', async (req, res) => {
  try {
    let { q } = req.query;
    if (!q) return res.json([]);

    // Normalize Uzbek specific characters for better matching
    // Replace x with h, q with k, o' with o, g' with g
    let normalizedQ = q.toLowerCase()
      .replace(/x/g, 'h')
      .replace(/q/g, 'k')
      .replace(/o'/g, 'o')
      .replace(/g'/g, 'g');

    // Using pg_trgm similarity for robust fuzzy search
    // We search across topics title and lessons title
    const searchQuery = `
      SELECT id, title, 'topic' as type, similarity(lower(title), $1) as sml 
      FROM topics 
      WHERE similarity(lower(title), $1) > 0.1
      UNION
      SELECT id, title, 'lesson' as type, similarity(lower(title), $1) as sml 
      FROM lessons 
      WHERE similarity(lower(title), $1) > 0.1
      ORDER BY sml DESC
      LIMIT 10;
    `;
    
    // In actual production, we might want to run this against a normalized column as well
    const results = await db.query(searchQuery, [normalizedQ]);
    
    res.json(results.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server xatoligi');
  }
});

// @route   GET /api/courses/topic/:topic_id/lessons
// @desc    Get lessons for a specific topic
router.get('/topic/:topic_id/lessons', async (req, res) => {
  try {
    const { topic_id } = req.params;
    const lessons = await db.query('SELECT id, title, video_url FROM lessons WHERE topic_id = $1', [topic_id]);
    res.json(lessons.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server xatoligi');
  }
});

module.exports = router;
