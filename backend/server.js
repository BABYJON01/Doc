const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
// app.use('/api/ai', require('./routes/ai'));

app.get('/', (req, res) => {
  res.json({ message: 'Med-Zukkoo Full-Stack API is running', version: '2.0' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
