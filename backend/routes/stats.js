const express = require('express');
const router = express.Router();

// Mock data for XP growth (Last 7 days)
// In production, this would be a query to users/progress tables
router.get('/xp-history', (req, res) => {
    const data = [
        { day: 'Dush', xp: 1200 },
        { day: 'Sesh', xp: 1900 },
        { day: 'Chor', xp: 1700 },
        { day: 'Pay', xp: 2500 },
        { day: 'Jum', xp: 2100 },
        { day: 'Shan', xp: 3200 },
        { day: 'Yak', xp: 2800 },
    ];
    res.json(data);
});

// Mock data for Subject Proficiency
router.get('/subject-proficiency', (req, res) => {
    const data = [
        { subject: 'Kardiologiya', score: 85 },
        { subject: 'Farmakologiya', score: 45 },
        { subject: 'Anatomiya', score: 92 },
        { subject: 'Xirurgiya', score: 70 },
        { subject: 'Nevrologiya', score: 60 },
    ];
    res.json(data);
});

module.exports = router;
