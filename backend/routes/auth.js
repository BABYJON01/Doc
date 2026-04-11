const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// @route   POST /api/auth/register
// @desc    Register a user (admin/teacher/student)
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;
    
    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Ushbu email allaqachon ro\'yxatdan o\'tgan' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await db.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, role, email',
      [full_name, email, password_hash, role || 'student']
    );

    res.json({ message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz', user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server xatoligi');
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const userFetch = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userFetch.rows.length === 0) {
      return res.status(400).json({ error: 'Email yoki parol noto\'g\'ri' });
    }

    const user = userFetch.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ error: 'Email yoki parol noto\'g\'ri' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'medzukkoo_super_secret',
      { expiresIn: '5 days' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, role: user.role, name: user.full_name });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server xatoligi');
  }
});

module.exports = router;
